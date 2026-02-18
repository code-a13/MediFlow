export const DANGEROUS_PAIRS = {
  "aspirin": ["warfarin", "heparin", "ibuprofen"],
  "warfarin": ["aspirin", "ibuprofen", "paracetamol"], 
  "paracetamol": ["alcohol", "isoniazid", "warfarin"],
  "amoxicillin": ["methotrexate"],
  "sildenafil": ["nitroglycerin"] 
};

export const checkInteraction = (newDrug, currentMeds) => {
  if (!newDrug) return [];
  const normalizedNew = newDrug.toLowerCase().trim();
  const conflicts = [];

  currentMeds.forEach(med => {
    const activeDrugRaw = med.drugName || med.name || ""; 
    const activeDrug = activeDrugRaw.toLowerCase().trim();
    if (!activeDrug) return;

    if (DANGEROUS_PAIRS[normalizedNew]?.includes(activeDrug)) {
      conflicts.push(`⚠️ DANGER: '${newDrug}' interacts with '${activeDrugRaw}'!`);
    }
    if (DANGEROUS_PAIRS[activeDrug]?.includes(normalizedNew)) {
      conflicts.push(`⚠️ DANGER: '${activeDrugRaw}' interacts with '${newDrug}'!`);
    }
  });
  return [...new Set(conflicts)];
};