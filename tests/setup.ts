/**
 * Test setup file for React Testing Library with Bun
 */

// Configure happy-dom as the test environment
import { beforeAll, afterEach } from 'bun:test'
import { cleanup } from '@testing-library/react'
import { Window } from 'happy-dom'

// Cleanup after each test
afterEach(() => {
    cleanup()
})

// Set up happy-dom environment
beforeAll(() => {
    const window = new Window()
    // @ts-expect-error - Setting global window for tests
    global.window = window
    // @ts-expect-error - Setting global document for tests
    global.document = window.document
    // @ts-expect-error - Setting global navigator for tests
    global.navigator = window.navigator
})
