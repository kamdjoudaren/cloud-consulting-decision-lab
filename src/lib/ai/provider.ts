import type { AIProvider } from './types';
import { MockProvider } from './mock-provider';
import { OpenAIProvider } from './openai-provider';
export type { AIProvider } from './types';
export function getProvider(): AIProvider {
  const selected = (process.env.AI_PROVIDER || 'mock').toLowerCase();
  if (selected === 'openai') {
    const key = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
    if (key) return new OpenAIProvider(process.env.AI_MODEL || 'gpt-5.5', key);
    return new MockProvider('Mock · OpenAI key not configured');
  }
  return new MockProvider(
    selected === 'mock' ? 'Mock · local simulation' : 'Mock · unrecognized provider configuration',
  );
}
