// client/src/pages/PatientChat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { Send, Bot, User, AlertTriangle } from 'lucide-react';

// Connect to Node.js WebSocket server
const socket = io('http://localhost:5000');

const PatientChat = () => {
  const { id } = useParams(); // The prescriptionId from the URL
  const [messages, setMessages] = useState([
    { sender: 'ai', text: "Hello! I am your AI Medical Assistant. I have your prescription details ready. What questions do you have about your medication today?" }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Join the specific prescription room
    socket.emit('join_chat', id);

    // Listen for incoming messages
    socket.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off('receive_message');
    };
  }, [id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim() === '') return;

    // We don't update state here; we wait for the server to emit it back to ensure sync
    socket.emit('send_message', { prescriptionId: id, text: input });
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 border-x border-gray-200">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-md flex items-center gap-3">
        <Bot size={24} />
        <div>
          <h2 className="font-bold">MediFlow Assistant</h2>
          <p className="text-xs opacity-80">Prescription Ref: {id.slice(-6).toUpperCase()}</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'patient' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
              msg.sender === 'patient' ? 'bg-blue-600 text-white rounded-tr-none' : 
              msg.sender === 'system' ? 'bg-red-100 text-red-800 border border-red-300' :
              'bg-white text-gray-800 border border-gray-200 rounded-tl-none shadow-sm'
            }`}>
              {msg.sender === 'system' && <AlertTriangle size={16} className="inline mr-2 mb-1" />}
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your medicine..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500"
        />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors">
          <Send size={20} className="ml-1" />
        </button>
      </form>
    </div>
  );
};

export default PatientChat;