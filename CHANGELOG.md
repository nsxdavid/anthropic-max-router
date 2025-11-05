# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.1.3] - 2025-11-05

### Fixed
- **Payload size limit** - Increased Express body-parser limit from 100kb to 50mb
  - Fixes "PayloadTooLargeError: request entity too large" when handling large API responses
  - Particularly important for requests with extensive accessibility trees or large screenshots
  - Router now handles large payloads from tools like Stagehand without errors

## [1.1.2] - 2025-11-03

### Fixed
- **npx compatibility** - Package now properly compiles TypeScript before publishing
  - Added `build` script to compile TypeScript to `dist/`
  - Added `prepublishOnly` hook to auto-build before publishing
  - Updated `bin` paths to point to compiled `.js` files instead of source `.ts` files
  - Added `files` field to control npm package contents
  - `npx anthropic-max-router` now works correctly

## [1.1.1] - 2025-11-02

### Changed
- Enhanced router startup with ASCII art banner displaying "MAX PLAN" logo
- Added decorative "═══════ Router ═══════" subtitle to startup sequence

## [1.1.0] - 2025-11-02

### Added
- **API Router Application** - Standalone HTTP proxy server that allows any AI tool to use MAX Plan billing
  - Automatic OAuth authentication on first run
  - Transparent system prompt injection
  - Token auto-refresh with 8-hour expiration handling
  - Express-based proxy server on configurable port
- **Command Line Interface** for router
  - `--help` / `-h` - Display usage information
  - `--version` / `-v` - Show version number
  - `--port` / `-p` - Specify custom port (default: 3000)
  - Verbosity levels:
    - `--quiet` / `-q` - No request logging
    - `--minimal` / `-m` - One-line per request
    - Default (medium) - Summary per request
    - `--verbose` / `-V` - Full request/response bodies
- **Smart Logging System** - Verbosity-aware logger with request tracking
  - Request IDs and timestamps
  - Token usage reporting
  - Conditional system prompt injection logging
  - Error handling with detailed messages
- **Health Check Endpoint** - `GET /health` for monitoring router status
- **npx Support** - Can now run directly from GitHub without cloning
  - Added `bin` field to package.json
  - Added shebang to router server
  - Supports both `anthropic-max-router` and `max-router` commands
  - Run with: `npx github:nsxdavid/anthropic-max-router`
- **Comprehensive Documentation**
  - Restructured README to equally highlight CLI, Router, and Implementation Guide
  - Complete command-line options documentation
  - PowerShell and Bash curl test examples
  - Use case examples (JavaScript, Python)
  - API key usage clarification
  - npx installation instructions
  - Troubleshooting guide

### Changed
- **Repository renamed** from `anthropic-oauth-max-plan` to `anthropic-max-router`
  - Package name updated to `anthropic-max-router`
  - Better reflects that router is now the main feature
  - GitHub will auto-redirect old URLs
- README restructured to highlight both educational purpose and practical router application
- Documentation now emphasizes router as main feature while maintaining educational focus
- Improved project structure organization with router as separate application
- Updated description to better reflect router functionality

### Fixed
- TypeScript compilation error in client.ts with unknown type casting

### Features
- ✅ Standalone router - run with `npm run router`
- ✅ Zero-configuration OAuth (prompts on first run)
- ✅ Automatic system prompt injection if missing
- ✅ Works with any tool that supports custom base URLs
- ✅ Live activity monitoring with adjustable verbosity
- ✅ Configurable port via CLI or environment variable

## [1.0.0] - 2025-11-01

### Added
- Initial release of Anthropic MAX Plan OAuth implementation
- Interactive CLI with menu-driven interface
- OAuth authentication flow (PKCE)
- Token management with automatic refresh
- Chat mode for sending messages to Claude
- Proof of MAX Plan validation test feature
- Comprehensive documentation (README + Implementation Guide)
- MIT License
- Security-focused .gitignore

### Features
- ✅ Authenticate with Anthropic MAX Plan OAuth
- ✅ Access premium models (Sonnet 4.5, Opus) with flat-rate billing
- ✅ Automatic token refresh (8-hour expiration)
- ✅ Chat mode with continuous conversation
- ✅ Token storage and management
- ✅ Logout/delete tokens option
- ✅ Educational validation test to prove MAX plan enforcement

### Documentation
- Detailed implementation guide with system prompt validation tests
- Quick start guide in README
- Code examples for basic and advanced usage
- Troubleshooting section
- Security best practices

### Security
- OAuth tokens never committed to git
- Comprehensive .gitignore for secrets, tokens, and sensitive files
- Educational disclaimers throughout
- CSRF protection with state parameter validation

---

## Development Notes

This project demonstrates using Anthropic's official OAuth flow with Claude MAX subscription for flat-rate billing instead of pay-per-token pricing.

Tested and verified working as of November 1st, 2025.
