#!/usr/bin/env python3
"""
Test script for OpenAI SDK compatibility with Anthropic MAX Plan Router

This script tests the router using the official OpenAI Python SDK to verify
real-world compatibility.

Prerequisites:
    pip install openai

Usage:
    1. Start the router with OpenAI endpoint enabled:
       npm run router -- --enable-openai

    2. Run this script:
       python test-openai-sdk.py
"""

import sys
try:
    from openai import OpenAI
except ImportError:
    print("❌ OpenAI SDK not installed")
    print("Install with: pip install openai")
    sys.exit(1)

# ANSI color codes
class Colors:
    RESET = '\033[0m'
    GREEN = '\033[32m'
    RED = '\033[31m'
    YELLOW = '\033[33m'
    CYAN = '\033[36m'
    BOLD = '\033[1m'

def log(message, color='RESET'):
    print(f"{getattr(Colors, color)}{message}{Colors.RESET}")

def section(title):
    print('\n' + '=' * 60)
    log(title, 'BOLD')
    print('=' * 60)

def test1_basic_completion():
    """Test basic chat completion with OpenAI SDK"""
    section('TEST 1: Basic Chat Completion (OpenAI SDK)')

    try:
        client = OpenAI(
            api_key="not-used",  # Router handles auth
            base_url="http://localhost:3000/v1",
        )

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say 'Hello from Python OpenAI SDK!' in one sentence."}
            ],
            max_tokens=50
        )

        log('✅ Request successful!', 'GREEN')
        log(f"Model: {response.model}", 'CYAN')
        log(f"Content: {response.choices[0].message.content}", 'YELLOW')
        log(f"Finish reason: {response.choices[0].finish_reason}", 'CYAN')
        log(f"Tokens - Prompt: {response.usage.prompt_tokens}, "
            f"Completion: {response.usage.completion_tokens}, "
            f"Total: {response.usage.total_tokens}", 'CYAN')

        return True
    except Exception as e:
        log(f'❌ FAILED: {str(e)}', 'RED')
        return False

def test2_streaming():
    """Test streaming with OpenAI SDK"""
    section('TEST 2: Streaming Response (OpenAI SDK)')

    try:
        client = OpenAI(
            api_key="not-used",
            base_url="http://localhost:3000/v1",
        )

        log('✅ Starting stream...', 'GREEN')
        log('Response: ', 'CYAN', end='')

        stream = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "user", "content": "Count from 1 to 3, one number per line."}
            ],
            stream=True,
            max_tokens=50
        )

        chunk_count = 0
        for chunk in stream:
            if chunk.choices[0].delta.content:
                print(chunk.choices[0].delta.content, end='', flush=True)
                chunk_count += 1

        print()  # New line
        log(f'\n✅ Streaming complete! Received {chunk_count} chunks', 'GREEN')

        return True
    except Exception as e:
        log(f'❌ FAILED: {str(e)}', 'RED')
        return False

def test3_multiple_models():
    """Test different model mappings"""
    section('TEST 3: Model Mapping with OpenAI SDK')

    models = ['gpt-4', 'gpt-4o', 'gpt-3.5-turbo', 'gpt-5', 'o1-mini']

    log('Testing model mappings:', 'CYAN')

    for model in models:
        try:
            client = OpenAI(
                api_key="not-used",
                base_url="http://localhost:3000/v1",
            )

            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "user", "content": "Say hi"}
                ],
                max_tokens=10
            )

            log(f"  {model} → ✅ Success (returns: {response.model})", 'GREEN')

        except Exception as e:
            log(f"  {model} → ❌ FAILED: {str(e)}", 'RED')

    log('\n💡 Check router logs to see actual Claude model mappings', 'YELLOW')
    return True

def test4_system_messages():
    """Test multiple system messages"""
    section('TEST 4: Multiple System Messages')

    try:
        client = OpenAI(
            api_key="not-used",
            base_url="http://localhost:3000/v1",
        )

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "system", "content": "You respond concisely."},
                {"role": "user", "content": "What is 2+2?"}
            ],
            max_tokens=50
        )

        log('✅ Multiple system messages handled!', 'GREEN')
        log(f"Response: {response.choices[0].message.content}", 'YELLOW')

        return True
    except Exception as e:
        log(f'❌ FAILED: {str(e)}', 'RED')
        return False

def test5_error_handling():
    """Test error handling for unsupported features"""
    section('TEST 5: Error Handling (Unsupported Features)')

    # Test n > 1
    log('Testing n > 1 (should error)...', 'CYAN')
    try:
        client = OpenAI(
            api_key="not-used",
            base_url="http://localhost:3000/v1",
        )

        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": "Hello"}],
            n=2,
            max_tokens=50
        )

        log('❌ Should have raised an error for n > 1', 'RED')
    except Exception as e:
        if 'Multiple completions' in str(e):
            log(f'✅ Correctly rejected n > 1', 'GREEN')
            log(f'  Error: {str(e)}', 'CYAN')
        else:
            log(f'❌ Wrong error: {str(e)}', 'RED')

    return True

def run_all_tests():
    """Run all tests"""
    log('\n' + '█' * 60, 'BOLD')
    log('  OpenAI SDK Compatibility Test Suite (Python)', 'BOLD')
    log('█' * 60 + '\n', 'BOLD')

    log('Prerequisites:', 'YELLOW')
    log('  1. Router running with: npm run router -- --enable-openai', 'YELLOW')
    log('  2. OpenAI SDK installed: pip install openai', 'YELLOW')
    log('  3. Router on http://localhost:3000\n', 'YELLOW')

    results = {'passed': 0, 'failed': 0}

    tests = [
        test1_basic_completion,
        test2_streaming,
        test3_multiple_models,
        test4_system_messages,
        test5_error_handling
    ]

    for test in tests:
        if test():
            results['passed'] += 1
        else:
            results['failed'] += 1

    # Summary
    section('TEST RESULTS')
    log(f"Total tests: {results['passed'] + results['failed']}", 'CYAN')
    log(f"Passed: {results['passed']}", 'GREEN')
    log(f"Failed: {results['failed']}", 'RED' if results['failed'] > 0 else 'GREEN')

    if results['failed'] == 0:
        log('\n🎉 All tests passed!', 'GREEN')
    else:
        log(f"\n⚠️  {results['failed']} test(s) failed", 'RED')

    print()

if __name__ == '__main__':
    try:
        run_all_tests()
    except KeyboardInterrupt:
        log('\n\n⚠️  Tests interrupted by user', 'YELLOW')
        sys.exit(1)
    except Exception as e:
        log(f'\n\n❌ Fatal error: {str(e)}', 'RED')
        sys.exit(1)
