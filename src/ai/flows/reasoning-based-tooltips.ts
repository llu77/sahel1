'use server';

/**
 * @fileOverview Generates tooltips for request submissions based on the request type and field.
 *
 * - generateTooltip - A function that generates the tooltip.
 * - TooltipInput - The input type for the generateTooltip function.
 * - TooltipOutput - The return type for the generateTooltip function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TooltipInputSchema = z.object({
  requestType: z
    .string()
    .describe('The type of request the user is submitting (e.g., leave, advance, resignation, overtime).'),
  field: z.string().describe('The specific form field for which the tooltip is needed (e.g., startDate, amount, reason).'),
});
export type TooltipInput = z.infer<typeof TooltipInputSchema>;

const TooltipOutputSchema = z.object({
  tooltipText: z.string().describe('The generated tooltip text that provides guidance to the user for the specified request type and field.'),
});
export type TooltipOutput = z.infer<typeof TooltipOutputSchema>;

export async function generateTooltip(input: TooltipInput): Promise<TooltipOutput> {
  return generateTooltipFlow(input);
}

const prompt = ai.definePrompt({
  name: 'tooltipPrompt',
  input: {schema: TooltipInputSchema},
  output: {schema: TooltipOutputSchema},
  config: {
    temperature: 0.05,
  },
  prompt: `You are an AI assistant designed to generate informative tooltips for a request submission form.

  The user is submitting a request of type: {{{requestType}}}
  The tooltip is needed for the field: {{{field}}}

  Consider relevant legal and policy-based considerations to provide clear and concise guidance to the user.
  Omit any irrelevant information and focus on providing the most helpful and relevant tooltip text for the given request type and field.

  Generate the tooltip text:
`,
});

const generateTooltipFlow = ai.defineFlow(
  {
    name: 'generateTooltipFlow',
    inputSchema: TooltipInputSchema,
    outputSchema: TooltipOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
