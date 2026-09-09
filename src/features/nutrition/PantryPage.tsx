import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/db'
import type { PantryItem } from '../../db/db'
import { Button, Card, EmptyState, Pill } from '../../components/ui'
import { PantryItemForm } from './PantryItemForm'

export function PantryPage() {
  const items = useLiveQuery(() => db.pantryItems.orderBy('name').toArray(), [])
  const [mode, setMode] = useState<'idle' | 'add' | { edit: PantryItem }>('idle')

  async function remove(id: string) {
    await db.pantryItems.delete(id)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Pantry</h1>
        {mode === 'idle' && <Button onClick={() => setMode('add')}>+ Add item</Button>}
      </div>

      {mode === 'add' && (
        <PantryItemForm onDone={() => setMode('idle')} onCancel={() => setMode('idle')} />
      )}
      {typeof mode === 'object' && (
        <PantryItemForm
          existing={mode.edit}
          onDone={() => setMode('idle')}
          onCancel={() => setMode('idle')}
        />
      )}

      {items && items.length === 0 && mode === 'idle' && (
        <EmptyState title="No pantry items yet" hint="Add whole foods or ingredients you eat often." />
      )}

      <div className="space-y-2">
        {items?.map((item) => (
          <Card key={item.id} className="!p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.name}</span>
                  {item.source === 'estimated' && <Pill tone="estimated">Estimated</Pill>}
                </div>
                <p className="text-xs text-neutral-400">{item.servingSize}</p>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {item.calories} kcal · {item.protein}g P · {item.carbs}g C · {item.fat}g F
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  className="rounded-lg px-2 py-1 text-xs text-teal-700 dark:text-teal-400"
                  onClick={() => setMode({ edit: item })}
                >
                  Edit
                </button>
                <button
                  className="rounded-lg px-2 py-1 text-xs text-red-600 dark:text-red-400"
                  onClick={() => remove(item.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
