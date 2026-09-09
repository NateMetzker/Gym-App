import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardPaste } from 'lucide-react'
import { parseSplitText, applySplitImport } from '../../lib/liftingAi'
import { MissingApiKeyError } from '../../lib/anthropic'
import { Button, Card } from '../../components/ui'

export function PasteSplitImport() {
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
      const parsed = await parseSplitText(text)
      const { daysAdded, exercisesAdded } = await applySplitImport(parsed)
      setResult(`Added ${daysAdded} day${daysAdded === 1 ? '' : 's'} and ${exercisesAdded} exercise${exercisesAdded === 1 ? '' : 's'}.`)
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
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-300 py-3 text-sm text-neutral-500 dark:border-neutral-700"
        onClick={() => setOpen(true)}
      >
        <ClipboardPaste size={16} />
        Paste a split
      </button>
    )
  }

  return (
    <Card>
      <p className="mb-2 text-sm font-medium">Paste a split</p>
      <p className="mb-2 text-xs text-neutral-400">
        Paste your split from anywhere — notes, a spreadsheet, a program you found. AI will sort it into days and
        exercises and add any that don't already exist.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={'e.g.\nPush: Bench Press, Overhead Press, Triceps Pushdown\nPull: Deadlift, Row, Curl'}
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
          {busy ? 'Parsing…' : 'Parse & add'}
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
          Close
        </Button>
      </div>
    </Card>
  )
}
