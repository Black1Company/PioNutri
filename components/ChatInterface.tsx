import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { chatWithAssistant } from '../services/gemini';
import { GenerateContentResponse } from '@google/genai';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const ChatInterface: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'model', text: 'Olá! Sou o assistente virtual do Diogenes Pio. Como posso te ajudar com dúvidas sobre nutrição hoje?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare history for Gemini
      const history = messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
      }));

      // Create a placeholder for the streaming response
      const responseId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: responseId, role: 'model', text: '' }]);

      const streamResult = await chatWithAssistant(userMsg.text, history);
      
      let fullText = '';
      
      for await (const chunk of streamResult) {
          const c = chunk as GenerateContentResponse;
          const chunkText = c.text || '';
          fullText += chunkText;
          
          setMessages(prev => 
            prev.map(msg => 
                msg.id === responseId ? { ...msg, text: fullText } : msg
            )
          );
      }

    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: 'Desculpe, tive um problema ao processar sua pergunta. Tente novamente.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-teal-600 p-4 text-white flex items-center gap-2 shadow-md z-10">
        <Bot className="w-6 h-6" />
        <h3 className="font-bold">Chat Educacional - Diogenes Pio Nutri</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-500' : 'bg-teal-600'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
              </div>
              <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                msg.role === 'user' 
                  ? 'bg-indigo-500 text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1].role === 'user' && (
             <div className="flex justify-start">
                <div className="flex max-w-[80%] gap-2 flex-row">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-teal-600">
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                     <div className="p-3 rounded-2xl bg-white text-slate-500 border border-slate-200 rounded-tl-none italic text-sm">
                        Digitando...
                     </div>
                </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre alimentos, dietas ou saúde..."
            disabled={isLoading}
            className="w-full pl-4 pr-12 py-3 bg-slate-100 border-transparent focus:bg-white border focus:border-teal-500 rounded-full outline-none transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 p-1.5 bg-teal-600 text-white rounded-full hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;