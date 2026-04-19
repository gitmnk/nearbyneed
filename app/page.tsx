'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ResourceCard from '@/components/ResourceCard';
import { rankResources, ResourceResult, Resource } from '@/lib/resourceUtils';
import rawResources from '../data/resources.json';
import { parseIntent } from '@/lib/llmApiWrapper';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export default function Home() {
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [resources, setResources] = useState<ResourceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'initial', role: 'assistant', text: 'Hi. Tell me what you need right now.' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<{type: string | null, urgency: number}>({ type: null, urgency: 5 });
  const [totalTokens, setTotalTokens] = useState({ prompt: 0, completion: 0, total: 0 });
  const [lastPrompt, setLastPrompt] = useState<string>('');

  const processResources = useCallback((lat: number, lng: number, filterType: string | null) => {
    try {
      setLoading(true);
      const ranked = rankResources(rawResources as Resource[], lat, lng, filterType);
      
      // If AI determined high urgency, we could boost 'OPEN_NOW' heavily here,
      // but for now, we rely on the existing good ranking logic.

      setResources(ranked);
      setError(null);
    } catch (err) {
      setError('Unable to load resources. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          processResources(latitude, longitude, currentFilter.type);
        },
        (err) => {
          setError('Location access denied. Showing results for San Francisco.');
          const defaultLat = 37.7794;
          const defaultLng = -122.4168;
          setLocation({ lat: defaultLat, lng: defaultLng });
          processResources(defaultLat, defaultLng, currentFilter.type);
        }
      );
    } else {
      setError('Geolocation not supported by your browser.');
    }
  }, [currentFilter.type, processResources]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMsg = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userMsg }]);
    
    setIsTyping(true);

    try {
      // 1. Ask Gemini what the user needs
      const intent = await parseIntent(userMsg);
      
      // 2. Add Gemini's empathetic response to chat
      setMessages(prev => [...prev, { id: 'ast-' + Date.now(), role: 'assistant', text: intent.needs }]);
      
      // 3. Update the data filter
      setCurrentFilter({ type: intent.type, urgency: intent.urgency });

      // 4. Update the token debugger
      if (intent.usage) {
        setTotalTokens(prev => ({
          prompt: prev.prompt + intent.usage!.promptTokens,
          completion: prev.completion + intent.usage!.completionTokens,
          total: prev.total + intent.usage!.totalTokens
        }));
      }
      if (intent.rawPrompt) {
        setLastPrompt(intent.rawPrompt);
      }

    } catch (err) {
      setMessages(prev => [...prev, { id: 'err-' + Date.now(), role: 'assistant', text: "I'm having trouble analyzing that, but here is what I found." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <header className="bg-white border-b border-slate-200 shrink-0 px-4 py-4 shadow-sm z-10 w-full relative">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-blue-600 tracking-tighter">NearbyNeed</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full uppercase tracking-wider">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Live Feed
          </div>
        </div>
      </header>

      {/* Floating Debug Window */}
      <div className="fixed top-20 right-4 bg-slate-900/90 text-slate-300 text-[10px] p-3 rounded-lg border border-slate-700 shadow-2xl z-50 backdrop-blur-sm pointer-events-none w-64 max-h-[80vh] flex flex-col font-mono">
        <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2 shrink-0">
          <span className="font-bold text-slate-100">LLM Debug</span>
          <span className="text-green-400">● Live</span>
        </div>
        
        <div className="space-y-1 shrink-0 mb-3">
          <div className="flex justify-between"><span>Prompt:</span> <span>{totalTokens.prompt}</span></div>
          <div className="flex justify-between"><span>Response:</span> <span>{totalTokens.completion}</span></div>
          <div className="flex justify-between pt-1 border-t border-slate-700 font-bold text-slate-100"><span>Total:</span> <span>{totalTokens.total}</span></div>
        </div>

        {lastPrompt && (
          <div className="border-t border-slate-700 pt-2 flex flex-col min-h-0">
            <span className="font-bold text-slate-100 mb-1 shrink-0">Latest Payload:</span>
            <div className="overflow-y-auto min-h-0 bg-slate-950/50 p-2 rounded">
              <pre className="text-[8px] leading-relaxed text-blue-300 whitespace-pre-wrap break-words">
                {lastPrompt}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Main scrolling content area */}
      <main className="flex-1 overflow-y-auto w-full relative">
        <div className="max-w-md mx-auto px-4 py-6 flex flex-col min-h-full">
          
          {/* Chat Transcript Log */}
          <div className="flex flex-col gap-4 mb-8">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white font-medium rounded-tr-sm' 
                    : 'bg-white border border-slate-200 text-slate-700 shadow-sm rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-200/50 text-slate-500 px-4 py-3 rounded-2xl rounded-tl-sm text-sm animate-pulse flex gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}/>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}/>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}/>
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 flex-1"></div> {/* Spacer to push resources to bottom if needed */}

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-bold mb-6 flex items-start gap-3">
               <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
               </svg>
               {error}
            </div>
          )}

          <div className="mb-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">Results near you</h2>
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-slate-200/50 animate-pulse h-32 rounded-xl border border-slate-200" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col">
                {resources.length > 0 ? (
                  resources.slice(0, 5).map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))
                ) : (
                  <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-300">
                    <p className="text-slate-500 text-sm">No exact matches found. Try broadening your request.</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
        </div>
      </main>

      {/* Fixed bottom chat input */}
      <div className="bg-white border-t border-slate-200 p-4 shrink-0 pb-8 sm:pb-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
        <form onSubmit={handleSend} className="max-w-md mx-auto relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isTyping}
            placeholder="Type your needs here..."
            className="w-full bg-slate-100 border-none rounded-full py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow disabled:opacity-50 text-slate-800 placeholder:text-slate-400"
          />
          <button 
            type="submit" 
            disabled={!inputText.trim() || isTyping}
            className="absolute right-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-2.5 rounded-full transition-colors"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 ml-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0112 4.5c4.542 0 8.94.8 13.08 2.378M6 12l-2.731 8.874a59.768 59.768 0 0013.08-2.378M6 12h10" />
            </svg>
          </button>
        </form>
      </div>

    </div>
  );
}

