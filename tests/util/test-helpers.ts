import { Result } from '../../src/types/result';
import { expect } from '@jest/globals';
import { isFailure, isSuccess } from '../../src/types/result';

export { isFailure, isSuccess };

/**
 * Helper to check error kind with proper type narrowing
 * Avoids using 'as any' casts by using type guards
 */
export function assertErrorKind<E>(result: Result<unknown, E>, expectedKind: string): void {
  expect(result.kind).toBe('failure');
  if (isFailure(result)) {
    const error = result.error;
    
    // Check if it's a FormValidationError with innerErrors array
    if (
      (error as any).kind === 'form-validation-error' && 
      Array.isArray((error as any).innerErrors) && 
      (error as any).innerErrors.length > 0
    ) {
      // For form validation errors, we just check the outer error kind
      expect((error as { kind: string }).kind).toBe(expectedKind);
    } else {
      // For other error types, check the specific error kind
      expect((error as { kind: string }).kind).toBe(expectedKind);
    }
  }
}

/**
 * Helper to check success value with proper type narrowing
 */
export function assertSuccessValue<T>(
  result: Result<T, unknown>,
  valueMatcher: (value: T) => void
): void {
  expect(result.kind).toBe('success');
  if (isSuccess(result)) {
    valueMatcher(result.value);
  }
} 