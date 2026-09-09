import type Anthropic from '@anthropic-ai/sdk'
import type { z } from 'zod'

const MODEL = 'claude-opus-5'

export function getStoredAnthropicKey(): string {
  return localStorage.getItem('anthropicApiKey') || ''
}

export function setAnthropicKey(key: string) {
  if (key.trim()) localStorage.setItem('anthropicApiKey', key.trim())
  else localStorage.removeItem('anthropicApiKey')
}

export class MissingApiKeyError extends Error {
  constructor() {
    super('Add your Anthropic API key in Settings to use AI features.')
    this.name = 'MissingApiKeyError'
  }
}

// The SDK is a sizeable dependency only a handful of optional AI actions need,
// so it's dynamically imported here rather than bundled into the app's main chunk.
async function client(): Promise<Anthropic> {
  const apiKey = getStoredAnthropicKey()
  if (!apiKey) throw new MissingApiKeyError()
  const { default: AnthropicSdk } = await import('@anthropic-ai/sdk')
  return new AnthropicSdk({ apiKey, dangerouslyAllowBrowser: true })
}

/** Sends `prompt` to Claude and parses the reply against `schema`. Throws MissingApiKeyError if no key is set in Settings. */
export async function askClaude<S extends z.ZodTypeAny>(
  prompt: string,
  schema: S,
  system?: string,
): Promise<z.infer<S>> {
  const [anthropic, { zodOutputFormat }] = await Promise.all([
    client(),
    import('@anthropic-ai/sdk/helpers/zod'),
  ])
  const response = await anthropic.messages.parse({
    model: MODEL,
    max_tokens: 4096,
    system,
    messages: [{ role: 'user', content: prompt }],
    output_config: { format: zodOutputFormat(schema), effort: 'medium' },
  })
  if (!response.parsed_output) {
    throw new Error('Claude could not parse a valid response. Try rephrasing.')
  }
  return response.parsed_output
}
