'use server';

/**
 * @fileOverview Summarizes user-submitted location descriptions for quick understanding.
 *
 * - summarizeLocationDetails - A function that summarizes the location details.
 * - SummarizeLocationDetailsInput - The input type for the summarizeLocationDetails function.
 * - SummarizeLocationDetailsOutput - The return type for the summarizeLocationDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeLocationDetailsInputSchema = z.object({
  description: z.string().describe('The user-submitted description of the location.'),
});
export type SummarizeLocationDetailsInput = z.infer<typeof SummarizeLocationDetailsInputSchema>;

const SummarizeLocationDetailsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the location details.'),
});
export type SummarizeLocationDetailsOutput = z.infer<typeof SummarizeLocationDetailsOutputSchema>;

export async function summarizeLocationDetails(input: SummarizeLocationDetailsInput): Promise<SummarizeLocationDetailsOutput> {
  return summarizeLocationDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeLocationDetailsPrompt',
  input: {schema: SummarizeLocationDetailsInputSchema},
  output: {schema: SummarizeLocationDetailsOutputSchema},
  prompt: `Summarize the following location description in one sentence:\n\n{{{description}}}`,
});

const summarizeLocationDetailsFlow = ai.defineFlow(
  {
    name: 'summarizeLocationDetailsFlow',
    inputSchema: SummarizeLocationDetailsInputSchema,
    outputSchema: SummarizeLocationDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
