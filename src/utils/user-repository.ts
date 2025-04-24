import type {
  UserLookupResult,
  UserCreationResult,
  UserCreateData,
} from '../types/domain';

/**
 * UserRepository - Responsible for user entity persistence operations
 * 
 * Following DDD principles, this repository encapsulates all data access operations 
 * for the User aggregate root. It provides a domain-oriented interface to the 
 * underlying storage system.
 */

/**
 * Find a user by their email address
 * 
 * Used in both self-registration and invitation flows to check
 * if a user already exists before attempting to create one
 */
export const findUserByEmail = async (
  params: { email: string },
  deps: { findUserByEmailFn: (email: string) => Promise<UserLookupResult> },
): Promise<UserLookupResult> => {
  return deps.findUserByEmailFn(params.email);
};

/**
 * Create a new user account
 * 
 * Used in both self-registration and invitation flows to create
 * a new user with validated information
 */
export const createUser = async (
  params: { userData: UserCreateData },
  deps: { createUserFn: (userData: UserCreateData) => Promise<UserCreationResult> },
): Promise<UserCreationResult> => {
  return deps.createUserFn(params.userData);
}; 