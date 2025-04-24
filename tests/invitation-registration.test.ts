import { describe, it, expect, jest } from '@jest/globals';
import { success, failure, Result } from '../src/types/result';
import { some, none } from '../src/types/option';
import type {
  JoinByInvitation,
  Invitation,
  RecaptchaError,
  RecaptchaValidationResult,
  InvitationLookupResult,
} from '../src/types/domain';
import {
  validateInviteForm,
  getInvitation,
  checkInvitationExpiry,
} from '../src/services/invitation-registration';
import { assertErrorKind, assertSuccessValue, isFailure, isSuccess } from './util/test-helpers';

describe('Invitation Registration Journey', () => {
  // Test individual components with specific scenarios
  describe('Component Tests', () => {
    describe('Invitation retrieval', () => {
      it('should fail when invitation is not found', async () => {
        // Arrange
        const token = 'not-found-token';
        const invitationLookupResult = success(none());

        // Act - Use a function reference that returns no invitation
        const invitationLookupFn = jest
          .fn<() => Promise<InvitationLookupResult>>()
          .mockResolvedValue(invitationLookupResult);
        const result = await getInvitation({ token }, { invitationLookupFn });

        // Assert using type narrowing
        assertErrorKind(result, 'invitation-not-found-error');
        expect(invitationLookupFn).toHaveBeenCalledWith(token);
      });

      it('should succeed when invitation exists', async () => {
        // Arrange
        const token = 'valid-token';
        const validInvitation: Invitation = {
          token: 'valid-token',
          expires: new Date(Date.now() + 86400000), // 24 hours in the future
          team: {
            slug: 'test-team',
            id: 'test-team-id',
            name: 'Test Team',
            ownerId: 'test-owner-id',
          },
          email: 'invited@example.com',
          sentViaEmail: true,
        };
        const invitationLookupResult = success(some(validInvitation));

        // Act
        const invitationLookupFn = jest
          .fn<() => Promise<InvitationLookupResult>>()
          .mockResolvedValue(invitationLookupResult);
        const result = await getInvitation({ token }, { invitationLookupFn });

        // Assert with type narrowing
        assertSuccessValue(result, (value) => {
          expect(value).toEqual(validInvitation);
        });
        expect(invitationLookupFn).toHaveBeenCalledWith(token);
      });
    });

    describe('Invitation expiry check', () => {
      it('should fail when invitation has expired', async () => {
        // Arrange
        const expiredInvitation: Invitation = {
          token: 'expired-token',
          expires: new Date(Date.now() - 86400000), // 24 hours in the past
          team: {
            slug: 'test-team',
            id: 'test-team-id',
            name: 'Test Team',
            ownerId: 'test-owner-id',
          },
          email: 'invited@example.com',
          sentViaEmail: true,
        };

        // Act
        const result = await checkInvitationExpiry({
          invitation: expiredInvitation,
          now: new Date(),
        });

        // Assert with type narrowing
        assertErrorKind(result, 'invitation-expired-error');
      });

      it('should succeed when invitation is valid', async () => {
        // Arrange
        const validInvitation: Invitation = {
          token: 'valid-token',
          expires: new Date(Date.now() + 86400000), // 24 hours in the future
          team: {
            slug: 'test-team',
            id: 'test-team-id',
            name: 'Test Team',
            ownerId: 'test-owner-id',
          },
          email: 'invited@example.com',
          sentViaEmail: true,
        };

        // Act
        const result = await checkInvitationExpiry({
          invitation: validInvitation,
          now: new Date(),
        });

        // Assert with type narrowing
        assertSuccessValue(result, (value) => {
          expect(value).toEqual(validInvitation);
        });
      });

      // Test using test.each pattern for boundary testing of expiry
      it.each([
        { label: 'exactly expired', offsetMs: 0, shouldBeValid: false },
        { label: '1ms before expiry', offsetMs: 1, shouldBeValid: true },
        { label: '1ms after expiry', offsetMs: -1, shouldBeValid: false },
        { label: '1 hour before expiry', offsetMs: 3600000, shouldBeValid: true },
        { label: '1 hour after expiry', offsetMs: -3600000, shouldBeValid: false },
      ])('should handle invitation $label correctly', async ({ offsetMs, shouldBeValid }) => {
        // Arrange - Set expiry time relative to current time
        const now = new Date();
        const expiryDate = new Date(now.getTime() + offsetMs);

        const invitation: Invitation = {
          token: 'test-token',
          expires: expiryDate,
          team: {
            slug: 'test-team',
            id: 'test-team-id',
            name: 'Test Team',
            ownerId: 'test-owner-id',
          },
          email: 'invited@example.com',
          sentViaEmail: true,
        };

        // Act
        const result = await checkInvitationExpiry({
          invitation,
          now,
        });

        // Assert
        if (shouldBeValid) {
          assertSuccessValue(result, (value) => {
            expect(value).toEqual(invitation);
          });
        } else {
          assertErrorKind(result, 'invitation-expired-error');
        }
      });
    });

    describe('Form validation', () => {
      const createTestRequest = (overrides?: Partial<JoinByInvitation>): JoinByInvitation => ({
        kind: 'invitation',
        name: 'Test User',
        password: 'Password123!',
        inviteToken: 'valid-token',
        recaptchaToken: 'valid-recaptcha',
        ...overrides,
      });

      // Test form validation with test.each pattern for different invalid scenarios
      it.each([
        {
          scenario: 'empty name',
          request: createTestRequest({ name: '' }),
          expectedErrorKind: 'name-validation-error',
        },
        {
          scenario: 'weak password',
          request: createTestRequest({ password: 'password' }),
          expectedErrorKind: 'password-validation-error',
        },
        {
          scenario: 'password too short',
          request: createTestRequest({ password: 'Abc1!' }),
          expectedErrorKind: 'password-validation-error',
        },
      ])('should fail form validation with $scenario', ({ request, expectedErrorKind }) => {
        // Arrange
        const email = 'invited@example.com';

        // Act
        const result = validateInviteForm({ request, email });

        // Assert with type narrowing
        assertErrorKind(result, 'form-validation-error');
        if (isFailure(result)) {
          const formError = result.error;
          const hasExpectedError = formError.innerErrors.some(
            (err) => err.kind === expectedErrorKind,
          );
          expect(hasExpectedError).toBe(true);
        }
      });

      it('should succeed with valid form data', () => {
        // Arrange
        const request = createTestRequest();
        const email = 'invited@example.com';

        // Act
        const result = validateInviteForm({ request, email });

        // Assert with type narrowing
        assertSuccessValue(result, (value) => {
          expect(value).toBeUndefined();
        });
      });
    });
  });
});
