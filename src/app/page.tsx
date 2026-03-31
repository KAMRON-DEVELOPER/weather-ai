'use client';

import { useState } from 'react';

import { AIMessage, HumanMessage, BaseMessage } from '@langchain/core/messages';
import { ResponseFormat } from '@/utils/types';

export default function Home() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<BaseMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

      console.log(`handleSubmit: ${JSON.stringify(data)}`);

      // Last AI message from LangGraph state
      const aiMessages = data?.messages?.filter((m: any) => m?.kwargs?.name === 'model' || m?.id?.includes('AIMessage'));
      const lastAI = aiMessages?.[aiMessages.length - 1];
      const content = lastAI?.kwargs?.content ?? 'No response';

      setMessages((prev) => [...prev, new AIMessage(content)]);
    } catch (e) {
      console.log(`handleSubmit error: ${JSON.stringify(e)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const structuredResponse: ResponseFormat | null = null;

  return (
    <div
      className='flex flex-col justify-between items-center gap-8 py-8 min-h-screen'
      suppressHydrationWarning={true}>
      <header className='text-center'>
        <h1>🌤 Weather AI</h1>
        <p>Ask about weather anywhere in the world</p>
      </header>

      {/* Messages */}
      <div className='w-full max-w-2xl flex-1 overflow-auto px-4'>
        {messages.length === 0 && <p className='text-center text-gray-500'>Ask a question to start...</p>}

        {messages.map((msg, i) => {
          const isHuman = ['human', 'user'].includes(msg.type);
          return (
            <div
              key={i}
              className={`mb-6 ${isHuman ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block max-w-[80%] p-4 rounded-2xl ${isHuman ? 'bg-indigo-600 text-white' : 'bg-gray-900'}`}>
                <strong>{isHuman ? 'You' : 'Weather AI'}:</strong>
                <p className='mt-1 whitespace-pre-wrap'>{typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content, null, 2)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <footer>
        <div className='space-x-4'>
          <input
            className='border border-indigo-800 rounded-full p-3 min-w-sm md:min-w-lg'
            type='text'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder='Ask about the weather anywhere…'
            disabled={isLoading}
          />
          <button
            className='p-2 bg-indigo-900 rounded-full border border-indigo-800'
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}>
            {isLoading ? '…' : 'Ask from AI'}
          </button>
        </div>
      </footer>
    </div>
  );
}
