import { useState } from 'react'
import { Button, Card, Field, Input } from '../components/ui'
import { getStoredApiKey, setApiKey } from '../lib/usda'
import { getStoredAnthropicKey, setAnthropicKey } from '../lib/anthropic'
import { db } from '../db/db'

export function SettingsPage() {
  const [key, setKey] = useState(getStoredApiKey())
  const [saved, setSaved] = useState(false)
  const [aiKey, setAiKey] = useState(getStoredAnthropicKey())
  const [aiSaved, setAiSaved] = useState(false)
  const [confirmingReset, setConfirmingReset] = useState(false)

  function save() {
    setApiKey(key)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  function saveAiKey() {
    setAnthropicKey(aiKey)
    setAiSaved(true)
    setTimeout(() => setAiSaved(false), 1500)
  }

  async function resetAllData() {
    await Promise.all([
      db.pantryItems.clear(),
      db.combos.clear(),
      db.logEntries.clear(),
      db.splitDays.clear(),
      db.exercises.clear(),
      db.workoutSessions.clear(),
      db.setEntries.clear(),
    ])
    setConfirmingReset(false)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Settings</h1>

      <Card>
        <Field label="USDA FoodData Central API key">
          <Input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="DEMO_KEY (default, rate-limited)"
          />
        </Field>
        <p className="mt-2 text-xs text-neutral-400">
          Free key at fdc.nal.usda.gov/api-key-signup. Without one, lookups use the shared
          DEMO_KEY which has a low daily rate limit.
        </p>
        <Button className="mt-3 w-full" onClick={save}>
          {saved ? 'Saved' : 'Save key'}
        </Button>
      </Card>

      <Card>
        <Field label="Anthropic API key (for AI features)">
          <Input
            value={aiKey}
            onChange={(e) => setAiKey(e.target.value)}
            type="password"
            placeholder="sk-ant-..."
          />
        </Field>
        <p className="mt-2 text-xs text-neutral-400">
          Powers flexible-unit food estimates, meal suggestions, and pasting in a split or past
          workout history for AI to import. Get a free key at console.anthropic.com — usage costs
          a small fraction of a cent per request. Stored only in this browser.
        </p>
        <Button className="mt-3 w-full" onClick={saveAiKey}>
          {aiSaved ? 'Saved' : 'Save key'}
        </Button>
      </Card>

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200">Data</h2>
        <p className="mb-3 text-xs text-neutral-400">
          All pantry items, combos, logs, splits, and workout history are stored locally in this
          browser only. Clearing data cannot be undone.
        </p>
        {confirmingReset ? (
          <div className="flex gap-2">
            <Button variant="danger" className="flex-1" onClick={resetAllData}>
              Confirm erase everything
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmingReset(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="danger" className="w-full" onClick={() => setConfirmingReset(true)}>
            Reset all data
          </Button>
        )}
      </Card>
    </div>
  )
}
