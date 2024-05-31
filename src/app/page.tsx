'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChat } from 'ai/react';
import { use, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  const [answer, setAnswer] = useState('');
  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        setAnswer(lastMessage.content);
      }
    }
  }, [messages])
  
  return (
    <div className="flex flex-col w-full max-w-xl py-24 mx-auto stretch">
      <div className="grid w-full gap-2">
        <h1 className="text-4xl mb-8 text-center">⌚ Watch Finder</h1>
        <form onSubmit={handleSubmit}>
          <Textarea 
            value={input}
            onChange={handleInputChange}
            placeholder="Describe the watch you are looking for..." 
            />
          <Button 
            type="submit"
            className='w-full mt-4'
            disabled={isStreaming || input === ''}
            >Find a watch!</Button>
        </form>
        <div className="p-4 rounded-sm my-8 bg-gray-100 prose lg:prose-md w-full text-left">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
          >
            {answer}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}