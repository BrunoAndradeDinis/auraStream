'use server';
/**
 * @fileOverview A Genkit flow that generates creative and rhythmic descriptions for music tracks.
 *
 * - generateCreativeTrackDescription - A function that handles the track description generation process.
 * - GenerateCreativeTrackDescriptionInput - The input type for the generateCreativeTrackDescription function.
 * - GenerateCreativeTrackDescriptionOutput - The return type for the generateCreativeTrackDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCreativeTrackDescriptionInputSchema = z.object({
  title: z.string().describe('The title of the music track.'),
  artist: z.string().describe('The artist of the music track.'),
  genre: z.string().describe('The genre of the music track.'),
});
export type GenerateCreativeTrackDescriptionInput = z.infer<
  typeof GenerateCreativeTrackDescriptionInputSchema
>;

const GenerateCreativeTrackDescriptionOutputSchema = z.object({
  description: z
    .string()
    .describe('A creative and rhythmic description for the music track.'),
});
export type GenerateCreativeTrackDescriptionOutput = z.infer<
  typeof GenerateCreativeTrackDescriptionOutputSchema
>;

export async function generateCreativeTrackDescription(
  input: GenerateCreativeTrackDescriptionInput
): Promise<GenerateCreativeTrackDescriptionOutput> {
  return generateCreativeTrackDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCreativeTrackDescriptionPrompt',
  input: {schema: GenerateCreativeTrackDescriptionInputSchema},
  output: {schema: GenerateCreativeTrackDescriptionOutputSchema},
  prompt: `You are a professional music critic and poet, tasked with creating captivating, rhythmic, and creative descriptions for music tracks. The description should be engaging and suitable for display on a miniplayer overlay.

Craft a description that highlights the essence of the track, its mood, and its unique qualities, while keeping it concise and impactful.

Do not include any conversational text or intros/outros; just provide the description itself.

Track Title: {{{title}}}
Artist: {{{artist}}}
Genre: {{{genre}}}`,
});

const generateCreativeTrackDescriptionFlow = ai.defineFlow(
  {
    name: 'generateCreativeTrackDescriptionFlow',
    inputSchema: GenerateCreativeTrackDescriptionInputSchema,
    outputSchema: GenerateCreativeTrackDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
