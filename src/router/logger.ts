import { AnthropicRequest, AnthropicResponse } from '../types.js';

export type LogLevel = 'quiet' | 'minimal' | 'medium' | 'maximum';

export class Logger {
  constructor(private level: LogLevel = 'medium') {}

  setLevel(level: LogLevel) {
    this.level = level;
  }

  startup(message: string) {
    // Always show startup messages unless quiet
    if (this.level !== 'quiet') {
      console.log(message);
    }
  }

  logRequest(
    requestId: string,
    timestamp: string,
    request: AnthropicRequest,
    hadSystemPrompt: boolean,
    response?: { status: number; data?: AnthropicResponse },
    error?: Error,
    endpointType: 'anthropic' | 'openai' = 'anthropic'
  ) {
    if (this.level === 'quiet') {
      return;
    }

    if (this.level === 'minimal') {
      this.logMinimal(requestId, timestamp, request, response, error, endpointType);
    } else if (this.level === 'medium') {
      this.logMedium(requestId, timestamp, request, hadSystemPrompt, response, error, endpointType);
    } else if (this.level === 'maximum') {
      this.logMaximum(requestId, timestamp, request, hadSystemPrompt, response, error, endpointType);
    }
  }

  private logMinimal(
    requestId: string,
    timestamp: string,
    request: AnthropicRequest,
    response?: { status: number; data?: AnthropicResponse },
    error?: Error,
    endpointType: 'anthropic' | 'openai' = 'anthropic'
  ) {
    const status = error ? '✗ ERROR' : response ? `✓ ${response.status}` : '...';
    const tokens = response?.data?.usage
      ? `(in:${response.data.usage.input_tokens} out:${response.data.usage.output_tokens})`
      : '';
    const endpoint = endpointType === 'openai' ? '[OpenAI]' : '[Anthropic]';

    console.log(`[${timestamp.substring(11, 19)}] ${endpoint} ${status} ${request.model} ${tokens}`);
  }

  private logMedium(
    requestId: string,
    timestamp: string,
    request: AnthropicRequest,
    hadSystemPrompt: boolean,
    response?: { status: number; data?: AnthropicResponse },
    error?: Error,
    endpointType: 'anthropic' | 'openai' = 'anthropic'
  ) {
    const endpoint = endpointType === 'openai' ? 'OpenAI' : 'Anthropic';
    console.log(`\n[${timestamp}] [${requestId}] Incoming ${endpoint} request`);
    console.log(`  Model: ${request.model}`);
    console.log(`  Max tokens: ${request.max_tokens}`);

    if (endpointType === 'openai') {
      console.log(`  ✓ Translated OpenAI → Anthropic format`);
    }

    if (!hadSystemPrompt) {
      console.log(`  ✓ Injected required system prompt`);
    } else {
      console.log(`  ✓ System prompt already present`);
    }

    console.log(`  ✓ OAuth token validated`);

    if (error) {
      console.log(`  ✗ Error: ${error.message}`);
    } else if (response) {
      console.log(`  → Forwarding to Anthropic API...`);
      if (response.status >= 200 && response.status < 300) {
        console.log(`  ✓ Success (${response.status})`);
        if (response.data?.usage) {
          console.log(`  Tokens: input=${response.data.usage.input_tokens}, output=${response.data.usage.output_tokens}`);
        }
      } else {
        console.log(`  ✗ Error (${response.status})`);
      }
    }
  }

  private logMaximum(
    requestId: string,
    timestamp: string,
    request: AnthropicRequest,
    hadSystemPrompt: boolean,
    response?: { status: number; data?: AnthropicResponse },
    error?: Error,
    endpointType: 'anthropic' | 'openai' = 'anthropic'
  ) {
    const endpoint = endpointType === 'openai' ? 'OpenAI' : 'Anthropic';
    console.log('\n' + '='.repeat(80));
    console.log(`[${timestamp}] [${requestId}] ${endpoint} REQUEST`);
    console.log('='.repeat(80));
    console.log('Request Body (Anthropic format):');
    console.log(JSON.stringify(request, null, 2));

    if (endpointType === 'openai') {
      console.log('\n✓ Translated OpenAI → Anthropic format');
    }

    if (!hadSystemPrompt) {
      console.log('\n✓ Injected required system prompt');
    } else {
      console.log('\n✓ System prompt already present');
    }

    console.log('✓ OAuth token validated');
    console.log('→ Forwarding to Anthropic API...\n');

    if (error) {
      console.log('='.repeat(80));
      console.log('ERROR');
      console.log('='.repeat(80));
      console.log(error);
    } else if (response) {
      console.log('='.repeat(80));
      console.log(`RESPONSE (${response.status})`);
      console.log('='.repeat(80));
      console.log(JSON.stringify(response.data, null, 2));
    }
    console.log('='.repeat(80) + '\n');
  }

  info(message: string) {
    if (this.level !== 'quiet') {
      console.log(message);
    }
  }

  error(message: string, error?: any) {
    // Always show errors
    console.error(message, error || '');
  }
}

export const logger = new Logger();
