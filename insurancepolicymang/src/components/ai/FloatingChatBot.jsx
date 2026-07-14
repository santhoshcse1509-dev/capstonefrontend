import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, X, MessageSquare } from 'lucide-react';
import { useNotification } from '../../hooks/useNotification';

const RAG_BASE_URL = "http://127.0.0.1:8000";

export default function FloatingChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [thinking, setThinking] = useState(false);
  const [unread, setUnread] = useState(true);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const notification = useNotification();
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hi! I am your InsurePro Virtual Assistant. Ask me anything about our policies, claims process, or underwriting requirements!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  useEffect(() => {
    if (isOpen) {
      setUnread(false);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setInputValue("");

    // Add user message
    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: userText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    setThinking(true);

    try {
      const response = await fetch(`${RAG_BASE_URL}/bot/fixed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: userText
        })
      });

      if (!response.ok) {
        throw new Error("Chatbot API response error.");
      }

      const data = await response.json();
      if (data.status) {
        setMessages(prev => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: data.BOT,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        notification.error(data.message || "Unable to generate a response.");
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'bot',
          text: "I'm having trouble connecting to the document AI server. Please make sure the local Python FastAPI server is running on port 8000.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window Popup */}
      {isOpen && (
        <div className="mb-4 w-96 h-[500px] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform scale-100 origin-bottom-right">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                {!avatarFailed ? (
                  <img
                    src="/chatbot_avatar.png"
                    alt="AI Assistant"
                    className="w-10 h-10 rounded-full border-2 border-white/50 bg-white object-cover"
                    onError={() => setAvatarFailed(true)}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full border-2 border-white/50 bg-indigo-500 text-white flex items-center justify-center font-bold text-xs">
                    IP
                  </div>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-indigo-600 rounded-full animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-wide">InsurePro Support</h3>
                <span className="text-[10px] text-emerald-100 flex items-center gap-1">
                  Online · RAG Database
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-white/20 transition-all text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-55/30">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <span className={`text-[9px] block text-right mt-1 ${isUser ? 'text-blue-100' : 'text-slate-400 font-semibold'}`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              );
            })}
            {thinking && (
              <div className="flex justify-start">
                <div className="p-3 rounded-2xl rounded-bl-none bg-slate-100 text-slate-800 border border-slate-200 shadow-sm flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-blue-600" />
                  <span className="text-xs font-semibold text-slate-500">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question..."
              disabled={thinking}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-sm text-slate-800 transition-all"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || thinking}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 shadow-2xl text-white transition-all duration-300 active:scale-95 focus:outline-none border-4 border-white overflow-hidden"
      >
        {isOpen ? (
          <X size={26} className="transition-transform duration-300" />
        ) : (
          <div className="w-full h-full relative flex items-center justify-center">
            {!avatarFailed ? (
              <img
                src="/chatbot_avatar.png"
                alt="Chat"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <MessageSquare size={24} className="text-white" />
            )}
          </div>
        )}

        {/* Pulse Ring when unread */}
        {unread && !isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
          </span>
        )}
      </button>
    </div>
  );
}
