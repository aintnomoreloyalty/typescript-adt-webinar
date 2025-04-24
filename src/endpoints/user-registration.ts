import * as selfRegistration from '../services/self-registration';
import * as invitationRegistration from '../services/invitation-registration';
import { validateRecaptcha } from '../utils/validation-service';
import { findUserByEmail, createUser } from '../utils/user-repository';
import { findTeamBySlug, createTeam } from '../utils/team-repository';
import { findInvitationByToken } from '../utils/invitation-repository';
import { recordMetrics } from '../utils/metrics-service';
import { sendSlackNotification } from '../utils/notification-service';
import { isFailure } from '../types/result';
import type {
  JoinSelf,
  JoinByInvitation,
  RegistrationResult,
  UserCreateData,
  TeamCreateData,
} from '../types/domain';
import * as userDb from '../db/user-db';
import * as teamDb from '../db/team-db';
import * as invitationDb from '../db/invitation-db';
import * as externalServices from '../services/external-services';
import { FastifyReply, FastifyRequest } from 'fastify';

/**
 * User registration endpoint handler
 * Follows the API design pattern from endpoint-design.md:
 * - POST-only RPC style
 * - Result type pattern with success/failure
 * - HTTP 200 for everything with errors in the Result object
 */
export async function handleUserRegistration(
  req: FastifyRequest,
  res: FastifyReply,
): Promise<void> {
  // Extract the registration request from the body
  const joinRequest = req.body as JoinSelf | JoinByInvitation;

  // Determine the registration type and route to the correct handler using pattern matching
  const result: RegistrationResult = await (() => {
    switch (joinRequest.kind) {
      case 'self':
        return handleSelfRegistration(joinRequest as JoinSelf);
      case 'invitation':
        return handleInvitationRegistration(joinRequest as JoinByInvitation);
    }
  })();

  // Always return HTTP 200 with the Result object
  res.status(200).send(result);
}

/**
 * Handles the self-registration flow
 */
async function handleSelfRegistration(request: JoinSelf): Promise<RegistrationResult> {
  // 1. Validate recaptcha token - Using validation service
  const recaptchaResult = await validateRecaptcha(
    { token: request.recaptchaToken },
    { validateRecaptcha: externalServices.validateRecaptcha },
  );
  if (isFailure(recaptchaResult)) return recaptchaResult;

  // 2. Validate form data
  const formResult = selfRegistration.validateForm({ request });
  if (isFailure(formResult)) return formResult;

  // 3. Check if user already exists - Using user repository
  const userLookupResult = await findUserByEmail(
    { email: request.email },
    { findUserByEmailFn: userDb.findUserByEmail },
  );
  if (isFailure(userLookupResult)) return userLookupResult;

  const userExistsResult = await selfRegistration.checkUserExists({ user: userLookupResult.value });
  if (isFailure(userExistsResult)) return userExistsResult;

  // 4. Check if team name is unique - Using team repository
  const teamLookupResult = await findTeamBySlug(
    { slug: request.team },
    { findTeamBySlugFn: teamDb.findTeamBySlug },
  );
  if (isFailure(teamLookupResult)) return teamLookupResult;

  const teamUniqueResult = await selfRegistration.checkTeamUnique({ team: teamLookupResult.value });
  if (isFailure(teamUniqueResult)) return teamUniqueResult;

  // 5. Create user - Using user repository
  const userData: UserCreateData = {
    name: request.name,
    email: request.email,
    password: request.password,
  };

  const userCreateResult = await createUser({ userData }, { createUserFn: userDb.createUser });
  if (isFailure(userCreateResult)) return userCreateResult;

  // 6. Create team - Using team repository
  const teamData: TeamCreateData = {
    name: request.team,
    slug: request.team.toLowerCase().replace(/\s+/g, '-'),
    ownerId: userCreateResult.value.id,
  };

  const teamCreateResult = await createTeam({ teamData }, { createTeamFn: teamDb.createTeam });
  if (isFailure(teamCreateResult)) return teamCreateResult;

  // 7. Send verification email
  const emailResult = await selfRegistration.sendVerificationEmail(
    { request },
    { emailSendFn: async () => externalServices.sendVerificationEmail(request.email) },
  );
  if (isFailure(emailResult)) return emailResult;

  // 8. Record metrics - Using metrics service
  const metricsResult = await recordMetrics(
    {
      eventType: 'user_registered',
      metadata: { type: 'self_registration' },
    },
    {
      recordMetricsFn: externalServices.recordMetrics,
    },
  );
  if (isFailure(metricsResult)) return metricsResult;

  // 9. Send notifications - Using notification service
  const notifyResult = await sendSlackNotification(
    {
      channel: '#new-signups',
      message: 'New user registered via self-registration',
    },
    {
      notifyFn: externalServices.sendSlackNotification,
    },
  );
  if (isFailure(notifyResult)) return notifyResult;

  // 10. Format and return final response
  return selfRegistration.formatResponse({
    user: userCreateResult.value,
    team: teamCreateResult.value,
  });
}

/**
 * Handles the invitation-based registration flow
 */
async function handleInvitationRegistration(
  request: JoinByInvitation,
): Promise<RegistrationResult> {
  // 1. Validate recaptcha token - Using validation service
  const recaptchaResult = await validateRecaptcha(
    { token: request.recaptchaToken },
    { validateRecaptcha: externalServices.validateRecaptcha },
  );
  if (isFailure(recaptchaResult)) return recaptchaResult;

  // 2. Get invitation by token - Using invitation repository
  const invitationLookupResult = await findInvitationByToken(
    { token: request.inviteToken },
    { findInvitationFn: invitationDb.findInvitationByToken },
  );
  if (isFailure(invitationLookupResult)) return invitationLookupResult;

  // Process the invitation
  const invitationResult = await invitationRegistration.getInvitation(
    { token: request.inviteToken },
    { invitationLookupFn: async () => invitationLookupResult },
  );
  if (isFailure(invitationResult)) return invitationResult;

  // 3. Check if invitation has expired
  const invitationExpiryResult = await invitationRegistration.checkInvitationExpiry({
    invitation: invitationResult.value,
    now: new Date(),
  });
  if (invitationExpiryResult.kind === 'failure')
    return invitationExpiryResult as RegistrationResult;

  // 4. Validate email from invitation
  const emailValidationResult = invitationRegistration.validateEmail({
    invitation: invitationExpiryResult.value,
  });
  if (isFailure(emailValidationResult)) return emailValidationResult;

  // 5. Validate invitation form data
  const formValidationResult = invitationRegistration.validateInviteForm({
    request,
    email: invitationExpiryResult.value.email,
  });
  if (isFailure(formValidationResult)) return formValidationResult;

  // 6. Check if invited user already exists - Using user repository
  const userLookupResult = await findUserByEmail(
    { email: invitationExpiryResult.value.email },
    { findUserByEmailFn: userDb.findUserByEmail },
  );
  if (isFailure(userLookupResult)) return userLookupResult;

  // Process user existence check
  const userExistsResult = await invitationRegistration.checkInvitedUserExists(
    {
      email: invitationExpiryResult.value.email,
    },
    {
      userLookupFn: async () => userLookupResult,
    },
  );
  if (isFailure(userExistsResult)) return userExistsResult;

  // 7. Create invited user account - Using user repository
  const userData: UserCreateData = {
    name: request.name,
    email: invitationExpiryResult.value.email,
    password: request.password,
  };

  const userCreateResult = await createUser({ userData }, { createUserFn: userDb.createUser });
  if (isFailure(userCreateResult)) return userCreateResult;

  // Process user creation result
  const userCreationResult = await invitationRegistration.createInvitedUser(
    { request, email: invitationExpiryResult.value.email },
    { userCreateFn: async () => userCreateResult },
  );
  if (isFailure(userCreationResult)) return userCreationResult;

  // 8. Get team for invitation - Using team repository
  const teamLookupResult = await findTeamBySlug(
    { slug: invitationExpiryResult.value.team.slug },
    { findTeamBySlugFn: teamDb.findTeamBySlug },
  );
  if (isFailure(teamLookupResult)) return teamLookupResult;

  // Process team lookup result
  const teamResult = await invitationRegistration.getTeam(
    { teamSlug: invitationExpiryResult.value.team.slug },
    { teamLookupFn: async () => teamLookupResult },
  );
  if (isFailure(teamResult)) return teamResult;

  // 9. Record metrics for invitation registration - Using metrics service
  const metricsResult = await recordMetrics(
    {
      eventType: 'user_registered',
      metadata: { type: 'invitation_registration' },
    },
    {
      recordMetricsFn: externalServices.recordMetrics,
    },
  );
  if (isFailure(metricsResult)) return metricsResult;

  // 10. Send notifications for invitation registration - Using notification service
  const notificationResult = await sendSlackNotification(
    {
      channel: '#new-signups',
      message: 'New user registered via invitation',
    },
    {
      notifyFn: externalServices.sendSlackNotification,
    },
  );
  if (isFailure(notificationResult)) return notificationResult;

  // 11. Format and return final response
  return invitationRegistration.formatInviteResponse({
    user: userCreateResult.value,
    team: teamResult.value,
  });
}
