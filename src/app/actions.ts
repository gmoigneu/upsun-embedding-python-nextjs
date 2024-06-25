"use server"
import prisma from '@/lib/prisma';
import { extract, toMarkdown } from '@/lib/format';
import { HfInference } from '@huggingface/inference';
import { createStreamableValue } from 'ai/rsc';

export async function recommend(messages: Message[]) {
  
  const inference = new HfInference(process.env.HUGGINGFACE_TOKEN);
  const embedding = await inference.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: messages[messages.length - 1].content,
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

    // Update the stream with all the watches[0] properties in a markdown table
    stream.append(toMarkdown(watches[0]))
    stream.append(`\n\n\n\n`)

    for await (const chunk of inference.chatCompletionStream({
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      messages: [
        {
          'role': 'user',
          'content': `You are an helpful AI that will recommend watches to the user. The watch selected is below with its attributes as a list. Your response is a markdown document. Write a paragrah of why this watch matches their request using the watch attributes. The recommended watch is: ${toMarkdown(watches[0])}. Create a table of the following data titled as alternatives: ${watches.map((watch: Watch) => extract(watch)).join('\n')}`
        }
      ],
      max_tokens: 500,
      temperature: 0,
    })) {
      stream.update(chunk.choices[0].delta.content!);
    }
    stream.done();
  })();

  return { output: stream.value };
}