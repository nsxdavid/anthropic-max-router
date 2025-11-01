#!/usr/bin/env tsx

/**
 * Run the OAuth flow to obtain tokens
 *
 * Usage: npm run oauth
 */

import { startOAuthFlow, exchangeCodeForTokens } from './oauth.js';
import { saveTokens } from './token-manager.js';

async function main() {
  try {
    console.log('🚀 Anthropic MAX Plan OAuth Flow\n');
    console.log('This will obtain OAuth tokens for flat-rate MAX plan billing.\n');

    // Start the OAuth flow
    const { code, verifier } = await startOAuthFlow();

    console.log('✅ Authorization code received');
    console.log('🔄 Exchanging code for tokens...\n');

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, verifier);

    // Save tokens
    await saveTokens(tokens);

    console.log('\n✅ OAuth flow complete!');
    console.log('\nToken details:');
    console.log(`  Scope: ${tokens.scope}`);
    console.log(`  Expires in: ${tokens.expires_in / 3600} hours`);
    console.log(`  Token type: ${tokens.token_type}`);

    console.log('\n📝 Tokens saved to .oauth-tokens.json');
    console.log('\n🎯 You can now run: npm test\n');

  } catch (error) {
    console.error('\n❌ OAuth flow failed:', error);
    process.exit(1);
  }
}

main();
