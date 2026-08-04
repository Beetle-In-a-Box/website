/**
 * Shared helpers for restoring spies in test teardown.
 *
 * spyOn() replaces a module export with a mock that carries a mockRestore()
 * method, but the module's own type signature has no knowledge of it. These
 * helpers narrow that gap in one place instead of casting at every call site.
 */

interface RestorableMock {
    mockRestore?: () => void
}

/**
 * Restore a single spied-on function, if it was actually spied on.
 * Safe to call on a function that was never mocked.
 */
export function restoreMock(fn: unknown): void {
    ;(fn as RestorableMock).mockRestore?.()
}

/**
 * Restore several spied-on functions at once. Intended for afterEach() blocks.
 */
export function restoreMocks(...fns: unknown[]): void {
    for (const fn of fns) restoreMock(fn)
}
