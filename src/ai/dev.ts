import 'dotenv/config';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});

export const generateCreativeTrackDescriptionFlow = ai.defineFlow(
  {
    name: 'generateCreativeTrackDescriptionFlow',
    inputSchema: z.object({
      title: z.string(),
      artist: z.string(),
      genre: z.string(),
    }),
    outputSchema: z.object({
      description: z.string(),
    }),
  },
  async (input) => {
    const response = await ai.generate({
      prompt: `Generate a 2-line poetic description (max 120 chars) for a song titled '${input.title}' by ${input.artist}, genre: ${input.genre}. Write in English, atmospheric and evocative.`,
    });
    return { description: response.text };
  }
);
