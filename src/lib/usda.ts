const FDC_SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search'

export interface UsdaMatch {
  name: string
  servingSize: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

function getApiKey(): string {
  return localStorage.getItem('usdaApiKey') || 'DEMO_KEY'
}

export function setApiKey(key: string) {
  if (key.trim()) localStorage.setItem('usdaApiKey', key.trim())
  else localStorage.removeItem('usdaApiKey')
}

export function getStoredApiKey(): string {
  return localStorage.getItem('usdaApiKey') || ''
}

interface FdcNutrient {
  nutrientName: string
  value: number
}

interface FdcFood {
  description: string
  foodNutrients: FdcNutrient[]
  labelNutrients?: Record<string, { value: number }>
  servingSize?: number
  servingSizeUnit?: string
  householdServingFullText?: string
}

function pickNutrient(nutrients: FdcNutrient[], name: string): number {
  const hit = nutrients.find((n) => n.nutrientName === name)
  return hit ? Math.round(hit.value * 10) / 10 : 0
}

/** Looks up a food by name against USDA FoodData Central. Returns the best match's macros per 100g (or per labeled serving for branded foods), or null if nothing usable was found. */
export async function searchUsda(query: string): Promise<UsdaMatch | null> {
  const url = `${FDC_SEARCH_URL}?api_key=${encodeURIComponent(getApiKey())}&query=${encodeURIComponent(query)}&pageSize=5&dataType=Foundation,SR%20Legacy,Branded`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`USDA lookup failed (${res.status})`)
  }
  const data = (await res.json()) as { foods?: FdcFood[] }
  const food = data.foods?.[0]
  if (!food) return null

  if (food.labelNutrients) {
    const l = food.labelNutrients
    const serving = food.servingSize
      ? `${food.servingSize}${food.servingSizeUnit ?? 'g'}`
      : (food.householdServingFullText ?? '1 serving')
    return {
      name: food.description,
      servingSize: serving,
      calories: Math.round(l.calories?.value ?? 0),
      protein: Math.round((l.protein?.value ?? 0) * 10) / 10,
      carbs: Math.round((l.carbohydrates?.value ?? 0) * 10) / 10,
      fat: Math.round((l.fat?.value ?? 0) * 10) / 10,
    }
  }

  const n = food.foodNutrients
  return {
    name: food.description,
    servingSize: '100g',
    calories: pickNutrient(n, 'Energy'),
    protein: pickNutrient(n, 'Protein'),
    carbs: pickNutrient(n, 'Carbohydrate, by difference'),
    fat: pickNutrient(n, 'Total lipid (fat)'),
  }
}
