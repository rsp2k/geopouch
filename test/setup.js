// Vitest setup file
import { expect } from 'vitest'
import { beforeEach, afterEach } from 'vitest'

// Global test utilities
global.should = expect

// Mock browser environment for Node.js tests
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
  global.window = global.window || {}
  global.document = global.document || {}
  global.navigator = global.navigator || {}
}

// Clean up after each test
afterEach(() => {
  // Add any global cleanup here
})

// Setup before each test
beforeEach(() => {
  // Add any global setup here
})