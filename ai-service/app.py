import os
import json
import logging
import numpy as np
import httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

# --- CONFIGURATION ---
OLLAMA_URL = "http://localhost:11434/api"
DB_FILE = "medical_db.json"
EMBED_MODEL = "nomic-embed-text"
CHAT_MODEL = "phi3"

# Logger for precision tracking
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AI_Engine")

# --- GLOBAL MEMORY STORE (RAM) ---
# We store vectors in RAM to avoid slow disk reads on every request.
vector_store = {
    "texts": [],
    "embeddings": None  # Will be a NumPy Matrix
}

# --- LIFESPAN MANAGER (Startup/Shutdown) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Load DB into RAM at startup
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, "r") as f:
                data = json.load(f)
                if data:
                    vector_store["texts"] = [item["text"] for item in data]
                    # Convert list of lists to a fast NumPy Matrix
                    matrix = np.array([item["embedding"] for item in data], dtype='float32')
                    # Normalize for faster Cosine Similarity later
                    norm = np.linalg.norm(matrix, axis=1, keepdims=True)
                    vector_store["embeddings"] = matrix / (norm + 1e-10)
                    logger.info(f"✅ Loaded {len(data)} records into RAM.")
        except Exception as e:
            logger.error(f"❌ DB Load Error: {e}")
    
    yield
    
    # (Optional) Cleanup logic here
    logger.info("🛑 Shutting down AI Service.")

app = FastAPI(lifespan=lifespan)

# --- ASYNC OLLAMA CLIENT ---
async def get_embedding(text: str) -> np.ndarray:
    """Async call to Ollama for embeddings."""
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(f"{OLLAMA_URL}/embeddings", json={
                "model": EMBED_MODEL,
                "prompt": text
            }, timeout=10.0)
            res.raise_for_status()
            vector = res.json()["embedding"]
            # Return normalized numpy array
            vec = np.array(vector, dtype='float32')
            return vec / (np.linalg.norm(vec) + 1e-10)
        except Exception as e:
            logger.error(f"⚠️ Embedding Failed: {e}")
            return np.array([])

async def chat_with_ollama(prompt: str) -> str:
    """Async call to Ollama for generation."""
    # INCREASED TIMEOUT TO 300 SECONDS (5 Minutes)
    async with httpx.AsyncClient(timeout=300.0) as client: 
        try:
            res = await client.post(f"{OLLAMA_URL}/generate", json={
                "model": CHAT_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.1,
                    "num_ctx": 4096 # Increased context window for longer summaries
                }
            }, timeout=300.0) 
            
            res.raise_for_status()
            return res.json()["response"]
        except Exception as e:
            logger.error(f"⚠️ Chat Generation Failed: {e}")
            return "{}"

# --- HIGH-SPEED VECTOR SEARCH (NumPy) ---
def search_db(query_vec: np.ndarray, top_k: int = 2) -> str:
    """
    Performs Matrix Multiplication (Dot Product) for instant search.
    O(1) complexity relative to Python loops.
    """
    if vector_store["embeddings"] is None or len(vector_store["texts"]) == 0:
        return ""

    # 1. Calculate Cosine Similarity (Dot product of normalized vectors)
    # query_vec is (1, D), embeddings is (N, D) -> Result is (N,)
    scores = np.dot(vector_store["embeddings"], query_vec)

    # 2. Get indices of top_k highest scores
    top_indices = np.argsort(scores)[-top_k:][::-1]

    # 3. Retrieve text
    results = []
    for idx in top_indices:
        if scores[idx] > 0.4: # Similarity Threshold
            results.append(vector_store["texts"][idx])
            
    return "\n".join(results)

# --- DATA MODELS ---
class KnowledgeRequest(BaseModel):
    text: str

class PrescriptionRequest(BaseModel):
    description: str

class PatientProfile(BaseModel):
    firstName: str
    lastName: str
    medicalHistory: List[dict] = []
    allergies: List[dict] = []

class SummaryRequest(BaseModel):
    patient_profile: PatientProfile

class SafetyRequest(BaseModel):
    patient_profile: PatientProfile
    new_meds: List[dict]

class TrendRequest(BaseModel):
    recent_diagnoses: List[str]

# --- NEW DATA MODEL FOR CHAT ---
class QueryRequest(BaseModel):
    query: str

# ==========================================
# ENDPOINTS
# ==========================================

@app.post("/api/rag/ingest")
async def ingest_knowledge(req: KnowledgeRequest):
    """
    Ingests data, saves to disk, AND updates RAM instantly.
    """
    logger.info(f"📥 Ingesting: {req.text[:30]}...")
    
    # 1. Get raw vector
    async with httpx.AsyncClient() as client:
        res = await client.post(f"{OLLAMA_URL}/embeddings", json={"model": EMBED_MODEL, "prompt": req.text})
        raw_vec = res.json()["embedding"]
    
    # 2. Save to Disk (Persistence)
    entry = {"text": req.text, "embedding": raw_vec}
    
    current_data = []
    if os.path.exists(DB_FILE):
        with open(DB_FILE, "r") as f:
            current_data = json.load(f)
    
    current_data.append(entry)
    with open(DB_FILE, "w") as f:
        json.dump(current_data, f)
        
    # 3. Update RAM (Hot Reload)
    vector_store["texts"].append(req.text)
    
    new_vec_np = np.array(raw_vec, dtype='float32')
    norm = np.linalg.norm(new_vec_np)
    new_vec_norm = new_vec_np / (norm + 1e-10)
    
    if vector_store["embeddings"] is None:
        vector_store["embeddings"] = np.array([new_vec_norm])
    else:
        vector_store["embeddings"] = np.vstack([vector_store["embeddings"], new_vec_norm])

    return {"status": "success", "total_docs": len(vector_store["texts"])}

@app.post("/api/rag/suggest-rx")
async def suggest_prescription(req: PrescriptionRequest):
    # 1. Parallelize Search and Embedding
    query_vec = await get_embedding(req.description)
    if query_vec.size == 0:
        return {"suggestions": []}

    context = search_db(query_vec)
    if not context:
        context = "Use standard medical guidelines."

    # 2. Optimized Prompt for Machine Precision
    prompt = f"""
    SYSTEM: You are a precise medical assistant API. 
    CONTEXT: {context}
    PATIENT COMPLAINT: {req.description}
    
    TASK: Suggest 2 safe medications.
    FORMAT: JSON ONLY. No markdown, no conversational text.
    EXAMPLE: {{ "suggestions": [{{ "name": "DrugX", "dosage": "500mg", "freq": "1-0-1", "dur": "5 Days" }}] }}
    """
    
    response = await chat_with_ollama(prompt)
    
    # Robust JSON Extraction
    try:
        start = response.find('{')
        end = response.rfind('}') + 1
        if start != -1 and end != -1:
            return json.loads(response[start:end])
    except Exception as e:
        logger.error(f"JSON Parse Error: {e}")
    
    return {"suggestions": []}

@app.post("/api/summary")
async def generate_summary(req: SummaryRequest):
    p = req.patient_profile
    
    prompt = f"""
    SYSTEM: Summarize patient history for a doctor.
    DATA: {p.firstName} {p.lastName}, History: {str(p.medicalHistory)[:1000]}, Allergies: {str(p.allergies)}
    
    TASK: Return JSON with summary, risks, and actions.
    FORMAT: JSON ONLY.
    EXAMPLE: {{ "summary": "...", "risk_factors": ["..."], "suggested_actions": ["..."] }}
    """
    
    response = await chat_with_ollama(prompt)
    
    try:
        start = response.find('{')
        end = response.rfind('}') + 1
        if start != -1 and end != -1:
            return json.loads(response[start:end])
    except:
        pass
    return {"summary": "Summary unavailable.", "risk_factors": [], "suggested_actions": []}

@app.post("/api/safety-check")
async def safety_check(req: SafetyRequest):
    prompt = f"""
    SYSTEM: Drug Interaction Checker.
    ALLERGIES: {req.patient_profile.allergies}
    PROPOSED MEDS: {req.new_meds}
    
    TASK: Check for severe interactions or allergies.
    FORMAT: JSON ONLY: {{ "safe": boolean, "warnings": ["string"] }}
    """
    response = await chat_with_ollama(prompt)
    try:
        start = response.find('{')
        end = response.rfind('}') + 1
        return json.loads(response[start:end])
    except:
        return {"safe": True, "warnings": ["Automated check failed."]}

@app.post("/api/analyze-trends")
async def analyze_trends(req: TrendRequest):
    if not req.recent_diagnoses:
        return {"trend": "Insufficient data", "alert": "No recent cases"}

    # Intelligent Prompt
    prompt = f"""
    SYSTEM: Analyze these recent clinic cases: {", ".join(req.recent_diagnoses)}.
    TASK: Identify the dominant health trend.
    OUTPUT JSON ONLY: {{ "trend": "e.g. Rising cases of Viral Flu", "alert": "e.g. Stock up on Paracetamol" }}
    """
    
    response = await chat_with_ollama(prompt)
    
    try:
        start = response.find('{')
        end = response.rfind('}') + 1
        return json.loads(response[start:end])
    except:
        return {"trend": "Stable", "alert": "Standard operations"}

# --- NEW ENDPOINT: RAG CHAT (The Brain) ---
@app.post("/api/rag/query")
async def rag_query(req: QueryRequest):
    logger.info(f"🧠 Thinking: {req.query}")
    
    # 1. Search Vector DB for context
    query_vec = await get_embedding(req.query)
    if query_vec.size == 0:
        return {"answer": "I'm having trouble processing that thought."}
        
    context = search_db(query_vec, top_k=3)
    
    if not context:
        context = "No specific patient history found in memory."

    # 2. Ask the LLM
    prompt = f"""
    SYSTEM: You are an intelligent medical assistant. Use the retrieved context to answer the doctor's question.
    If the answer is not in the context, say "I don't see that in the records."
    
    CONTEXT_MEMORY:
    {context}
    
    DOCTOR'S QUESTION: {req.query}
    
    ANSWER (Keep it short and clinical):
    """
    
    response = await chat_with_ollama(prompt)
    
    # Clean up response (sometimes models add quotes)
    clean_response = response.strip().strip('"')
    return {"answer": clean_response}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)