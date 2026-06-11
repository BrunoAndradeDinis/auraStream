import { NextRequest, NextResponse } from 'next/server'
import { gemini15Pro, googleAI } from '@genkit-ai/googleai'
import { genkit } from 'genkit'

const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
  model: gemini15Pro,
});

interface TrackMetadata {
  title: string
  artist: string
  genre: string
}

export async function POST(request: NextRequest) {
  try {
    const body: TrackMetadata = await request.json()

    if (!body.title || !body.artist || !body.genre) {
      return NextResponse.json(
        { error: 'Missing required fields: title, artist, genre' },
        { status: 400 },
      )
    }

    const description = await generateAIDescription(body)

    return NextResponse.json({ description }, { status: 200 })
  } catch (error) {
    console.error('Error in generate-description endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 },
    )
  }
}

async function generateAIDescription(metadata: TrackMetadata): Promise<string> {
  const prompt = `Generate a 2-line poetic description (max 120 chars) for a song titled '${metadata.title}' by ${metadata.artist}, genre: ${metadata.genre}. Write in English, atmospheric and evocative.`;
  
  try {
    const response = await ai.generate(prompt);
    return response.text;
  } catch (error) {
    console.error('Genkit error:', error);
    // Fallback if genkit fails
    return `A mesmerizing ${metadata.genre.toLowerCase()} journey through sonic landscapes, crafted by ${metadata.artist} as "${metadata.title}".`;
  }
}
