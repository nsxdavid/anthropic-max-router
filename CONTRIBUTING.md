# Contributing to Anthropic MAX Plan Router

Thank you for your interest in contributing! This project welcomes contributions from the community.

## How to Contribute

### Reporting Issues

- Check existing issues before creating a new one
- Include as much detail as possible:
  - Node.js version
  - Operating system
  - Steps to reproduce
  - Expected vs actual behavior
  - Router logs (use `--verbose` flag)

### Suggesting Features

- Open an issue with the `enhancement` label
- Describe the use case and benefits
- Include examples if possible

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Test thoroughly** - See [TESTING.md](TESTING.md)
5. **Submit a Pull Request**

## Development Setup

\`\`\`bash
git clone https://github.com/nsxdavid/anthropic-max-router
cd anthropic-max-router
npm install
npm run build
\`\`\`

## Testing

\`\`\`bash
# Build
npm run build

# Run router
npm run router -- --enable-all-endpoints --verbose

# In another terminal, run tests
node test-openai-endpoint.js
\`\`\`

See [TESTING.md](TESTING.md) for comprehensive testing guide.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
