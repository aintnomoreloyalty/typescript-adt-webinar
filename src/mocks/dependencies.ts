import { jest } from '@jest/globals';
import { success, failure, some, none } from '../utils/test-utils';
import { createUser, createTeam, createInvitation } from '../utils/test-utils';
import type { User, Team, Invitation } from '../types/domain';

// Mock type definitions from domain
type RecaptchaValidationResult = any;
type UserLookupResult = any;
type TeamSlugLookupResult = any;
type InvitationLookupResult = any;

// Mock recaptcha validator
export const mockRecaptchaValidator = jest.fn<(token: string) => RecaptchaValidationResult>(
  (token: string) => {
    if (token === 'valid-token') {
      return success(undefined);
    } else {
      return failure({ kind: 'recaptcha-error', error: new Error('Invalid recaptcha') });
    }
  }
);

// Mock user lookup
export const mockUserLookup = jest.fn<(email: string) => UserLookupResult>(
  (email: string) => {
    if (email === 'existing@example.com') {
      return success(some(createUser({ email })));
    } else {
      return success(none());
    }
  }
);

// Mock team lookup
export const mockTeamLookup = jest.fn<(slug: string) => TeamSlugLookupResult>(
  (slug: string) => {
    if (slug === 'existing-team') {
      return success(some(createTeam({ slug })));
    } else {
      return success(none());
    }
  }
);

// Mock invitation lookup
export const mockInvitationLookup = jest.fn<(token: string) => InvitationLookupResult>(
  (token: string) => {
    if (token === 'not-found') {
      return success(none());
    } else if (token === 'expired-token') {
      return success(some(createInvitation({ 
        token, 
        expires: new Date(Date.now() - 86400000) // 24 hours in the past
      })));
    } else if (token === 'db-error') {
      return failure({ kind: 'db-error', error: new Error('Database error') });
    } else {
      return success(some(createInvitation({ token })));
    }
  }
);

// Mock user creation
export const mockUserCreation = jest.fn((userData: any) => {
  if (userData.email === 'db-error@example.com') {
    return failure({ kind: 'db-error', error: new Error('Failed to create user') });
  }
  return success(createUser(userData));
});

// Mock team creation
export const mockTeamCreation = jest.fn((teamData: any) => {
  if (teamData.name === 'DB Error Team') {
    return failure({ kind: 'db-error', error: new Error('Failed to create team') });
  }
  return success(createTeam(teamData));
});

// Mock email verification
export const mockEmailVerification = jest.fn((email: string) => {
  if (email === 'email-error@example.com') {
    return failure({ kind: 'email-send-error', error: new Error('Failed to send email') });
  }
  return success(undefined);
});

// Mock metrics recording
export const mockMetricsRecording = jest.fn(() => {
  return success(undefined);
});

// Mock slack notification
export const mockSlackNotification = jest.fn(() => {
  return success(undefined);
}); 