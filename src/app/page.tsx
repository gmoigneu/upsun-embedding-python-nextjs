'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { recommend } from './actions';
import { readStreamableValue } from 'ai/rsc';

export default function Chat() {
  const [answer, setAnswer] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false)

  const handleSubmit = async (e :any) => {
    e.preventDefault();
    setAnswer('');
    setIsStreaming(true);
    const { output } = await recommend([
      {
        role: 'user',
        content: prompt
      }
    ]);

    for await (const delta of readStreamableValue(output)) {
      setAnswer(currentGeneration => `${currentGeneration}${delta}`);
    }
    setIsStreaming(false);
  };
  
  return (
    <div className="flex flex-col w-full max-w-xl py-24 mx-auto stretch">
      <div className="grid w-full gap-2">
        <h1 className="text-4xl mb-8 text-center">⌚ Watch Finder</h1>
        <form onSubmit={handleSubmit}>
          <Textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the watch you are looking for..." 
            />
          <Button 
            type="submit"
            className='w-full mt-4'
            disabled={isStreaming || prompt === ''}
            >Find a watch!</Button>
        </form>
        { answer.length > 0 && (
          <div className="p-4 rounded-sm my-8 bg-gray-100 prose lg:prose-md w-full text-left">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
            >
              {answer}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}