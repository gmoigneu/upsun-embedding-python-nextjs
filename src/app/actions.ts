"use server"
import prisma from '@/lib/prisma';
import { extract, toMarkdown } from '@/lib/format';
import { HfInference } from '@huggingface/inference';
import { createStreamableValue } from 'ai/rsc';

export async function recommend(messages: Message[]) {

  const prompt = messages[messages.length - 1].content
  
  const inference = new HfInference(process.env.HUGGINGFACE_TOKEN);
  const embedding = await inference.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: prompt,
  });

  // Query the database for similar watches
  const watches: Watch[] = await prisma.$queryRaw`
    SELECT
      brand,
      model,
      case_material,
      strap_material,
      movement_type,
      water_resistance,
      case_diameter_mm,
      case_thickness_mm,
      band_width_mm,
      dial_color,
      crystal_material,
      complications,
      power_reserve,
      price_usd,
      1 - (embedding <=> ${embedding}::vector) as similarity
    FROM watches
    ORDER BY  similarity DESC
    LIMIT 5;
    `
  
  const stream = createStreamableValue('');
  (async () => {

    const watch = toMarkdown(watches[0])
    const messages = [
      {
        'role': 'user',
        'content': `You are an helpful AI that will recommend watches to the user. Your responses are formatted as Markdown documents.` + prompt,
      },
      {
        'role': 'assistant',
        'content': `
Here is the watch that I would recommend:

${watch}
        `,
      },
      {
        'role': 'user',
        'content': `Based on my initial request, can you very briefly justify why you think this watch is a good fit for me in one paragraph?`
      }
    ]
    let answer = ''
    for await (const chunk of inference.chatCompletionStream({
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      messages: messages,
      max_tokens: 500,
      temperature: 0,
    })) {
      stream.update(chunk.choices[0].delta.content!);
      answer += chunk.choices[0].delta.content!;
    }

    messages.push({
      'role': 'assistant',
      'content': answer,
    });

    // Update the stream with all the watches[0] properties in a markdown table
    stream.update(`\n\n---\n` + watch + `\n---\n`)
    messages.push({
      'role': 'user',
      'content': `Create a table of the following data titled as alternatives: ${watches.map((watch: Watch) => extract(watch)).join('\n')}. Don't add any other information. Do not comment.`,
    });
    for await (const chunk of inference.chatCompletionStream({
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      messages: messages,
      max_tokens: 500,
      temperature: 0,
    })) {
      stream.update(chunk.choices[0].delta.content!);
    }

    stream.done();
  })();

  return { output: stream.value };
}