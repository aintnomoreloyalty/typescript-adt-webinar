import { Result, Success, Failure, success, failure } from '../types/result';
import { Option, Some, None, some, none } from '../types/option';
import type { User, Team, Invitation } from '../types/domain';

// Re-export the helpers for convenience
export { success, failure, some, none };

// Mock factory for User
export const createUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-id-1',
  name: 'Test User',
  email: 'test@example.com',
  ...overrides
});

// Mock factory for Team
export const createTeam = (overrides: Partial<Team> = {}): Team => ({
  id: 'team-id-1',
  name: 'Test Team',
  slug: 'test-team',
  ...overrides
});

// Mock factory for Invitation
export const createInvitation = (overrides: Partial<Invitation> = {}): Invitation => ({
  token: 'valid-token',
  expires: new Date(Date.now() + 86400000), // 24 hours in the future
  team: { slug: 'test-team' },
  email: 'invited@example.com',
  sentViaEmail: true,
  ...overrides
});

// Test assertion helpers
export const assertSuccess = <T, E>(result: Result<T, E>): T => {
  expect(result.kind).toBe('success');
  return (result as Success<T>).value;
};

export const assertFailure = <T, E>(result: Result<T, E>, errorKind?: string): E => {
  expect(result.kind).toBe('failure');
  const error = (result as Failure<E>).error;
  if (errorKind) {
    expect((error as any).kind).toBe(errorKind);
  }
  return error;
};

export const assertSome = <T>(option: Option<T>): T => {
  expect(option.kind).toBe('some');
  return (option as Some<T>).value;
};

export const assertNone = <T>(option: Option<T>): void => {
  expect(option.kind).toBe('none');
}; 