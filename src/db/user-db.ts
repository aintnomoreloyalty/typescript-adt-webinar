import { Result, success, failure } from '../types/result';
import { Option, some, none } from '../types/option';
import {
  User,
  UserCreateData,
  UserLookupResult,
  UserCreationResult,
  DBError,
} from '../types/domain';

// In-memory storage for users
const users: Record<string, User> = {};

/**
 * Simulates looking up a user by email in the database
 */
export async function findUserByEmail(email: string): Promise<UserLookupResult> {
  try {
    // Simulate some processing time
    // In a real implementation, this would query a database
    await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay to simulate DB access

    const foundUser = Object.values(users).find((user) => user.email === email);

    return success(foundUser ? some(foundUser) : none());
  } catch (error) {
    return failure({
      kind: 'db-error',
      error:
        error instanceof Error
          ? error
          : new Error(`Unknown error during user lookup: ${String(error)}`),
    });
  }
}

export async function findUserById(id: string): Promise<UserLookupResult> {
  try {
    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay to simulate DB access

    const foundUser = Object.values(users).find((user) => user.id === id);

    return success(foundUser ? some(foundUser) : none());
  } catch (error) {
    return failure({
      kind: 'db-error',
      error:
        error instanceof Error
          ? error
          : new Error(`Unknown error during user lookup: ${String(error)}`),
    });
  }
}

/**
 * Simulates creating a new user in the database
 */
export async function createUser(userData: UserCreateData): Promise<UserCreationResult> {
  try {
    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay to simulate DB access

    // Check if user already exists
    const existingUser = Object.values(users).find((user) => user.email === userData.email);
    if (existingUser) {
      return failure({
        kind: 'db-error',
        error: new Error(`User with email ${userData.email} already exists`),
      });
    }

    // Create a new user with random ID
    const newUser: User = {
      id: `user-${Math.random().toString(36).substring(2, 9)}`,
      name: userData.name,
      email: userData.email,
    };

    // Store in our "database"
    users[newUser.id] = newUser;

    return success(newUser);
  } catch (error) {
    return failure({
      kind: 'db-error',
      error:
        error instanceof Error
          ? error
          : new Error(`Unknown error during user creation: ${String(error)}`),
    });
  }
}

/**
 * For testing: clear all users
 */
export function clearAllUsers(): void {
  Object.keys(users).forEach((key) => {
    delete users[key];
  });
}

/**
 * For testing: add test users
 */
export function addTestUser(user: User): void {
  users[user.id] = user;
}
