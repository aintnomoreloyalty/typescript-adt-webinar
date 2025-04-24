import type {
  InvitationLookupResult,
  InvitationCreateResult,
  InvitationCreateData,
} from '../types/domain';

/**
 * InvitationRepository - Responsible for invitation entity persistence operations
 * 
 * Following DDD principles, this repository encapsulates all data access operations
 * for the Invitation aggregate. It provides a domain-oriented interface to the
 * underlying storage system.
 */

/**
 * Find an invitation by its token
 * 
 * Used in the invitation registration flow to retrieve and validate
 * an invitation sent to a prospective user
 */
export const findInvitationByToken = async (
  params: { token: string },
  deps: { findInvitationFn: (token: string) => Promise<InvitationLookupResult> },
): Promise<InvitationLookupResult> => {
  return deps.findInvitationFn(params.token);
};

/**
 * Create a new invitation
 * 
 * Used in the invitation creation flow to generate and store
 * an invitation for a new user
 */
export const createInvitation = async (
  params: { invitationData: InvitationCreateData },
  deps: {
    createInvitationFn: (invitationData: InvitationCreateData) => Promise<InvitationCreateResult>;
  },
): Promise<InvitationCreateResult> => {
  return deps.createInvitationFn(params.invitationData);
}; 