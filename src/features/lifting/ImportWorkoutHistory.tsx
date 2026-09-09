import { useState } from 'react'
import { Link } from 'react-router-dom'
import { parseWorkoutHistory, applyWorkoutHistoryImport } from '../../lib/liftingAi'
import { MissingApiKeyError } from '../../lib/anthropic'
import { todayKey } from '../../lib/date'
import { Button, Card } from '../../components/ui'

export function ImportWorkoutHistory() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [needsApiKey, setNeedsApiKey] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  async function run() {
    if (!text.trim()) return
    setBusy(true)
    setError(null)
    setNeedsApiKey(false)
    setResult(null)
    try {
      const parsed = await parseWorkoutHistory(text, todayKey())
      const { sessionsImported, setsImported } = await applyWorkoutHistoryImport(parsed)
      setResult(`Imported ${sessionsImported} session${sessionsImported === 1 ? '' : 's'} (${setsImported} sets).`)
      setText('')
    } catch (err) {
      if (err instanceof MissingApiKeyError) setNeedsApiKey(true)
      else setError(err instanceof Error ? err.message : 'Import failed.')
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button
        className="w-full rounded-xl border border-dashed border-neutral-300 py-3 text-sm text-neutral-500 dark:border-neutral-700"
        onClick={() => setOpen(true)}
      >
        📋 Upload past progress
      </button>
    )
  }

  return (
    <Card>
      <p className="mb-2 text-sm font-medium">Upload past progress</p>
      <p className="mb-2 text-xs text-neutral-400">
        Paste in past workout notes, in whatever format you have them — AI will figure out the dates, exercises,
        and sets and add them to your history.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={'e.g.\n9/3 Push: Bench 135x8, 145x6\n9/5 Pull: Deadlift 225x5'}
        className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
      />

      {needsApiKey && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          Add an Anthropic API key in <Link to="/settings" className="underline">Settings</Link> to use this.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      {result && <p className="mt-2 text-xs text-teal-600 dark:text-teal-400">{result}</p>}

      <div className="mt-3 flex gap-2">
        <Button className="flex-1" onClick={run} disabled={busy || !text.trim()}>
          {busy ? 'Importing…' : 'Parse & import'}
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
          Close
        </Button>
      </div>
    </Card>
  )
}
