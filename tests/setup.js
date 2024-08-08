import { server } from '../mocks/server';
import { beforeAll, afterAll, afterEach } from 'vitest';

// Establish API mocking before all tests
beforeAll(() => server.listen());

// Reset any request handlers that are declared in a test
afterEach(() => server.resetHandlers());

// Clean up after all tests are done
afterAll(() => server.close());
