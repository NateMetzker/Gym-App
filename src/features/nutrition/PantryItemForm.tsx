import { useState } from 'react'
import type { PantryItem, MacroSource } from '../../db/db'
import { db, newId } from '../../db/db'
import { searchUsda } from '../../lib/usda'
import { Button, Field, Input, Pill } from '../../components/ui'

type Draft = Omit<PantryItem, 'id' | 'createdAt'>

const emptyDraft: Draft = {
  name: '',
  servingSize: '1 serving',
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  source: 'manual',
}

export function PantryItemForm({
  existing,
  onDone,
  onCancel,
}: {
  existing?: PantryItem
  onDone: () => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState<Draft>(existing ?? emptyDraft)
  const [looking, setLooking] = useState(false)
  const [lookupMsg, setLookupMsg] = useState<string | null>(null)

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  async function lookup() {
    if (!draft.name.trim()) return
    setLooking(true)
    setLookupMsg(null)
    try {
      const match = await searchUsda(draft.name.trim())
      if (match) {
        setDraft((d) => ({
          ...d,
          name: d.name || match.name,
          servingSize: match.servingSize,
          calories: match.calories,
          protein: match.protein,
          carbs: match.carbs,
          fat: match.fat,
          source: 'usda',
        }))
        setLookupMsg(`Matched "${match.name}" from USDA FoodData Central.`)
      } else {
        setDraft((d) => ({ ...d, source: 'estimated' }))
        setLookupMsg('No USDA match found. Enter macros manually below (marked as estimated).')
      }
    } catch (err) {
      setDraft((d) => ({ ...d, source: 'estimated' }))
      setLookupMsg(err instanceof Error ? err.message : 'Lookup failed. Enter macros manually.')
    } finally {
      setLooking(false)
    }
  }

  async function save() {
    if (!draft.name.trim()) return
    if (existing) {
      await db.pantryItems.update(existing.id, draft)
    } else {
      await db.pantryItems.add({ ...draft, id: newId(), createdAt: Date.now() })
    }
    onDone()
  }

  function markManual(source: MacroSource) {
    if (source !== draft.source) set('source', source)
  }

  return (
    <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <Field label="Name">
        <div className="flex gap-2">
          <Input
            value={draft.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. chicken breast"
            autoFocus
          />
          <Button variant="secondary" onClick={lookup} disabled={looking || !draft.name.trim()}>
            {looking ? '...' : 'Look up'}
          </Button>
        </div>
      </Field>

      {lookupMsg && <p className="text-xs text-neutral-400">{lookupMsg}</p>}

      <Field label="Serving size">
        <Input
          value={draft.servingSize}
          onChange={(e) => {
            set('servingSize', e.target.value)
            markManual('manual')
          }}
          placeholder="e.g. 1 cup (240g)"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Calories">
          <Input
            type="number"
            inputMode="decimal"
            value={draft.calories}
            onChange={(e) => {
              set('calories', Number(e.target.value))
              markManual('manual')
            }}
          />
        </Field>
        <Field label="Protein (g)">
          <Input
            type="number"
            inputMode="decimal"
            value={draft.protein}
            onChange={(e) => {
              set('protein', Number(e.target.value))
              markManual('manual')
            }}
          />
        </Field>
        <Field label="Carbs (g)">
          <Input
            type="number"
            inputMode="decimal"
            value={draft.carbs}
            onChange={(e) => {
              set('carbs', Number(e.target.value))
              markManual('manual')
            }}
          />
        </Field>
        <Field label="Fat (g)">
          <Input
            type="number"
            inputMode="decimal"
            value={draft.fat}
            onChange={(e) => {
              set('fat', Number(e.target.value))
              markManual('manual')
            }}
          />
        </Field>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-400">Macro source:</span>
        {draft.source === 'usda' && <Pill tone="neutral">USDA</Pill>}
        {draft.source === 'estimated' && <Pill tone="estimated">Estimated</Pill>}
        {draft.source === 'manual' && <Pill tone="neutral">Manual</Pill>}
      </div>

      <div className="flex gap-2 pt-1">
        <Button className="flex-1" onClick={save} disabled={!draft.name.trim()}>
          {existing ? 'Save changes' : 'Add to pantry'}
        </Button>
        <Button variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
