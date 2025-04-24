import { FastifyReply, FastifyRequest } from 'fastify';
import * as invitationManagement from '../services/invitation-management';
import * as teamDb from '../db/team-db';
import * as invitationDb from '../db/invitation-db';
import * as externalServices from '../services/external-services';
import { CreateInvitation, InvitationCreationResult, Team, User } from '../types/domain';
import { isFailure } from '../types/result';
import { findUserById } from '../db/user-db';
import { checkUserExists } from '../services/self-registration';
import { Some } from '../types/option';

/**
 * Helper function to generate a random token
 */
function generateRandomToken(): string {
  return `invite-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Helper function to add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Invitation creation endpoint handler
 * Follows the API design pattern from endpoint-design.md:
 * - POST-only RPC style
 * - Result type pattern with success/failure
 * - HTTP 200 for everything with errors in the Result object
 */
export async function handleCreateInvitation(
  req: FastifyRequest,
  res: FastifyReply,
): Promise<void> {
  // Extract the invitation request from the body
  const inviteRequest = req.body as CreateInvitation;
  // super dummy auth
  inviteRequest.inviterUserId = req.headers['x-auth-user-id'] as string;

  // Process the invitation creation
  const result = await createInvitation(inviteRequest);

  // Always return HTTP 200 with the Result object
  res.status(200).send(result);
}

/**
 * Processes the invitation creation through a railway-oriented pipeline
 */
async function createInvitation(request: CreateInvitation): Promise<InvitationCreationResult> {
  // 1. Validate form data
  const formResult = invitationManagement.validateForm({ request });
  if (isFailure(formResult)) return formResult;

  // 2. Find the user who is making the invitation request
  const userInviter = await findUserById(request.inviterUserId);
  if (isFailure(userInviter)) return userInviter;

  const checkUserExistsResult = await checkUserExists({ user: userInviter.value });
  if (isFailure(checkUserExistsResult)) return checkUserExistsResult;

  // 3. Check if team exists
  const teamLookupResult = await teamDb.findTeamByOwner((userInviter.value as Some<User>).value.id);
  if (isFailure(teamLookupResult)) return teamLookupResult;

  const teamExistsResult = invitationManagement.checkTeamExists({ team: teamLookupResult.value });
  if (isFailure(teamExistsResult)) return teamExistsResult;

  // 4. Verify the requester is the team owner
  const ownershipResult = await invitationManagement.verifyTeamOwnership(
    { team: teamExistsResult.value, userId: request.inviterUserId },
    { isTeamOwnerFn: externalServices.isTeamOwner },
  );
  if (isFailure(ownershipResult)) return ownershipResult;

  // 5. Create invitation
  const invitationCreateResult = await invitationManagement.createInvitation(
    { request },
    {
      createInvitationFn: async () =>
        invitationDb.createInvitation({
          email: request.email,
          teamSlug: (teamLookupResult.value as Some<Team>).value.slug,
          inviterUserId: request.inviterUserId,
          token: generateRandomToken(),
          expiresAt: addDays(new Date(), 7),
        }),
    },
  );
  if (isFailure(invitationCreateResult)) return invitationCreateResult;

  // 6. Send invitation email
  const emailResult = await invitationManagement.sendInvitationEmail(
    { invitation: invitationCreateResult.value },
    {
      emailSendFn: async () =>
        externalServices.sendInvitationEmail(request.email, invitationCreateResult.value.token),
    },
  );
  if (isFailure(emailResult)) return emailResult;

  // 7. Format and return response
  return invitationManagement.formatResponse({
    invitation: invitationCreateResult.value,
  });
}
