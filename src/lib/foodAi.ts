import { z } from 'zod'
import { askClaude } from './anthropic'

const FoodEstimateSchema = z.object({
  calories: z.number().describe('total calories for this exact serving'),
  protein: z.number().describe('grams of protein for this exact serving'),
  carbs: z.number().describe('grams of carbohydrates for this exact serving'),
  fat: z.number().describe('grams of fat for this exact serving'),
})

export type FoodEstimate = z.infer<typeof FoodEstimateSchema>

/** Estimates macros for an arbitrary, free-text quantity (e.g. "2 tbsp", "1 medium banana", "6oz grilled") rather than a fixed 100g/serving basis. */
export async function estimateFoodMacros(name: string, servingSize: string): Promise<FoodEstimate> {
  return askClaude(
    `Estimate the nutrition for this exact food and quantity: "${servingSize}" of "${name}". ` +
      `Give calories, protein, carbs, and fat for that specific amount — not per 100g, not a generic serving size.`,
    FoodEstimateSchema,
    'You are a nutrition estimation assistant. Always return realistic numeric estimates for the exact quantity described, ' +
      'using common-sense defaults for vague quantities (e.g. "1 medium banana" is about 118g).',
  )
}

const ComboSuggestionSchema = z.object({
  suggestions: z
    .array(
      z.object({
        name: z.string().describe('a short, appealing name for this meal/combo'),
        items: z
          .array(
            z.object({
              pantryItemName: z.string().describe('must exactly match a name from the provided pantry list'),
              quantity: z.number().describe('multiple of that item\'s serving size, e.g. 1.5'),
            }),
          )
          .min(1),
        reasoning: z.string().describe('one short sentence on why this combo works'),
      }),
    )
    .max(3),
  missingIdeas: z
    .array(z.string())
    .describe('staple foods not currently in the pantry that would unlock better meal options, empty array if none'),
})

export type ComboSuggestions = z.infer<typeof ComboSuggestionSchema>

export interface PantryItemForAi {
  name: string
  servingSize: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

/** Asks Claude to suggest meal combos buildable from the current pantry, plus staples worth adding. */
export async function suggestMealsFromPantry(pantryItems: PantryItemForAi[]): Promise<ComboSuggestions> {
  const list = pantryItems
    .map((p) => `- ${p.name} (serving: ${p.servingSize}; ${p.calories} kcal, ${p.protein}g P, ${p.carbs}g C, ${p.fat}g F)`)
    .join('\n')
  return askClaude(
    `Here is my pantry:\n${list}\n\n` +
      `Suggest up to 3 meal/combo ideas using only these items (quantities can be fractional multiples of the listed serving). ` +
      `Prioritize hitting a solid protein amount. Also list any common staple foods I'm missing that would meaningfully improve my options.`,
    ComboSuggestionSchema,
    'You are a practical meal-planning assistant for someone tracking macros. Be concrete and realistic.',
  )
}
