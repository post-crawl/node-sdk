# PostCrawl Node.js SDK Development Guide

This guide is for developers working on the PostCrawl Node.js SDK itself.

## Development Setup

### Prerequisites

- Node.js 18+ or Bun
- TypeScript 5.0+
- Git

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/post-crawl/node-sdk.git
cd node-sdk

# Install dependencies
bun install

# Create .env file for testing
echo "POSTCRAWL_API_KEY=sk_your_test_key_here" > .env
```

## Project Structure

```
node-sdk/
├── src/                    # Source code
│   ├── index.ts           # Main exports
│   ├── client.ts          # PostCrawlClient implementation
│   ├── constants.ts       # API constants
│   ├── exceptions.ts      # Error classes
│   ├── types.ts           # TypeScript types
│   └── generated-types.ts # Auto-generated types
├── tests/                 # Test files
│   ├── client.test.ts     # Client tests
│   ├── types.test.ts      # Type validation tests
│   └── fixtures.ts        # Test fixtures
├── examples/              # Example scripts
├── dist/                  # Build output
├── package.json           # Package configuration
├── tsconfig.json          # TypeScript config
├── tsup.config.ts         # Build config
├── vitest.config.ts       # Test config
├── biome.json            # Linting/formatting config
└── Makefile              # Development shortcuts
```

## Available Commands

### Development

```bash
# Run tests in watch mode
bun run test:watch

# Run tests once
bun run test

# Run tests with coverage
bun run test:coverage

# Type checking
bun run typecheck

# Linting and formatting
bun run check:biome

# Full quality check
bun run check

# Build the package
bun run build

# Watch mode for development
bun run dev
```

### Using Make

```bash
# Show all available commands
make help

# Run all tests
make test

# Run specific test file
make test-types
make test-client

# Format code
make format

# Run all checks
make check

# Clean build artifacts
make clean

# Build distribution
make build
```

## Code Style

This project uses Biome for linting and formatting with the following key rules:

- **Indentation**: Tabs (not spaces)
- **Quotes**: Double quotes for strings
- **Semicolons**: Required
- **Trailing commas**: Not required
- **Import organization**: Automatic with Biome

Run `bun run biome format --write .` to automatically format your code.

## Testing

### Running Tests

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run with coverage
bun run test:coverage

# Run specific test file
bun run test tests/client.test.ts
```

### Writing Tests

Tests are written using Vitest. Follow these patterns:

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = someFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Test Coverage

Aim for high test coverage, especially for:
- Error handling paths
- Type validation
- Network retry logic
- Rate limit handling

## Type Generation

Types are generated from the PostCrawl OpenAPI specification:

```bash
# Regenerate types from OpenAPI
make generate-types
```

This runs the type generation script in the `typegen` directory. Never manually edit `src/generated-types.ts`.

## API Changes

When the PostCrawl API changes:

1. Update the OpenAPI specification
2. Regenerate types: `make generate-types`
3. Update client methods if needed
4. Update tests to match new types
5. Update examples if behavior changed

## Publishing

### Pre-release Checklist

1. **Update version** in `package.json`
2. **Run all checks**: `make check`
3. **Build package**: `make build`
4. **Test build locally**: `npm pack`
5. **Update CHANGELOG** if exists

### Release Process

```bash
# Dry run to check what will be published
npm publish --dry-run

# Publish to npm
npm publish
```

For maintainers with publish access only.

## Debugging

### Enable Debug Logging

Set the `DEBUG` environment variable:

```bash
DEBUG=postcrawl:* bun run test
```

### Testing Against Local API

To test against a local PostCrawl API:

```typescript
const pc = new PostCrawlClient({
  apiKey: 'sk_test',
  baseUrl: 'http://localhost:8787'
});
```

## Common Issues

### TypeScript Errors

If you see TypeScript errors after updating dependencies:

```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
rm -rf *.tsbuildinfo

# Reinstall dependencies
bun install

# Rebuild
bun run build
```

### Test Failures

If tests are failing:

1. Check if API responses have changed
2. Verify test fixtures match current API format
3. Ensure generated types are up to date

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `bun run test`
5. Run checks: `bun run check`
6. Commit with clear message
7. Push and create Pull Request

## Architecture Decisions

### Why Fetch API?

We use the native Fetch API instead of axios or other HTTP clients because:
- Zero dependencies for HTTP
- Native to modern Node.js and browsers
- Smaller bundle size
- Built-in TypeScript types

### Why Zod?

Zod provides runtime validation with TypeScript inference:
- Validates API responses at runtime
- Generates TypeScript types from schemas
- Better error messages for validation failures
- Smaller than alternatives like Joi

### Dual Build (ESM + CJS)

We provide both ESM and CommonJS builds:
- ESM for modern environments
- CJS for legacy Node.js projects
- Automatic detection via package.json exports

## Performance Considerations

### Bundle Size

Keep the bundle small:
- Minimize dependencies
- Tree-shake unused code
- Use dynamic imports sparingly

### Network Efficiency

- Reuse HTTP connections (built into Fetch)
- Implement exponential backoff for retries
- Respect rate limits

## Security

### API Keys

- Never commit API keys
- Use environment variables
- Validate key format client-side

### Input Validation

- Validate all user inputs
- Sanitize URLs before requests
- Use Zod schemas for type safety

## Maintenance

### Dependency Updates

```bash
# Check for updates
bunx npm-check-updates

# Update dependencies
bun update
```

Test thoroughly after updates, especially:
- TypeScript
- Vitest
- Zod

### API Compatibility

Maintain backward compatibility:
- Don't remove public methods
- Deprecate before removing
- Follow semantic versioning

## Support

For SDK development questions:
- Open an issue on GitHub
- Check existing issues first
- Include reproduction steps