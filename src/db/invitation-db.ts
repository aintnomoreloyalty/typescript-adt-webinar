import { success, failure } from '../types/result';
import { some, none } from '../types/option';
import {
  Invitation,
  InvitationLookupResult,
  Team,
  InvitationCreateData,
  InvitationCreateResult,
} from '../types/domain';

// In-memory storage for invitations
const invitations: Record<string, Invitation> = {};

/**
 * Simulates looking up an invitation by token in the database
 */
export async function findInvitationByToken(token: string): Promise<InvitationLookupResult> {
  try {
    // Simulate some processing time
    // In a real implementation, this would query a database
    await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay to simulate DB access

    const foundInvitation = Object.values(invitations).find(
      (invitation) => invitation.token === token,
    );

    return success(foundInvitation ? some(foundInvitation) : none());
  } catch (error) {
    return failure({
      kind: 'db-error',
      error:
        error instanceof Error
          ? error
          : new Error(`Unknown error during invitation lookup: ${String(error)}`),
    });
  }
}

/**
 * Simulates looking up an invitation by email and team
 */
export async function findInvitationByEmail(
  email: string,
  teamSlug: string,
): Promise<InvitationLookupResult> {
  try {
    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay to simulate DB access

    const foundInvitation = Object.values(invitations).find(
      (invitation) => invitation.email === email && invitation.team.slug === teamSlug,
    );

    return success(foundInvitation ? some(foundInvitation) : none());
  } catch (error) {
    return failure({
      kind: 'db-error',
      error:
        error instanceof Error
          ? error
          : new Error(`Unknown error during invitation lookup: ${String(error)}`),
    });
  }
}

/**
 * Simulates creating a new invitation in the database using the CreateInvitationData type
 */
export async function createInvitation(
  data: InvitationCreateData,
): Promise<InvitationCreateResult> {
  try {
    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay to simulate DB access

    // Look up the team (in a real DB, this would be a foreign key reference)
    const team: Team = {
      id: `team-${Math.random().toString(36).substring(2, 9)}`,
      name: data.teamSlug, // For simplicity, using the slug as the name
      slug: data.teamSlug,
      ownerId: data.inviterUserId,
    };

    // Create the invitation
    const newInvitation: Invitation = {
      token: data.token,
      expires: data.expiresAt,
      team,
      email: data.email,
      sentViaEmail: false,
    };

    // Store in our "database"
    invitations[data.token] = newInvitation;

    return success(newInvitation);
  } catch (error) {
    return failure({
      kind: 'db-error',
      error:
        error instanceof Error
          ? error
          : new Error(`Unknown error during invitation creation: ${String(error)}`),
    });
  }
}

/**
 * Simulates marking an invitation as sent via email
 */
export async function markInvitationSent(token: string): Promise<InvitationLookupResult> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay to simulate DB access

    const invitation = invitations[token];

    if (!invitation) {
      return success(none());
    }

    // Update the invitation
    invitation.sentViaEmail = true;

    return success(some(invitation));
  } catch (error) {
    return failure({
      kind: 'db-error',
      error:
        error instanceof Error
          ? error
          : new Error(`Unknown error during invitation update: ${String(error)}`),
    });
  }
}

/**
 * For testing: clear all invitations
 */
export function clearAllInvitations(): void {
  Object.keys(invitations).forEach((key) => {
    delete invitations[key];
  });
}

/**
 * For testing: add test invitation
 */
export function addTestInvitation(invitation: Invitation): void {
  invitations[invitation.token] = invitation;
}

/**
 * For testing: create an expired invitation
 */
export async function createExpiredInvitation(
  email: string,
  team: Team,
): Promise<InvitationLookupResult> {
  try {
    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay to simulate DB access

    // Generate a random token
    const token = `expired-${Math.random().toString(36).substring(2, 15)}`;

    // Set expiration date to past
    const expires = new Date();
    expires.setDate(expires.getDate() - 1); // Expired yesterday

    // Create the invitation
    const expiredInvitation: Invitation = {
      token,
      expires,
      team,
      email,
      sentViaEmail: true,
    };

    // Store in our "database"
    invitations[token] = expiredInvitation;

    return success(some(expiredInvitation));
  } catch (error) {
    return failure({
      kind: 'db-error',
      error:
        error instanceof Error
          ? error
          : new Error(`Unknown error during expired invitation creation: ${String(error)}`),
    });
  }
}
