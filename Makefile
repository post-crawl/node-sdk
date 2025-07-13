# PostCrawl Node.js SDK Makefile

.PHONY: help install test test-types test-client test-coverage clean format lint typecheck dev check examples search extract sne build verify publish generate-types quick-test ci

# Default target - show help
.DEFAULT_GOAL := help

# Show available commands
help:
	@echo "PostCrawl Node.js SDK - Available Commands:"
	@echo ""
	@echo "Development:"
	@echo "  make dev          Install all dependencies"
	@echo "  make test         Run all tests"
	@echo "  make format       Format code with biome"
	@echo "  make lint         Run linting checks"
	@echo "  make typecheck    Run TypeScript type checking"
	@echo "  make check        Run all checks (format, lint, types, tests)"
	@echo ""
	@echo "Examples:"
	@echo "  make examples     Run all examples"
	@echo "  make search       Run search example"
	@echo "  make extract      Run extract example"
	@echo "  make sne          Run search and extract example"
	@echo ""
	@echo "Build & Release:"
	@echo "  make build        Build distribution packages"
	@echo "  make clean        Clean build artifacts"
	@echo "  make verify       Verify package (dry run)"
	@echo "  make publish      Publish to npm (requires login)"
	@echo "  make release      Full release process (test, build, publish)"
	@echo "  make version-patch Bump patch version (1.0.0 -> 1.0.1)"
	@echo "  make version-minor Bump minor version (1.0.0 -> 1.1.0)"
	@echo "  make version-major Bump major version (1.0.0 -> 2.0.0)"
	@echo ""
	@echo "Type Generation:"
	@echo "  make generate-types Regenerate types from OpenAPI"

# Install dependencies
install:
	bun install

# Install dev dependencies
dev:
	bun install

# Run all tests
test:
	bun run test

# Run only type tests
test-types:
	bun run test tests/types.test.ts

# Run only client tests
test-client:
	bun run test tests/client.test.ts

# Run tests with coverage
test-coverage:
	bun run test:coverage

# Format code
format:
	bun run biome format --write .

# Lint code
lint:
	bun run biome lint .

# Type check
typecheck:
	bun run check:types

# Run all quality checks (format, lint, tests)
check:
	bun run check

# Clean up
clean:
	rm -rf dist/
	rm -rf coverage/
	rm -rf .vitest/
	rm -rf *.tsbuildinfo
	rm -rf node_modules/.cache

# Generate types from OpenAPI
generate-types:
	cd ../typegen && bun run generate

# Quick test after changes
quick-test: test-types

# Full CI-like check
ci: check

# Run all examples
examples: search extract sne

# Run search example
search:
	cd examples && bun run search_101.ts

# Run extract example
extract:
	cd examples && bun run extract_101.ts

# Run search and extract example
sne:
	cd examples && bun run search_and_extract_101.ts

# Build distribution packages
build: clean
	bun run build

# Verify package before publishing (dry run)
verify: build
	bun publish --dry-run

# Publish to npm (production)
publish: build
	bun publish --access public

# Version management
version-patch:
	bun run version:patch

version-minor:
	bun run version:minor

version-major:
	bun run version:major

# Full release process
release: check build
	@echo "Running full release process..."
	@echo "1. All checks passed ✓"
	@echo "2. Build complete ✓"
	@echo "3. Ready to publish"
	@echo ""
	@echo "To publish, run: make publish"
	@echo "Or to create a new version first: make version-<patch|minor|major>"
