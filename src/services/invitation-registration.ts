import { success, failure } from '../types/result';
import type {
  JoinByInvitation,
  User,
  Team,
  Invitation,
  InviteRecaptchaValidationResult,
  InvitationLookupResult,
  InvitationExistsResult,
  InvitationExpiryResult,
  InviteEmailValidationResult,
  InviteFormValidationResult,
  InviteUserLookupResult,
  InviteUserExistsResult,
  InviteUserCreationResult,
  InviteTeamLookupResult,
  InviteTeamExistsResult,
  InviteMetricsRecordResult,
  InviteSlackNotifyResult,
  RegistrationResult,
  InviteNameValidationError,
  InvitePasswordValidationError,
  UserCreateData,
} from '../types/domain';

// Validate recaptcha token
export const validateRecaptcha = async (
  params: { token: string },
  deps: { validateRecaptcha: (token: string) => Promise<InviteRecaptchaValidationResult> },
): Promise<InviteRecaptchaValidationResult> => {
  if (params.token.trim() === '') {
    return failure({
      kind: 'recaptcha-error',
      reason: 'not-provided',
    });
  }

  const validationCheck = await deps.validateRecaptcha(params.token);
  return validationCheck;
};

// Get invitation by token
export const getInvitation = async (
  params: { token: string },
  deps: { invitationLookupFn: (token: string) => Promise<InvitationLookupResult> },
): Promise<InvitationExistsResult> => {

  // Look up invitation by token
  const invitationResult = await deps.invitationLookupFn(params.token);

  // Handle database errors
  if (invitationResult.kind === 'failure') {
    // Convert DBError to InvitationNotFoundError to satisfy the railway pattern
    return failure({
      kind: 'invitation-not-found-error',
      error: new Error(`Failed to retrieve invitation: ${invitationResult.error.error.message}`),
    });
  }

  // Check if invitation exists
  const invitation = invitationResult.value;

  switch (invitation.kind) {
    case 'some':
      return success(invitation.value);
    case 'none':
      return failure({
        kind: 'invitation-not-found-error',
        error: new Error(`Invitation with token ${params.token} not found`),
      });
  }
};

// Check if invitation has expired
export const checkInvitationExpiry = (params: {
  invitation: Invitation;
  now: Date;
}): InvitationExpiryResult => {
  const isExpired = params.invitation.expires <= params.now;

  if (isExpired) {
    return failure({
      kind: 'invitation-expired-error',
      expiredAt: params.invitation.expires.toISOString(),
    });
  }

  // Invitation is valid
  return success(params.invitation);
};

// Validate email from invitation
export const validateEmail = (params: { invitation: Invitation }): InviteEmailValidationResult => {
  const email = params.invitation.email;

  // Check if email format is valid
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const isValidFormat = emailRegex.test(email);

  if (!isValidFormat) {
    return failure({
      kind: 'invalid-email-format-error',
      error: new Error(`Invalid email format: ${email}`),
    });
  }

  // Check if it's a work email (not from common personal domains)
  const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
  const domain = email.split('@')[1].toLowerCase();
  const isPersonalEmail = personalDomains.includes(domain);

  if (isPersonalEmail) {
    return failure({
      kind: 'non-work-email-error',
      error: new Error(`Personal email domains are not allowed: ${domain}`),
    });
  }

  // Email is valid
  return success(email);
};

// Validate invitation form data
export const validateInviteForm = (params: {
  request: JoinByInvitation;
  email: string;
}): InviteFormValidationResult => {
  // Create an array to collect all validation errors
  const validationErrors: Array<InviteNameValidationError | InvitePasswordValidationError> = [];

  // Validate name
  if (!params.request.name || params.request.name.trim() === '') {
    const nameError: InviteNameValidationError = {
      kind: 'name-validation-error',
      reason: 'empty',
    };
    validationErrors.push(nameError);
  }

  // Validate password
  if (!params.request.password) {
    const passwordError: InvitePasswordValidationError = {
      kind: 'password-validation-error',
      reason: 'empty',
    };
    validationErrors.push(passwordError);
  } else {
    // Check for password strength only if password is not empty
    const hasMinLength = params.request.password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(params.request.password);
    const hasLowerCase = /[a-z]/.test(params.request.password);
    const hasNumbers = /[0-9]/.test(params.request.password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(params.request.password);

    const isStrongPassword =
      hasMinLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars;

    if (!isStrongPassword) {
      const passwordError: InvitePasswordValidationError = {
        kind: 'password-validation-error',
        reason: 'weak',
      };
      validationErrors.push(passwordError);
    }
  }

  // If there are any validation errors, return them all
  if (validationErrors.length > 0) {
    return failure({
      kind: 'form-validation-error',
      innerErrors: validationErrors,
    });
  }

  // All validations passed
  return success(undefined);
};

// Check if invited user already exists
export const checkInvitedUserExists = async (
  params: { email: string },
  deps: { userLookupFn: (email: string) => Promise<InviteUserLookupResult> },
): Promise<InviteUserExistsResult> => {
  const userLookupResult = await deps.userLookupFn(params.email);

  // Handle database errors
  if (userLookupResult.kind === 'failure') {
    // Convert DBError to UserExistsError to satisfy the railway pattern
    return failure({
      kind: 'user-exists-error',
      error: new Error(`Database error: ${userLookupResult.error.error.message}`),
    });
  }

  // Check if user exists
  const user = userLookupResult.value;

  switch (user.kind) {
    case 'some':
      return failure({
        kind: 'user-exists-error',
        error: new Error(`User with email ${user.value.email} already exists`),
      });
    case 'none':
      return success(undefined);
  }
};

// Create invited user account
export const createInvitedUser = async (
  params: { request: JoinByInvitation; email: string },
  deps: { userCreateFn: (userData: UserCreateData) => Promise<InviteUserCreationResult> },
): Promise<InviteUserCreationResult> => {
  // Create user data from request
  const userData: UserCreateData = {
    name: params.request.name,
    email: params.email,
    password: params.request.password,
  };

  // Create the user
  return deps.userCreateFn(userData);
};

// Get team for invitation
export const getTeam = async (
  params: { teamSlug: string },
  deps: { teamLookupFn: (slug: string) => Promise<InviteTeamLookupResult> },
): Promise<InviteTeamExistsResult> => {
  // Look up team by slug
  const teamResult = await deps.teamLookupFn(params.teamSlug);

  // Handle database errors
  if (teamResult.kind === 'failure') {
    return failure({
      kind: 'team-not-found-error',
      error: new Error(`Database error: ${teamResult.error.error.message}`),
    });
  }

  // Check if team exists
  const team = teamResult.value;

  switch (team.kind) {
    case 'some':
      return success(team.value);
    case 'none':
      return failure({
        kind: 'team-not-found-error',
        error: new Error(`Team with slug ${params.teamSlug} not found`),
      });
  }
};

// Record metrics for invitation registration
export const recordInviteMetrics = async (
  params: { invitation: Invitation },
  deps: { recordMetricsFn: () => Promise<InviteMetricsRecordResult> },
): Promise<InviteMetricsRecordResult> => {
  // Record metrics
  return deps.recordMetricsFn();
};

// Send notifications for invitation registration
export const sendInviteNotifications = async (
  params: { invitation: Invitation },
  deps: { notifyFn: () => Promise<InviteSlackNotifyResult> },
): Promise<InviteSlackNotifyResult> => {
  // Send notifications
  return deps.notifyFn();
};

// Format final response for invitation registration
export const formatInviteResponse = (params: { user: User; team: Team }): RegistrationResult => {
  // Return success with registration data
  return success({
    user: params.user,
    team: params.team,
    confirmEmail: false, // For invitation, email is pre-verified
  });
};
