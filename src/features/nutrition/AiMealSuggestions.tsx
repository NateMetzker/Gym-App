import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import type { PantryItem } from '../../db/db'
import { db, newId } from '../../db/db'
import { suggestMealsFromPantry, type ComboSuggestions } from '../../lib/foodAi'
import { MissingApiKeyError } from '../../lib/anthropic'
import { comboMacros } from '../../lib/calc'
import { Button, Card, Pill } from '../../components/ui'

function matchItems(itemNames: { pantryItemName: string; quantity: number }[], pantryItems: PantryItem[]) {
  return itemNames
    .map(({ pantryItemName, quantity }) => {
      const match = pantryItems.find((p) => p.name.toLowerCase().trim() === pantryItemName.toLowerCase().trim())
      return match ? { pantryItemId: match.id, quantity } : null
    })
    .filter((l): l is { pantryItemId: string; quantity: number } => l !== null)
}

export function AiMealSuggestions({ pantryItems }: { pantryItems: PantryItem[] }) {
  const [loading, setLoading] = useState(false)
  const [needsApiKey, setNeedsApiKey] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ComboSuggestions | null>(null)
  const [savedNames, setSavedNames] = useState<Set<string>>(new Set())

  async function run() {
    setLoading(true)
    setError(null)
    setNeedsApiKey(false)
    setResult(null)
    try {
      setResult(await suggestMealsFromPantry(pantryItems))
    } catch (err) {
      if (err instanceof MissingApiKeyError) setNeedsApiKey(true)
      else setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  async function saveAsCombo(suggestion: ComboSuggestions['suggestions'][number]) {
    const lines = matchItems(suggestion.items, pantryItems)
    if (lines.length === 0) return
    await db.combos.add({ id: newId(), name: suggestion.name, lines, createdAt: Date.now() })
    setSavedNames((s) => new Set(s).add(suggestion.name))
  }

  return (
    <div className="space-y-2">
      <Button
        variant="secondary"
        onClick={run}
        disabled={loading || pantryItems.length === 0}
        className="flex w-full items-center justify-center gap-1.5"
      >
        <Sparkles size={16} className={loading ? 'animate-pulse' : ''} />
        {loading ? 'Thinking…' : 'Suggest a meal with AI'}
      </Button>

      {needsApiKey && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Add an Anthropic API key in <Link to="/settings" className="underline">Settings</Link> to use this.
        </p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {result && (
        <div className="space-y-2">
          {result.suggestions.map((s) => {
            const lines = matchItems(s.items, pantryItems)
            const macros = comboMacros(lines, pantryItems)
            const saved = savedNames.has(s.name)
            return (
              <Card key={s.name} className="!p-3">
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{s.reasoning}</p>
                <p className="mt-1 text-xs text-neutral-400">
                  {s.items.map((i) => i.pantryItemName).join(', ')}
                </p>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {macros.calories} kcal · {macros.protein}g P · {macros.carbs}g C · {macros.fat}g F
                </p>
                <Button
                  variant={saved ? 'ghost' : 'secondary'}
                  className="mt-2 w-full"
                  disabled={saved || lines.length === 0}
                  onClick={() => saveAsCombo(s)}
                >
                  {saved ? 'Saved as combo' : 'Save as combo'}
                </Button>
              </Card>
            )
          })}
          {result.missingIdeas.length > 0 && (
            <p className="text-xs text-neutral-400">
              Consider adding: <Pill>{result.missingIdeas.join(', ')}</Pill>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
