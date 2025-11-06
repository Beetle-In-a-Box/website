import { PrismaClient } from '@prisma/client'

// Create a mock Prisma client for testing
export const prismaMock = {
    issue: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    article: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
} as unknown as PrismaClient

// Mock the prisma module
jest.mock('@/utils/prisma', () => ({
    prisma: prismaMock,
}))

// Reset all mocks before each test
beforeEach(() => {
    jest.clearAllMocks()
})
