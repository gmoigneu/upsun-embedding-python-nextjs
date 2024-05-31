import prisma from '@/lib/prisma';
import { openai } from '@ai-sdk/openai';
import { embed, streamText } from 'ai';
import { extract, toMarkdown } from '@/lib/format';

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Let's create the embedding for our query
  const embedding = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: messages[messages.length - 1].content,
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
      1 - (embedding <=> ${embedding.embedding}::vector) as similarity
    FROM watches
    ORDER BY  similarity DESC
    LIMIT 5;
    `
  // Let's pre
  const result = await streamText({
    model: openai('gpt-4o'),
    messages: [
      {
        'role': 'system',
        'content': "You are an helpful AI that will recommend watches to the user. The watch selected is below with its attributes as a list. Your response is a markdown document.First, output the brand and model of the watch as a title.  Second, send the user a bullet list view of the watch attributes without doing any modification. Then, add a paragrah of why this watch matches their request using the watch attributes."
      },
      {
        'role': 'user',
        'content': `The recommended watch is: ${toMarkdown(watches[0])}. Create a table of the following data titled as alternatives: ${watches.map((watch: Watch) => extract(watch)).join('\n')}`
      },
    ],
  });

  return result.toAIStreamResponse();
}