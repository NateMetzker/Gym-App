import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import type { Combo } from '../../db/db'
import { comboMacros } from '../../lib/calc'
import { Button, Card, EmptyState } from '../../components/ui'
import { ComboForm } from './ComboForm'
import { AiMealSuggestions } from './AiMealSuggestions'

export function ComboPage() {
  const combos = useLiveQuery(() => db.combos.orderBy('name').toArray(), [])
  const pantryItems = useLiveQuery(() => db.pantryItems.toArray(), [])
  const [mode, setMode] = useState<'idle' | 'add' | { edit: Combo }>('idle')

  async function remove(id: string) {
    await db.combos.delete(id)
  }

  if (!pantryItems) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Combos</h1>
        {mode === 'idle' && pantryItems.length > 0 && (
          <Button onClick={() => setMode('add')}>+ New combo</Button>
        )}
      </div>

      {pantryItems.length === 0 && (
        <EmptyState title="Add pantry items first" hint="Combos are built from items in your pantry." />
      )}

      {mode === 'idle' && pantryItems.length > 0 && <AiMealSuggestions pantryItems={pantryItems} />}

      {mode === 'add' && (
        <ComboForm pantryItems={pantryItems} onDone={() => setMode('idle')} onCancel={() => setMode('idle')} />
      )}
      {typeof mode === 'object' && (
        <ComboForm
          pantryItems={pantryItems}
          existing={mode.edit}
          onDone={() => setMode('idle')}
          onCancel={() => setMode('idle')}
        />
      )}

      {combos && combos.length === 0 && mode === 'idle' && pantryItems.length > 0 && (
        <EmptyState title="No combos yet" hint="Group pantry items into reusable meals, like a shake." />
      )}

      <div className="space-y-2">
        {combos?.map((combo) => {
          const macros = comboMacros(combo.lines, pantryItems)
          return (
            <Card key={combo.id} className="!p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-medium">{combo.name}</span>
                  <p className="text-xs text-neutral-400">{combo.lines.length} items</p>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                    {macros.calories} kcal · {macros.protein}g P · {macros.carbs}g C · {macros.fat}g F
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    className="rounded-lg px-2 py-1 text-xs text-teal-700 dark:text-teal-400"
                    onClick={() => setMode({ edit: combo })}
                  >
                    Edit
                  </button>
                  <button
                    className="rounded-lg px-2 py-1 text-xs text-red-600 dark:text-red-400"
                    onClick={() => remove(combo.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
