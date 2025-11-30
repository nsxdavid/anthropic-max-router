/**
 * EDUCATIONAL AND ENTERTAINMENT PURPOSES ONLY
 *
 * This software is provided for educational, research, and entertainment purposes only.
 * It is not affiliated with, endorsed by, or sponsored by Anthropic PBC.
 * Use at your own risk. No warranties provided. Users are solely responsible for
 * ensuring compliance with Anthropic's Terms of Service and all applicable laws.
 *
 * Copyright (c) 2025 - Licensed under MIT License
 */

import {
  OpenAIChatCompletionRequest,
  OpenAIMessage,
  OpenAITool,
  AnyOpenAITool,
  OpenAIChatCompletionResponse,
  OpenAIChatCompletionChunk,
  OpenAIErrorResponse,
  AnthropicRequest,
  AnthropicResponse,
  Message,
  SystemMessage,
  Tool,
  ContentBlock,
  ValidationError
} from '../types.js';
import { mapOpenAIModelToAnthropic } from './model-mapper.js';

/**
 * Translate OpenAI Chat Completion request to Anthropic Messages API request
 */
export function translateOpenAIToAnthropic(
  openaiRequest: OpenAIChatCompletionRequest
): AnthropicRequest {
  // Extract and combine all system messages
  const systemMessages: string[] = [];
  const conversationMessages: OpenAIMessage[] = [];

  for (const msg of openaiRequest.messages) {
    if (msg.role === 'system') {
      systemMessages.push(msg.content || '');
    } else {
      conversationMessages.push(msg);
    }
  }

  // Consolidate consecutive same-role messages for Anthropic's alternation requirement
  const anthropicMessages: Message[] = [];
  let currentRole: 'user' | 'assistant' | null = null;
  let currentContent: string[] = [];

  for (const msg of conversationMessages) {
    if (msg.role === 'tool') {
      // Skip tool messages for now - they need special handling
      continue;
    }

    const role = msg.role as 'user' | 'assistant';

    if (role === currentRole) {
      // Same role, accumulate content
      currentContent.push(msg.content || '');
    } else {
      // Role changed, flush current message
      if (currentRole && currentContent.length > 0) {
        anthropicMessages.push({
          role: currentRole,
          content: currentContent.join('\n\n')
        });
      }
      currentRole = role;
      currentContent = [msg.content || ''];
    }
  }

  // Flush final message
  if (currentRole && currentContent.length > 0) {
    anthropicMessages.push({
      role: currentRole,
      content: currentContent.join('\n\n')
    });
  }

  // Translate tools if present
  let anthropicTools: Tool[] | undefined;
  if (openaiRequest.tools && openaiRequest.tools.length > 0) {
    anthropicTools = openaiRequest.tools.map(translateOpenAIToolToAnthropic);
  }

  // Build the Anthropic request
  const anthropicRequest: AnthropicRequest = {
    model: mapOpenAIModelToAnthropic(openaiRequest.model),
    max_tokens: openaiRequest.max_tokens || 4096,
    messages: anthropicMessages,
    stream: openaiRequest.stream || false
  };

  // Add system messages if present
  if (systemMessages.length > 0) {
    anthropicRequest.system = [{
      type: 'text',
      text: systemMessages.join('\n\n')
    }];
  }

  // Add tools if present
  if (anthropicTools && anthropicTools.length > 0) {
    anthropicRequest.tools = anthropicTools;
  }

  return anthropicRequest;
}

/**
 * Translate OpenAI tool to Anthropic tool
 * Supports both standard OpenAI format and flattened format (used by Cursor)
 */
function translateOpenAIToolToAnthropic(openaiTool: AnyOpenAITool): Tool {
  // Handle flattened format (Cursor): { type, name, description, parameters }
  // vs standard OpenAI format: { type, function: { name, description, parameters } }
  const funcDef = 'function' in openaiTool ? openaiTool.function : openaiTool;

  if (!funcDef.name || typeof funcDef.name !== 'string') {
    throw new ValidationError('Invalid tool definition: "name" is required and must be a string');
  }

  if (!funcDef.description || typeof funcDef.description !== 'string') {
    throw new ValidationError('Invalid tool definition: "description" is required and must be a string');
  }

  return {
    name: funcDef.name,
    description: funcDef.description,
    input_schema: {
      type: 'object',
      properties: funcDef.parameters?.properties || {},
      required: funcDef.parameters?.required || []
    }
  };
}

/**
 * Translate Anthropic response to OpenAI Chat Completion response
 */
export function translateAnthropicToOpenAI(
  anthropicResponse: AnthropicResponse,
  originalModel: string
): OpenAIChatCompletionResponse {
  // Extract text content from Anthropic's content blocks
  const textBlocks = anthropicResponse.content.filter(
    (block: ContentBlock) => block.type === 'text'
  );
  const content = textBlocks.map((block: ContentBlock) => block.text).join('');

  // Map stop_reason to finish_reason
  let finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null = null;
  if (anthropicResponse.stop_reason === 'end_turn') {
    finishReason = 'stop';
  } else if (anthropicResponse.stop_reason === 'max_tokens') {
    finishReason = 'length';
  } else if (anthropicResponse.stop_reason === 'tool_use') {
    finishReason = 'tool_calls';
  }

  // Check if there are tool uses
  const toolUseBlocks = anthropicResponse.content.filter(
    (block: ContentBlock) => block.type === 'tool_use'
  );

  const toolCalls = toolUseBlocks.length > 0 ? toolUseBlocks.map((block: any) => ({
    id: block.id,
    type: 'function' as const,
    function: {
      name: block.name,
      arguments: JSON.stringify(block.input)
    }
  })) : undefined;

  return {
    id: anthropicResponse.id,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: originalModel,
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: content || null,
        ...(toolCalls && { tool_calls: toolCalls })
      },
      finish_reason: finishReason
    }],
    usage: {
      prompt_tokens: anthropicResponse.usage.input_tokens,
      completion_tokens: anthropicResponse.usage.output_tokens,
      total_tokens: anthropicResponse.usage.input_tokens + anthropicResponse.usage.output_tokens
    }
  };
}

/**
 * Translate Anthropic streaming events to OpenAI streaming format
 * This returns a generator that yields OpenAI-formatted SSE strings
 */
export async function* translateAnthropicStreamToOpenAI(
  anthropicStream: AsyncIterable<Uint8Array>,
  originalModel: string,
  messageId: string
): AsyncGenerator<string, void, unknown> {
  const decoder = new TextDecoder();
  let buffer = '';
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let contentStarted = false;

  // Send initial chunk with role
  yield `data: ${JSON.stringify({
    id: messageId,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model: originalModel,
    choices: [{
      index: 0,
      delta: { role: 'assistant' },
      finish_reason: null
    }]
  })}\n\n`;

  for await (const chunk of anthropicStream) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim() || line.startsWith(':')) continue;

      if (line.startsWith('data: ')) {
        const data = line.slice(6);

        try {
          const event = JSON.parse(data);

          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            // Text content delta
            contentStarted = true;
            yield `data: ${JSON.stringify({
              id: messageId,
              object: 'chat.completion.chunk',
              created: Math.floor(Date.now() / 1000),
              model: originalModel,
              choices: [{
                index: 0,
                delta: { content: event.delta.text },
                finish_reason: null
              }]
            })}\n\n`;
          } else if (event.type === 'message_delta' && event.usage) {
            // Update token counts
            totalOutputTokens = event.usage.output_tokens || totalOutputTokens;
          } else if (event.type === 'message_start' && event.message?.usage) {
            // Initial token count
            totalInputTokens = event.message.usage.input_tokens || 0;
          }
        } catch (error) {
          // Ignore parse errors for streaming events
        }
      }
    }
  }

  // Send final chunk with usage information
  yield `data: ${JSON.stringify({
    id: messageId,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model: originalModel,
    choices: [{
      index: 0,
      delta: {},
      finish_reason: 'stop'
    }],
    usage: {
      prompt_tokens: totalInputTokens,
      completion_tokens: totalOutputTokens,
      total_tokens: totalInputTokens + totalOutputTokens
    }
  })}\n\n`;

  // Send [DONE] marker
  yield 'data: [DONE]\n\n';
}

/**
 * Translate Anthropic error to OpenAI error format
 */
export function translateAnthropicErrorToOpenAI(
  error: any
): OpenAIErrorResponse {
  // If it's already an Anthropic error format, translate it
  if (error.error?.type && error.error?.message) {
    return {
      error: {
        message: error.error.message,
        type: error.error.type,
        param: null,
        code: null
      }
    };
  }

  // Generic error
  return {
    error: {
      message: error.message || 'An error occurred',
      type: 'internal_error',
      param: null,
      code: null
    }
  };
}

/**
 * Validate OpenAI request and throw errors for unsupported features
 */
export function validateOpenAIRequest(request: OpenAIChatCompletionRequest): void {
  // Validate required fields
  if (!request.messages || !Array.isArray(request.messages)) {
    throw new ValidationError('Invalid request: "messages" field is required and must be an array');
  }

  if (request.messages.length === 0) {
    throw new ValidationError('Invalid request: "messages" array cannot be empty');
  }

  if (!request.model || typeof request.model !== 'string' || request.model.trim().length === 0) {
    throw new ValidationError('Invalid request: "model" field is required and must be a non-empty string');
  }

  // Error on unsupported features that would change behavior
  if (request.n && request.n > 1) {
    throw new ValidationError('Multiple completions (n > 1) are not supported. Anthropic only returns one completion.');
  }

  if (request.logprobs) {
    throw new ValidationError('Log probabilities (logprobs) are not supported by Anthropic API.');
  }

  // Warn about ignored parameters (these won't cause errors but won't work as expected)
  if (request.presence_penalty !== undefined) {
    console.warn('Warning: presence_penalty is not supported by Anthropic and will be ignored');
  }

  if (request.frequency_penalty !== undefined) {
    console.warn('Warning: frequency_penalty is not supported by Anthropic and will be ignored');
  }

  if (request.logit_bias !== undefined) {
    console.warn('Warning: logit_bias is not supported by Anthropic and will be ignored');
  }
}
