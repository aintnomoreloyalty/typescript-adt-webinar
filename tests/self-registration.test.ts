import { describe, it, expect } from '@jest/globals';
import { success, failure, Result } from '../src/types/result';
import { some, none } from '../src/types/option';
import type {
  JoinSelf,
  User,
  Team,
  DBError,
  FormValidationError,
  UserLookupResult,
  TeamSlugLookupResult,
} from '../src/types/domain';
import {
  validateForm,
  checkUserExists,
  checkTeamUnique,
  createUser,
  createTeam,
  sendVerificationEmail,
  recordMetrics,
  sendNotifications,
  formatResponse,
} from '../src/services/self-registration';
import { isSuccess, isFailure, assertErrorKind, assertSuccessValue } from './util/test-helpers';

describe('Self Registration Journey', () => {
  describe('Component Tests', () => {
    describe('Form validation', () => {
      const createTestRequest = (overrides?: Partial<JoinSelf>): JoinSelf => ({
        kind: 'self',
        name: 'Test User',
        email: 'test@example.com',
        password: 'StrongPass123!',
        team: 'Test Team',
        recaptchaToken: 'valid-token',
        ...overrides,
      });

      // Test cases for input validation with different forms of invalid data
      it.each([
        ['empty name', { name: '' }, 'name-validation-error'],
        ['empty password', { password: '' }, 'password-validation-error'],
        ['weak password', { password: 'weak' }, 'password-validation-error'],
        ['invalid email format', { email: 'not-an-email' }, 'email-validation-error'],
        ['non-work email', { email: 'personal@gmail.com' }, 'email-validation-error'],
      ])('should fail validation with %s', (_, invalidData, expectedInnerErrorKind) => {
        // Arrange
        const request = createTestRequest(invalidData);

        // Act
        const result = validateForm({ request });

        // Assert
        assertErrorKind(result, 'form-validation-error');
        if (isFailure(result)) {
          const formError = result.error as FormValidationError;
          const hasExpectedError = formError.innerErrors.some(
            (err) => err.kind === expectedInnerErrorKind,
          );
          expect(hasExpectedError).toBe(true);
        }
      });

      it('should succeed with valid form data', () => {
        // Arrange
        const request = createTestRequest();

        // Act
        const result = validateForm({ request });

        // Assert
        assertSuccessValue(result, (value) => {
          expect(value).toBeUndefined();
        });
      });
    });

    describe('User existence check', () => {
      it('should fail when user already exists', async () => {
        // Arrange
        const email = 'existing@example.com';
        const existingUser = { id: 'user1', name: 'Existing User', email };
        // Act
        const result = await checkUserExists({ user: some(existingUser) });

        // Assert
        assertErrorKind(result, 'user-exists-error');
      });

      it('should succeed when user does not exist', async () => {
        // Arrange
        // Act
        const result = await checkUserExists({ user: none() });

        // Assert
        assertSuccessValue(result, (value) => {
          expect(value).toBeUndefined();
        });
      });
    });

    describe('Team uniqueness check', () => {
      it('should fail when team already exists', async () => {
        // Arrange
        const team = 'Existing Team';
        const existingTeam = {
          id: 'team1',
          name: team,
          slug: 'existing-team',
          ownerId: 'user-id-1',
        };

        // Act
        const result = await checkTeamUnique({ team: some(existingTeam) });

        // Assert
        assertErrorKind(result, 'team-exists-error');
      });

      it('should succeed when team does not exist', async () => {
        // Act
        const result = await checkTeamUnique({ team: none() });

        // Assert
        assertSuccessValue(result, (value) => {
          expect(value).toBeUndefined();
        });
      });
    });

    describe('User creation', () => {
      it('should create a user successfully', async () => {
        // Arrange
        const request: JoinSelf = {
          kind: 'self',
          name: 'Test User',
          email: 'test@example.com',
          password: 'StrongPass123!',
          team: 'Test Team',
          recaptchaToken: 'valid-token',
        };
        const expectedUser: User = {
          id: 'user-id-1',
          name: request.name,
          email: request.email,
        };
        const userCreateFn = async () => success(expectedUser);

        // Act
        const result = await createUser({ request }, { userCreateFn });

        // Assert
        assertSuccessValue(result, (value) => {
          expect(value).toEqual(expectedUser);
        });
      });

      it('should handle database errors during user creation', async () => {
        // Arrange
        const request: JoinSelf = {
          kind: 'self',
          name: 'Test User',
          email: 'db-error@example.com',
          password: 'StrongPass123!',
          team: 'Test Team',
          recaptchaToken: 'valid-token',
        };
        const dbError = { kind: 'db-error', error: new Error('Database error') } as const;
        const userCreateFn = async () => failure(dbError);

        // Act
        const result = await createUser({ request }, { userCreateFn });

        // Assert
        assertErrorKind(result, 'db-error');
      });
    });

    describe('Team creation', () => {
      it('should create a team successfully', async () => {
        // Arrange
        const request: JoinSelf = {
          kind: 'self',
          name: 'Test User',
          email: 'test@example.com',
          password: 'StrongPass123!',
          team: 'Test Team',
          recaptchaToken: 'valid-token',
        };
        const user: User = {
          id: 'user-id-1',
          name: request.name,
          email: request.email,
        };
        const expectedTeam: Team = {
          id: 'team-id-1',
          name: request.team,
          slug: 'test-team',
          ownerId: 'user-id-1',
        };
        const teamCreateFn = async () => success(expectedTeam);

        // Act
        const result = await createTeam({ request, user }, { teamCreateFn });

        // Assert
        assertSuccessValue(result, (value) => {
          expect(value).toEqual(expectedTeam);
        });
      });
    });

    describe('Email verification', () => {
      it('should send verification email successfully', async () => {
        // Arrange
        const request: JoinSelf = {
          kind: 'self',
          name: 'Test User',
          email: 'test@example.com',
          password: 'StrongPass123!',
          team: 'Test Team',
          recaptchaToken: 'valid-token',
        };
        const emailSendFn = async () => success(undefined);

        // Act
        const result = await sendVerificationEmail({ request }, { emailSendFn });

        // Assert
        expect(result.kind).toBe('success');
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle the complete registration flow', async () => {
      // Arrange
      const request: JoinSelf = {
        kind: 'self',
        name: 'Test User',
        email: 'test@example.com',
        password: 'StrongPass123!',
        team: 'Test Team',
        recaptchaToken: 'valid-token',
      };

      // Mock dependencies
      const userLookupFn = jest.fn().mockResolvedValue(success(none())) as (
        email: string,
      ) => Promise<UserLookupResult>;
      const teamLookupFn = jest.fn().mockResolvedValue(success(none())) as (
        team: string,
      ) => Promise<TeamSlugLookupResult>;

      const user: User = {
        id: 'user-id-1',
        name: request.name,
        email: request.email,
      };
      const userCreateFn = jest.fn().mockResolvedValue(success(user));

      const team: Team = {
        id: 'team-id-1',
        name: request.team,
        slug: 'test-team',
        ownerId: 'user-id-1',
      };
      const teamCreateFn = jest.fn().mockResolvedValue(success(team));

      const emailSendFn = jest.fn().mockResolvedValue(success(undefined));
      const metricsRecordFn = jest.fn().mockResolvedValue(success(undefined));
      const notifyFn = jest.fn().mockResolvedValue(success(undefined));

      const deps = {
        userLookupFn,
        teamLookupFn,
        userCreateFn,
        teamCreateFn,
        emailSendFn,
        metricsRecordFn,
        notifyFn,
      };

      // Act - Execute the registration process
      const formResult = validateForm({ request });

      if (isFailure(formResult)) return expect(true).toBe(false);

      const userLookupResult = await userLookupFn(request.email);

      if (isFailure(userLookupResult)) return expect(true).toBe(false);

      const userExistsResult = await checkUserExists({ user: userLookupResult.value });

      if (isFailure(userExistsResult)) return expect(true).toBe(false);

      const teamLookupResult = await teamLookupFn(request.team);

      if (isFailure(teamLookupResult)) return expect(true).toBe(false);

      const teamUniqueResult = await checkTeamUnique({ team: teamLookupResult.value });

      if (isFailure(teamUniqueResult)) return expect(true).toBe(false);

      const userCreationResult = await createUser({ request }, { userCreateFn });

      if (isFailure(userCreationResult)) return expect(true).toBe(false);

      const teamCreationResult = await createTeam(
        { request, user: userCreationResult.value },
        { teamCreateFn },
      );

      if (isFailure(teamCreationResult)) return expect(true).toBe(false);

      const emailResult = await sendVerificationEmail({ request }, { emailSendFn });

      if (isFailure(emailResult)) return expect(true).toBe(false);

      const metricsResult = await recordMetrics(
        { request },
        { recordMetricsFn: deps.metricsRecordFn },
      );

      if (isFailure(metricsResult)) return expect(true).toBe(false);

      const notifyResult = await sendNotifications({ request }, { notifyFn });

      if (isFailure(notifyResult)) return expect(true).toBe(false);

      const finalResult = await formatResponse({
        user: userCreationResult.value,
        team: teamCreationResult.value,
      });

      // Assert
      assertSuccessValue(finalResult, (value) => {
        expect(value.user).toEqual(user);
        expect(value.team).toEqual(team);
        expect(value.confirmEmail).toBe(true);
      });

      // Verify all functions were called
      expect(userLookupFn).toHaveBeenCalledWith(request.email);
      expect(teamLookupFn).toHaveBeenCalledWith(request.team);
      expect(userCreateFn).toHaveBeenCalled();
      expect(teamCreateFn).toHaveBeenCalled();
      expect(emailSendFn).toHaveBeenCalled();
      expect(metricsRecordFn).toHaveBeenCalled();
      expect(notifyFn).toHaveBeenCalled();
    });
  });
});
