import OpenAI from 'openai';
import { safeJsonParse } from './utils';

let cachedClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  }
  return cachedClient;
}

export const DEFAULT_MODEL = process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o';
export const FAST_MODEL = process.env.OPENAI_FAST_MODEL || 'gpt-4o-mini';

interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  systemPrompt?: string;
}

export async function complete<T = string>(
  prompt: string,
  options: CompletionOptions = {}
): Promise<T> {
  const client = getOpenAIClient();
  const model = options.model ?? FAST_MODEL;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  if (options.systemPrompt) {
    messages.push({ role: 'system', content: options.systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await client.chat.completions.create({
    model,
    temperature: options.temperature ?? 0.4,
    max_tokens: options.maxTokens ?? 2000,
    messages,
    ...(options.jsonMode ? { response_format: { type: 'json_object' as const } } : {}),
  });

  const content = response.choices[0]?.message?.content ?? '';

  if (options.jsonMode) {
    return safeJsonParse<T>(content, {} as T);
  }
  return content as T;
}

export async function streamComplete(
  prompt: string,
  options: CompletionOptions & { onChunk?: (chunk: string) => void } = {}
) {
  const client = getOpenAIClient();
  const model = options.model ?? DEFAULT_MODEL;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  if (options.systemPrompt) {
    messages.push({ role: 'system', content: options.systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const stream = await client.chat.completions.create({
    model,
    temperature: options.temperature ?? 0.5,
    max_tokens: options.maxTokens ?? 2000,
    messages,
    stream: true,
  });

  let full = '';
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content ?? '';
    if (delta) {
      full += delta;
      options.onChunk?.(delta);
    }
  }
  return full;
}
