import { failure } from '../types/result';
import type { RecaptchaValidationResult } from '../types/domain';

/**
 * RecaptchaValidation Operation
 *
 * Validates user-provided recaptcha tokens to prevent automated submissions
 * Part of the boundary validation phase of the registration railway
 */
export const validateRecaptcha = async (
  params: { token: string },
  deps: { validateRecaptcha: (token: string) => Promise<RecaptchaValidationResult> },
): Promise<RecaptchaValidationResult> => {
  if (params.token.trim() === '') {
    return failure({
      kind: 'recaptcha-error',
      reason: 'not-provided',
    });
  }

  return deps.validateRecaptcha(params.token);
};