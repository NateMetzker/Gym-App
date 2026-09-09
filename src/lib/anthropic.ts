import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
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

function client(): Anthropic {
  const apiKey = getStoredAnthropicKey()
  if (!apiKey) throw new MissingApiKeyError()
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
}

/** Sends `prompt` to Claude and parses the reply against `schema`. Throws MissingApiKeyError if no key is set in Settings. */
export async function askClaude<S extends z.ZodTypeAny>(
  prompt: string,
  schema: S,
  system?: string,
): Promise<z.infer<S>> {
  const response = await client().messages.parse({
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
