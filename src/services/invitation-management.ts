import {
  CreateInvitation,
  FormValidationError,
  InvitationCreateResult,
  InvitationCreationFormValidationResult,
  InvitationCreationResult,
  InvitationEmailResult,
  InvitationCreationMetricsResult,
  InvitationResponse,
  Team,
  TeamExistenceResult,
  TeamOwnershipResult,
  TeamNotFoundError,
  TeamOwnerAuthError,
  EmailSendError,
  MetricsError,
  Invitation,
} from '../types/domain';
import { none, Option, some } from '../types/option';
import { success, failure } from '../types/result';

/**
 * Validates the invitation form data
 */
export function validateForm(params: {
  request: CreateInvitation;
}): InvitationCreationFormValidationResult {
  const { request } = params;

  const validationRules = [validateEmail(request.email)];

  const innerErrors = validationRules
    .filter((result) => result.kind === 'some')
    .map((result) => result.value);

  if (innerErrors.length > 0) {
    return failure({
      kind: 'form-validation-error',
      innerErrors,
    } as FormValidationError);
  }

  return success(undefined);
}

function validateEmail(email: string): Option<{ kind: string; reason: string }> {
  if (!email) {
    return some({
      kind: 'email-validation-error',
      reason: 'invalid-format',
    });
  }

  if (!isValidEmailFormat(email)) {
    return some({
      kind: 'email-validation-error',
      reason: 'invalid-format',
    });
  }

  if (isPersonalEmail(email)) {
    return some({
      kind: 'email-validation-error',
      reason: 'not-work-email',
    });
  }

  return none();
}

function isValidEmailFormat(email: string): boolean {
  return email.includes('@') && email.includes('.') && email.split('@')[1].includes('.');
}

function isPersonalEmail(email: string): boolean {
  const personalDomains = ['@gmail.com', '@yahoo.com', '@hotmail.com'];
  return personalDomains.some((domain) => email.endsWith(domain));
}

/**
 * Verifies the team exists
 */
export function checkTeamExists(params: { team: Option<Team> }): TeamExistenceResult {
  const { team } = params;

  switch (team.kind) {
    case 'some':
      return success(team.value);
    case 'none':
      return failure({
        kind: 'team-not-found-error',
      } as TeamNotFoundError);
  }
}

/**
 * Verifies the user making the request is the team owner
 */
export function verifyTeamOwnership(
  params: { team: Team; userId: string },
  deps: { isTeamOwnerFn: (teamId: string, userId: string) => Promise<boolean> },
): Promise<TeamOwnershipResult> {
  const { team, userId } = params;

  return deps
    .isTeamOwnerFn(team.id, userId)
    .then((isOwner) => {
      if (!isOwner) {
        return failure({
          kind: 'team-owner-auth-error',
          details: 'Only team owners can create invitations',
        } as TeamOwnerAuthError);
      }
      return success(undefined);
    })
    .catch((error) => {
      return failure({
        kind: 'team-owner-auth-error',
        details: `Error checking team ownership: ${error.message}`,
      } as TeamOwnerAuthError);
    });
}

/**
 * Creates an invitation
 */
export async function createInvitation(
  params: { request: CreateInvitation },
  deps: { createInvitationFn: () => Promise<InvitationCreateResult> },
): Promise<InvitationCreateResult> {
  try {
    return await deps.createInvitationFn();
  } catch (error) {
    return failure({
      kind: 'db-error',
      error: error instanceof Error ? error : new Error(`Unknown error: ${String(error)}`),
    });
  }
}

/**
 * Sends the invitation email
 */
export async function sendInvitationEmail(
  params: { invitation: Invitation },
  deps: { emailSendFn: () => Promise<boolean> },
): Promise<InvitationEmailResult> {
  try {
    const sent = await deps.emailSendFn();

    if (!sent) {
      return failure({
        kind: 'email-send-error',
        error: new Error('Failed to send invitation email'),
      });
    }

    return success(undefined);
  } catch (error) {
    return failure({
      kind: 'email-send-error',
      error: error instanceof Error ? error : new Error(`Unknown email error: ${String(error)}`),
    });
  }
}

/**
 * Formats the final response
 */
export function formatResponse(params: { invitation: Invitation }): InvitationCreationResult {
  const { invitation } = params;

  return success({
    success: true,
    invitation,
  } as InvitationResponse);
}
