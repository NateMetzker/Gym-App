import { useState } from 'react'
import type { Combo, ComboLine, PantryItem } from '../../db/db'
import { db, newId } from '../../db/db'
import { comboMacros, suggestByProteinDensity } from '../../lib/calc'
import { Button, Field, Input } from '../../components/ui'

export function ComboForm({
  pantryItems,
  existing,
  onDone,
  onCancel,
}: {
  pantryItems: PantryItem[]
  existing?: Combo
  onDone: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState(existing?.name ?? '')
  const [lines, setLines] = useState<ComboLine[]>(existing?.lines ?? [])

  const macros = comboMacros(lines, pantryItems)
  const suggestions = suggestByProteinDensity(
    pantryItems.filter((p) => !lines.some((l) => l.pantryItemId === p.id)),
  )

  function addLine(pantryItemId: string) {
    setLines((ls) => [...ls, { pantryItemId, quantity: 1 }])
  }

  function updateQty(pantryItemId: string, quantity: number) {
    setLines((ls) => ls.map((l) => (l.pantryItemId === pantryItemId ? { ...l, quantity } : l)))
  }

  function removeLine(pantryItemId: string) {
    setLines((ls) => ls.filter((l) => l.pantryItemId !== pantryItemId))
  }

  async function save() {
    if (!name.trim() || lines.length === 0) return
    if (existing) {
      await db.combos.update(existing.id, { name: name.trim(), lines })
    } else {
      await db.combos.add({ id: newId(), name: name.trim(), lines, createdAt: Date.now() })
    }
    onDone()
  }

  const availableItems = pantryItems.filter((p) => !lines.some((l) => l.pantryItemId === p.id))

  return (
    <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <Field label="Combo name">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Morning Shake" autoFocus />
      </Field>

      <div className="space-y-2">
        <p className="text-xs font-medium text-neutral-500">Items in this combo</p>
        {lines.length === 0 && <p className="text-xs text-neutral-400">No items added yet.</p>}
        {lines.map((line) => {
          const item = pantryItems.find((p) => p.id === line.pantryItemId)
          if (!item) return null
          return (
            <div key={line.pantryItemId} className="flex items-center gap-2">
              <span className="flex-1 truncate text-sm">{item.name}</span>
              <Input
                type="number"
                inputMode="decimal"
                step="0.5"
                min="0"
                value={line.quantity}
                onChange={(e) => updateQty(line.pantryItemId, Number(e.target.value))}
                className="w-20 text-center"
              />
              <span className="text-xs text-neutral-400">×serving</span>
              <button
                className="rounded-lg px-2 py-1 text-xs text-red-600 dark:text-red-400"
                onClick={() => removeLine(line.pantryItemId)}
              >
                Remove
              </button>
            </div>
          )
        })}
      </div>

      {availableItems.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-neutral-500">Add from pantry</p>
          <select
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
            value=""
            onChange={(e) => {
              if (e.target.value) addLine(e.target.value)
            }}
          >
            <option value="">Select a pantry item…</option>
            {availableItems.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {suggestions.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-neutral-500">Suggested (highest protein-per-calorie)</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((p) => (
              <button
                key={p.id}
                onClick={() => addLine(p.id)}
                className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 dark:bg-teal-950 dark:text-teal-400"
              >
                + {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-neutral-50 p-3 text-sm dark:bg-neutral-800">
        <p className="font-medium">
          {macros.calories} kcal · {macros.protein}g P · {macros.carbs}g C · {macros.fat}g F
        </p>
      </div>

      <div className="flex gap-2 pt-1">
        <Button className="flex-1" onClick={save} disabled={!name.trim() || lines.length === 0}>
          {existing ? 'Save changes' : 'Save combo'}
        </Button>
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
