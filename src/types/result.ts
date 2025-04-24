export type Success<T> = { kind: 'success'; value: T };
export type Failure<E> = { kind: 'failure'; error: E };
export type Result<T, E> = Success<T> | Failure<E>;

// Helper functions
export const success = <T>(value: T): Success<T> => ({ kind: 'success', value });
export const failure = <E>(error: E): Failure<E> => ({ kind: 'failure', error });

// Result combinators
export const map = <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> =>
  result.kind === 'success' ? success(fn(result.value)) : result;

export const bind = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> => (result.kind === 'success' ? fn(result.value) : result);


/**
 * Type guard to narrow a Result to Success
 */
export function isSuccess<T, E>(result: Result<T, E>): result is { kind: 'success'; value: T } {
  return result.kind === 'success';
}

/**
 * Type guard to narrow a Result to Failure
 */
export function isFailure<T, E>(result: Result<T, E>): result is { kind: 'failure'; error: E } {
  return result.kind === 'failure';
}