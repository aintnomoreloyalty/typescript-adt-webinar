import { Result, success, failure } from '../types/result';
import { Option } from '../types/option';
import type {
  JoinSelf,
  User,
  Team,
  RecaptchaValidationResult,
  FormValidationResult,
  UserLookupResult,
  UserExistsResult,
  TeamSlugLookupResult,
  TeamUniqueResult,
  UserCreationResult,
  TeamCreationResult,
  EmailVerificationResult,
  MetricsRecordResult,
  SlackNotifyResult,
  RegistrationResult,
  EmailValidationError,
  NameValidationError,
  PasswordValidationError,
  FormValidationError,
  UserExistsError,
  TeamExistsError,
  UserCreateData,
  TeamCreateData,
} from '../types/domain';

// Helper function to create a slug from a team name
const createSlug = (teamName: string): string => {
  return teamName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Validate recaptcha token
export const validateRecaptcha = async (
  params: { token: string },
  deps: { validateRecaptcha: (token: string) => Promise<RecaptchaValidationResult> },
): Promise<RecaptchaValidationResult> => {
  // In a real implementation, we would validate the token with the recaptcha service
  // For this example, we'll assume all tokens are valid
  if (params.token.trim() === '') {
    return failure({
      kind: 'recaptcha-error',
      reason: 'not-provided',
    });
  }

  const validationCheck = await deps.validateRecaptcha(params.token);

  return validationCheck;
};

// Validate user form data
export const validateForm = (params: { request: JoinSelf }): FormValidationResult => {
  // Create an array to collect all validation errors
  const validationErrors: Array<
    EmailValidationError | NameValidationError | PasswordValidationError
  > = [];

  // Validate email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const isValidEmailFormat = emailRegex.test(params.request.email);

  if (!isValidEmailFormat) {
    const emailError: EmailValidationError = {
      kind: 'email-validation-error',
      reason: 'invalid-format',
    };
    validationErrors.push(emailError);
  } else {
    // Only check for personal domain if the format is valid
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
    const domain = params.request.email.split('@')[1].toLowerCase();
    const isPersonalEmail = personalDomains.includes(domain);

    if (isPersonalEmail) {
      const emailError: EmailValidationError = {
        kind: 'email-validation-error',
        reason: 'not-work-email',
      };
      validationErrors.push(emailError);
    }
  }

  // Validate name
  if (!params.request.name || params.request.name.length < 2) {
    const nameError: NameValidationError = {
      kind: 'name-validation-error',
      reason: 'empty',
    };
    validationErrors.push(nameError);
  }

  // Validate password
  if (!params.request.password) {
    const passwordError: PasswordValidationError = {
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
      const passwordError: PasswordValidationError = {
        kind: 'password-validation-error',
        reason: 'weak',
      };
      validationErrors.push(passwordError);
    }
  }

  // Validate team name
  if (!params.request.team || params.request.team.length < 2) {
    const nameError: NameValidationError = {
      kind: 'name-validation-error',
      reason: 'empty',
    };
    validationErrors.push(nameError);
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

// Check if user already exists
export const checkUserExists = async (params: {
  user: Option<User>;
}): Promise<UserExistsResult> => {
  switch (params.user.kind) {
    case 'some':
      return failure({
        kind: 'user-exists-error',
        email: params.user.value.email,
      });
    case 'none':
      return success(undefined);
  }
};

// Check if team slug is unique
export const checkTeamUnique = async (params: {
  team: Option<Team>;
}): Promise<TeamUniqueResult> => {
  switch (params.team.kind) {
    case 'some':
      return failure({
        kind: 'team-exists-error',
        name: params.team.value.name,
      });
    case 'none':
      return success(undefined);
  }
};

// Create user account
export const createUser = async (
  params: {request: JoinSelf},
  deps: {userCreateFn: (userData: UserCreateData) => Promise<UserCreationResult>},
): Promise<UserCreationResult> => {
  // Create user data from request
  const userData: UserCreateData = {
    name: params.request.name,
    email: params.request.email,
    password: params.request.password,
  };

  // Create the user
  return deps.userCreateFn(userData);
};

// Create team
export const createTeam = async (
  params: { user: User; request: JoinSelf },
  deps: {teamCreateFn: (teamData: TeamCreateData) => Promise<TeamCreationResult>},
): Promise<TeamCreationResult> => {
  // Get user ID from previous step
  const userId = params.user.id;

  // Create team data from request
  const teamData: TeamCreateData = {
    name: params.request.team,
    slug: createSlug(params.request.team),
    ownerId: userId,
  };

  // Create the team
  return deps.teamCreateFn(teamData);
};

// Send verification email
export const sendVerificationEmail = async (
  params: { request: JoinSelf },
  deps: { emailSendFn: (email: string) => Promise<EmailVerificationResult> },
): Promise<EmailVerificationResult> => {
  // Send verification email
  return deps.emailSendFn(params.request.email);
};

// Record metrics
export const recordMetrics = async (
  params: { request: JoinSelf },
  deps: { recordMetricsFn: () => Promise<MetricsRecordResult> },
): Promise<MetricsRecordResult> => {
  // Record metrics
  return deps.recordMetricsFn();
};

// Send notifications
export const sendNotifications = async (
  params: { request: JoinSelf },
  deps: { notifyFn: () => Promise<SlackNotifyResult> },
): Promise<SlackNotifyResult> => {
  // Send notifications
  return deps.notifyFn();
};

// Format final response
export const formatResponse = async (params: {
  user: User;
  team: Team;
}): Promise<RegistrationResult> => {
  // Return success with registration data
  return success({
    user: params.user,
    team: params.team,
    confirmEmail: true, // For self-registration, email needs confirmation
  });
};
