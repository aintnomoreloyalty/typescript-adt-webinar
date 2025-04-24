import { Option } from './option';
import { Result } from './result';

// Common error types
export type DBError = { kind: 'db-error'; error: Error };
export type ValidationError = { kind: 'validation-error'; details: string };
export type ServerError = { kind: 'server-error'; error: Error };

// Self-Registration Railway Error Types
export type RecaptchaError = { kind: 'recaptcha-error' };

export type EmailValidationError = {
  kind: 'email-validation-error';
  reason: 'invalid-format' | 'not-work-email';
};

export type NameValidationError = {
  kind: 'name-validation-error';
  reason: 'empty';
};

export type PasswordValidationError = {
  kind: 'password-validation-error';
  reason: 'empty' | 'weak';
};

export type FormValidationError = {
  kind: 'form-validation-error';
  innerErrors: Array<EmailValidationError | NameValidationError | PasswordValidationError>;
};

export type UserExistsError = { kind: 'user-exists-error' };
export type TeamExistsError = { kind: 'team-exists-error' };
export type EmailSendError = { kind: 'email-send-error'; error: Error };
export type MetricsError = { kind: 'metrics-error'; error: Error };
export type NotificationError = { kind: 'notification-error'; error: Error };

export type SelfRegistrationError =
  | RecaptchaError
  | FormValidationError
  | UserExistsError
  | TeamExistsError
  | EmailSendError
  | MetricsError
  | NotificationError
  | DBError;

// Invitation Railway Error Types
export type InviteRecaptchaError = RecaptchaError;
export type InvitationNotFoundError = { kind: 'invitation-not-found-error' };
export type InvitationExpiredError = { kind: 'invitation-expired-error'; expiredAt: string };
export type InvalidEmailFormatError = { kind: 'invalid-email-format-error' };
export type NonWorkEmailError = { kind: 'non-work-email-error' };
export type InviteNameValidationError = NameValidationError;
export type InvitePasswordValidationError = PasswordValidationError;
export type InviteFormValidationError = {
  kind: 'form-validation-error';
  innerErrors: Array<InviteNameValidationError | InvitePasswordValidationError>;
};
export type InviteUserExistsError = UserExistsError;
export type TeamNotFoundError = { kind: 'team-not-found-error' };
export type TeamOwnerAuthError = { kind: 'team-owner-auth-error'; details: string };
export type InviteMetricsError = MetricsError;
export type InviteNotificationError = NotificationError;

export type InvitationError =
  | InviteRecaptchaError
  | InvitationNotFoundError
  | InvitationExpiredError
  | InvalidEmailFormatError
  | NonWorkEmailError
  | InviteFormValidationError
  | InviteUserExistsError
  | TeamNotFoundError
  | TeamOwnerAuthError
  | InviteMetricsError
  | InviteNotificationError
  | DBError;

// Combined Registration Error Type
export type RegistrationError = SelfRegistrationError | InvitationError;

// Self-Registration Result Types
export type RecaptchaValidationResult = Result<void, RecaptchaError>;
export type FormValidationResult = Result<void, FormValidationError>;
export type UserLookupResult = Result<Option<User>, DBError>;
export type UserExistsResult = Result<void, UserExistsError>;
export type TeamSlugLookupResult = Result<Option<Team>, DBError>;
export type TeamUniqueResult = Result<void, TeamExistsError>;
export type UserCreationResult = Result<User, DBError>;
export type TeamCreationResult = Result<Team, DBError>;
export type EmailVerificationResult = Result<void, EmailSendError>;
export type MetricsRecordResult = Result<void, MetricsError>;
export type SlackNotifyResult = Result<void, NotificationError>;

// Invitation Railway Result Types
export type InviteRecaptchaValidationResult = Result<void, InviteRecaptchaError>;
export type InvitationLookupResult = Result<Option<Invitation>, DBError>;
export type InvitationExistsResult = Result<Invitation, InvitationNotFoundError>;
export type InvitationExpiryResult = Result<Invitation, InvitationExpiredError>;
export type InviteEmailValidationResult = Result<
  string,
  InvalidEmailFormatError | NonWorkEmailError
>;
export type InviteFormValidationResult = Result<void, InviteFormValidationError>;
export type InviteUserLookupResult = Result<Option<User>, DBError>;
export type InviteUserExistsResult = Result<void, InviteUserExistsError>;
export type InviteUserCreationResult = Result<User, DBError>;
export type InviteTeamLookupResult = Result<Option<Team>, DBError>;
export type InviteTeamExistsResult = Result<Team, TeamNotFoundError>;
export type InviteMetricsRecordResult = Result<void, InviteMetricsError>;
export type InviteSlackNotifyResult = Result<void, InviteNotificationError>;

// Domain Types - User Registration
export type User = {
  id: string;
  name: string;
  email: string;
};

export type Team = {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
};

export type Invitation = {
  token: string;
  expires: Date;
  team: Team;
  email: string;
  sentViaEmail: boolean;
};

// Registration Request Types
export type JoinSelf = {
  kind: 'self';
  name: string;
  email: string;
  password: string;
  team: string;
  recaptchaToken: string;
};

export type JoinByInvitation = {
  kind: 'invitation';
  name: string;
  password: string;
  inviteToken: string;
  recaptchaToken: string;
};

// Invitation Creation Request Type
export type CreateInvitation = {
  kind: 'create_invitation';
  email: string;
  inviterUserId: string;
};

export type RegistrationRequest = JoinSelf | JoinByInvitation;
export type RegistrationResult = Result<RegistrationData, RegistrationError>;

// Invitation Creation Result Types
export type InvitationCreationFormValidationResult = Result<void, FormValidationError>;
export type TeamExistenceResult = Result<Team, TeamNotFoundError>;
export type TeamOwnershipResult = Result<void, TeamOwnerAuthError>;
export type InvitationCreateResult = Result<Invitation, DBError>;
export type InvitationEmailResult = Result<void, EmailSendError>;
export type InvitationCreationMetricsResult = Result<void, MetricsError>;
export type InvitationCreationResult = Result<InvitationResponse, RegistrationError>;

// Invitation Creation Response
export type InvitationResponse = {
  success: boolean;
  invitation: Invitation;
};

// Data Types for Creating New Records
export type UserCreateData = {
  name: string;
  email: string;
  password: string;
};

export type TeamCreateData = {
  name: string;
  slug: string;
  ownerId: string;
};

export type InvitationCreateData = {
  email: string;
  teamSlug: string;
  inviterUserId: string;
  token: string;
  expiresAt: Date;
};

// Result export Type for Registration
export type RegistrationData = {
  user: User;
  team?: Team;
  confirmEmail: boolean;
};
