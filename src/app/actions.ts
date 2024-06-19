"use server"
import prisma from '@/lib/prisma'
import { extract, toMarkdown } from '@/lib/format'
import { Ollama } from 'ollama'
import { createStreamableValue } from 'ai/rsc'

export async function recommend(messages: Message[]) {
  const ollama = new Ollama({ host: (process.env.OLLAMA_SCHEME || 'http')+'://'+(process.env.OLLAMA_HOST || 'localhost')+':'+(process.env.OLLAMA_PORT || 11434) })
  const embedding = await ollama.embeddings({ model: process.env.EMBEDDING_MODEL || 'not-defined', prompt: messages[messages.length - 1].content })

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
      1 - (embedding <=> ${embedding['embedding']}::vector) as similarity
    FROM watches
    ORDER BY  similarity DESC
    LIMIT 5;
    `

  const stream = createStreamableValue('')
  const message = {
    'role': 'user',
    'content': `
You are an helpful AI that will recommend watches to the user.

The watch selected is below with its attributes as a list.
Your response is a markdown document.
Write a paragraph of why this watch matches their request using the watch attributes.

The recommended watch is:

${toMarkdown(watches[0])}.

Create a table of the following data titled as alternatives:

${watches.map((watch: Watch) => extract(watch)).join('\n')}
`,
  };
  (async () => {
    // Update the stream with all the watches[0] properties in a markdown table
    stream.append(toMarkdown(watches[0]))
    stream.append(`\n\n\n\n`)

    const response = await ollama.chat({ model: process.env.CHAT_MODEL || 'not-defined', messages: [message], stream: true })
    for await (const part of response) {
      stream.update(part.message.content)
    }
    stream.done()
  })()

  return { output: stream.value }
}
