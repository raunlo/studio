
'use server';
/**
 * @fileOverview A flow for finding predefined checklist items.
 *
 * - findPredefinedItems - A function that finds predefined items based on a query.
 * - FindPredefinedItemsInput - The input type for the findPredefinedItems function.
 * - FindPredefinedItemsOutput - The return type for the findPredefinedItems function.
 */

import {ai} from '@/ai/genkit';
import {getPredefinedItems, PredefinedChecklistItem} from '@/lib/knowledge-base';
import {z} from 'genkit';

const FindPredefinedItemsInputSchema = z.object({
  query: z.string().describe('The user query to search for.'),
});
export type FindPredefinedItemsInput = z.infer<
  typeof FindPredefinedItemsInputSchema
>;

const FindPredefinedItemsOutputSchema = z.object({
  items: z
    .array(
      z.object({
        key: z.string().describe('The unique key of the predefined item.'),
        text: z.string().describe('The text/title of the predefined item.'),
        subItems: z
          .array(z.string())
          .describe('A list of sub-item texts.'),
      })
    )
    .describe(
      'A list of 0-3 matching predefined items from the knowledge base.'
    ),
});
export type FindPredefinedItemsOutput = z.infer<
  typeof FindPredefinedItemsOutputSchema
>;

export async function findPredefinedItems(
  input: FindPredefinedItemsInput
): Promise<FindPredefinedItemsOutput> {
  return findPredefinedItemsFlow(input);
}

const systemPrompt = `You are an expert at searching and finding relevant items from a knowledge base.
You will be given a user's query and a list of available predefined checklist items.
Your task is to find the most relevant items from the list that match the user's query.
Return up to 3 relevant items. If no items are relevant, return an empty list.
You must return objects with the 'key', 'text', and 'subItems' properties.

Here are the available predefined checklist items:
${JSON.stringify(getPredefinedItems(), null, 2)}
`;

const prompt = ai.definePrompt({
  name: 'findPredefinedItemsPrompt',
  input: {schema: FindPredefinedItemsInputSchema},
  output: {schema: FindPredefinedItemsOutputSchema},
  system: systemPrompt,
  prompt: `User Query: {{{query}}}`,
});

const findPredefinedItemsFlow = ai.defineFlow(
  {
    name: 'findPredefinedItemsFlow',
    inputSchema: FindPredefinedItemsInputSchema,
    outputSchema: FindPredefinedItemsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    // If the model returns a null output, return an empty list of items.
    return output || { items: [] };
  }
);
