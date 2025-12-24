'use server';

/**
 * @fileOverview An AI agent that generates relevant hashtags based on a location description and image.
 *
 * - generateHashtags - A function that generates hashtags for a location post.
 * - GenerateHashtagsInput - The input type for the generateHashtags function.
 * - GenerateHashtagsOutput - The return type for the generateHashtags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateHashtagsInputSchema = z.object({
  description: z.string().describe('The description of the location.'),
  photoDataUri: z
    .string()
    .describe(
      "A photo of the location, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  country: z.string().describe('The country of the location.'),
  cityOrTown: z.string().describe('The city or town of the location.'),
});
export type GenerateHashtagsInput = z.infer<typeof GenerateHashtagsInputSchema>;

const GenerateHashtagsOutputSchema = z.object({
  hashtags: z.array(z.string()).describe('An array of relevant hashtags.'),
});
export type GenerateHashtagsOutput = z.infer<typeof GenerateHashtagsOutputSchema>;

export async function generateHashtags(input: GenerateHashtagsInput): Promise<GenerateHashtagsOutput> {
  return generateHashtagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHashtagsPrompt',
  input: {schema: GenerateHashtagsInputSchema},
  output: {schema: GenerateHashtagsOutputSchema},
  prompt: `You are a social media expert specializing in generating relevant hashtags for travel posts.

  Given the following location description, photo, country, and city/town, generate an array of relevant hashtags to increase the post's visibility.

  Description: {{{description}}}
  Photo: {{media url=photoDataUri}}
  Country: {{{country}}}
  City/Town: {{{cityOrTown}}}

  Hashtags should be relevant to the location, the activity, and the type of traveler who would be interested in this location.
  Do not include hashtags that are too general, such as #travel or #photography.
  Do not include hashtags that are not relevant to the location or the activity.
  The hashtags should be short and easy to remember.
  The hashtags should be in lowercase.

  Return the hashtags as a JSON array of strings.
  `,
});

const generateHashtagsFlow = ai.defineFlow(
  {
    name: 'generateHashtagsFlow',
    inputSchema: GenerateHashtagsInputSchema,
    outputSchema: GenerateHashtagsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
