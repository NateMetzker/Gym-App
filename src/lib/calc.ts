import type { ComboLine, PantryItem, SetEntry } from '../db/db'

export interface Macros {
  calories: number
  protein: number
  carbs: number
  fat: number
}

export function scaleMacros(item: Pick<PantryItem, 'calories' | 'protein' | 'carbs' | 'fat'>, qty: number): Macros {
  return {
    calories: Math.round(item.calories * qty * 10) / 10,
    protein: Math.round(item.protein * qty * 10) / 10,
    carbs: Math.round(item.carbs * qty * 10) / 10,
    fat: Math.round(item.fat * qty * 10) / 10,
  }
}

export function sumMacros(list: Macros[]): Macros {
  return list.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

export function comboMacros(lines: ComboLine[], pantryItems: PantryItem[]): Macros {
  const byId = new Map(pantryItems.map((p) => [p.id, p]))
  return sumMacros(
    lines
      .map((line) => {
        const item = byId.get(line.pantryItemId)
        return item ? scaleMacros(item, line.quantity) : null
      })
      .filter((m): m is Macros => m !== null),
  )
}

/** Rule-based (non-AI) pantry suggestions: items ranked by protein delivered per calorie, for quick high-protein adds. */
export function suggestByProteinDensity(items: PantryItem[], limit = 3): PantryItem[] {
  return [...items]
    .filter((i) => i.calories > 0)
    .sort((a, b) => b.protein / b.calories - a.protein / a.calories)
    .slice(0, limit)
}

export function setVolume(set: Pick<SetEntry, 'weight' | 'reps'>): number {
  return set.weight * set.reps
}

export function sessionVolume(sets: Pick<SetEntry, 'weight' | 'reps'>[]): number {
  return sets.reduce((sum, s) => sum + setVolume(s), 0)
}

export interface PrState {
  bestWeight: number
  /** Best weight ever lifted for each rep count seen so far. */
  bestWeightByReps: Map<number, number>
}

export function emptyPrState(): PrState {
  return { bestWeight: 0, bestWeightByReps: new Map() }
}

/** Returns whether `set` beats the PR state so far, then folds it in. Feed sets in chronological order. */
export function checkAndUpdatePr(
  state: PrState,
  set: Pick<SetEntry, 'weight' | 'reps'>,
): { isWeightPr: boolean; isRepPr: boolean } {
  const isWeightPr = set.weight > state.bestWeight
  const prevBestForReps = state.bestWeightByReps.get(set.reps) ?? 0
  const isRepPr = set.weight > prevBestForReps

  if (set.weight > state.bestWeight) state.bestWeight = set.weight
  if (set.weight > prevBestForReps) state.bestWeightByReps.set(set.reps, set.weight)

  return { isWeightPr, isRepPr }
}
