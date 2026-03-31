'use client';
import { useState, useRef, useEffect } from 'react';
import { AIMessage, HumanMessage, BaseMessage } from '@langchain/core/messages';

export default function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<BaseMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = new HumanMessage(input);
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      const data = await res.json();

      // Extract the last AI message content more reliably
      const aiMessages = data?.messages?.filter((m: any) => m?.kwargs?.name === 'model' || m?.id?.includes('AIMessage'));
      const lastAI = aiMessages?.[aiMessages.length - 1];
      const content = lastAI?.kwargs?.content ?? lastAI?.content ?? 'Sorry, something went wrong.';

      setMessages((prev) => [...prev, new AIMessage({ content })]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [...prev, new AIMessage({ content: 'Oops, I ran into an error. Try again?' })]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex flex-col min-h-screen bg-zinc-950 text-zinc-100'>
      {/* Header */}
      <header className='border-b border-zinc-800 bg-zinc-900 py-4 px-4 sticky top-0 z-10'>
        <div className='max-w-3xl mx-auto flex items-center gap-3'>
          <div className='text-3xl'>🌤</div>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>Weather AI</h1>
            <p className='text-zinc-400 text-sm'>Real talk about the weather, anywhere</p>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className='flex-1 overflow-y-auto p-4 max-w-3xl mx-auto w-full'>
        {messages.length === 0 && (
          <div className='flex flex-col items-center justify-center h-full text-center py-12'>
            <div className='text-6xl mb-6 opacity-70'>☀️</div>
            <p className='text-zinc-400 max-w-xs'>Ask me about the weather in Tashkent, Beruniy, or anywhere else in the world.</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isHuman = msg._getType() === 'human';
          return (
            <div
              key={i}
              className={`mb-8 flex ${isHuman ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] sm:max-w-[75%] md:max-w-[65%] rounded-3xl px-5 py-4 ${
                  isHuman ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-zinc-800 rounded-bl-none'
                }`}>
                <strong className='text-xs opacity-70 block mb-1'>{isHuman ? 'You' : 'Weather AI'}</strong>
                <div className='whitespace-pre-wrap text-[15px] leading-relaxed'>
                  {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content, null, 2)}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className='flex justify-start mb-8'>
            <div className='bg-zinc-800 rounded-3xl px-5 py-4 rounded-bl-none'>
              <div className='flex items-center gap-2 text-zinc-400'>
                <span className='animate-pulse'>●</span>
                <span className='animate-pulse animation-delay-200'>●</span>
                <span className='animate-pulse animation-delay-400'>●</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className='border-t border-zinc-800 bg-zinc-900 p-4 sticky bottom-0'>
        <div className='max-w-3xl mx-auto'>
          <div className='flex gap-3'>
            <input
              className='flex-1 bg-zinc-800 border border-zinc-700 focus:border-indigo-500 rounded-full px-6 py-4 text-base placeholder-zinc-500 focus:outline-none'
              type='text'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())}
              placeholder='Ask about the weather anywhere...'
              disabled={isLoading}
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading || !input.trim()}
              className='bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 px-8 rounded-full font-medium transition-colors flex items-center justify-center min-w-13'>
              {isLoading ? '…' : '→'}
            </button>
          </div>
          <p className='text-center text-[10px] text-zinc-500 mt-3'>Powered by Groq • Open-Meteo</p>
        </div>
      </div>
    </div>
  );
}
