export type Some<T> = { kind: 'some'; value: T };
export type None = { kind: 'none' };
export type Option<T> = Some<T> | None;

// Helper functions
export const some = <T>(value: T): Some<T> => ({ kind: 'some', value });
export const none = (): None => ({ kind: 'none' });

// Option combinators
export const mapOption = <T, U>(option: Option<T>, fn: (value: T) => U): Option<U> =>
  option.kind === 'some' ? some(fn(option.value)) : option;

export const bindOption = <T, U>(option: Option<T>, fn: (value: T) => Option<U>): Option<U> =>
  option.kind === 'some' ? fn(option.value) : option;
