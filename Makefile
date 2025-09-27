# GeoPouch Modern Build System
.PHONY: help install dev build test clean lint format typecheck ci release

# Default target
help: ## Show this help message
	@echo "GeoPouch Modern Build System"
	@echo "Usage: make [target]"
	@echo ""
	@echo "Available targets:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development
install: ## Install dependencies
	@echo "📦 Installing dependencies..."
	@npm install

dev: ## Start development server
	@echo "🚀 Starting development server..."
	@npm run dev

# Building
build: clean ## Build the library
	@echo "🏗️  Building library..."
	@npm run build

build-legacy: ## Build using legacy browserify (for comparison)
	@echo "📦 Building with legacy browserify..."
	@npm run build:legacy

# Testing
test: ## Run all tests
	@echo "🧪 Running all tests..."
	@npm run test

test-unit: ## Run unit tests only
	@echo "🧪 Running unit tests..."
	@npm run test:unit

test-browser: ## Run browser tests only
	@echo "🌐 Running browser tests..."
	@npm run test:browser

test-legacy: ## Run legacy Mocha tests
	@echo "🧪 Running legacy tests..."
	@npm run test:legacy

test-watch: ## Run tests in watch mode
	@echo "👀 Running tests in watch mode..."
	@npm run test:watch

# Code Quality
lint: ## Run linter
	@echo "🔍 Running ESLint..."
	@npm run lint

format: ## Format code
	@echo "💅 Formatting code..."
	@npm run format

format-check: ## Check code formatting
	@echo "💅 Checking code formatting..."
	@npm run format:check

typecheck: ## Run TypeScript type checking
	@echo "🔍 Running TypeScript checks..."
	@npm run typecheck

validate: ## Run all validation (lint + format + typecheck)
	@echo "✅ Running all validation..."
	@npm run validate

# CI/CD
ci: validate build test ## Run full CI pipeline
	@echo "🤖 Running full CI pipeline..."

release: ## Create a new release
	@echo "🚀 Creating new release..."
	@npm run release

# Utilities
clean: ## Clean build artifacts
	@echo "🧹 Cleaning build artifacts..."
	@npm run clean

size: ## Analyze bundle size
	@echo "📊 Analyzing bundle size..."
	@npm run size

# Development helpers
deps-check: ## Check for outdated dependencies
	@echo "🔍 Checking for outdated dependencies..."
	@npm outdated

deps-update: ## Update dependencies (interactive)
	@echo "⬆️  Updating dependencies..."
	@npx npm-check-updates

# Git helpers
git-clean: ## Clean git working directory
	@echo "🧹 Cleaning git working directory..."
	@git clean -fd
	@git checkout -- .

commit: validate ## Commit with validation
	@echo "✅ Committing with validation..."
	@git add .
	@git commit

# Migration helpers
migrate-check: ## Check compatibility with current setup
	@echo "🔄 Checking migration compatibility..."
	@npm run test:legacy
	@npm run test:unit

migrate: install build test ## Full migration from legacy to modern
	@echo "🔄 Migration complete!"
	@echo "✅ Modern build system is ready"
	@echo "📖 Check migration documentation for next steps"