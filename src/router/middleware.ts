import { AnthropicRequest, SystemMessage } from '../types.js';

export const REQUIRED_SYSTEM_PROMPT: SystemMessage = {
  type: 'text',
  text: "You are Claude Code, Anthropic's official CLI for Claude."
};

/**
 * Normalizes system prompt to SystemMessage[] format
 * Handles both string and array inputs
 */
function normalizeSystemPrompt(system?: SystemMessage[] | string): SystemMessage[] {
  if (!system) {
    return [];
  }
  if (typeof system === 'string') {
    return [{ type: 'text', text: system }];
  }
  return system;
}

/**
 * Checks if the first system message matches the required Claude Code prompt
 */
function hasRequiredSystemPrompt(system?: SystemMessage[] | string): boolean {
  const normalizedSystem = normalizeSystemPrompt(system);
  if (normalizedSystem.length === 0) {
    return false;
  }

  const firstMessage = normalizedSystem[0];
  return (
    firstMessage.type === 'text' &&
    firstMessage.text === REQUIRED_SYSTEM_PROMPT.text
  );
}

/**
 * Ensures the required system prompt is present as the first element
 * If it's already there, returns the request unchanged
 * If not, prepends the required prompt
 */
export function ensureRequiredSystemPrompt(request: AnthropicRequest): AnthropicRequest {
  // If the required prompt is already first, return as-is
  if (hasRequiredSystemPrompt(request.system)) {
    return request;
  }

  // Otherwise, prepend the required normalized prompt
  const existingSystem = normalizeSystemPrompt(request.system);
  return {
    ...request,
    system: [REQUIRED_SYSTEM_PROMPT, ...existingSystem]
  };
}
