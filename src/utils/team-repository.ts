import type {
  TeamSlugLookupResult,
  TeamCreationResult,
  TeamCreateData,
} from '../types/domain';

/**
 * TeamRepository - Responsible for team entity persistence operations
 * 
 * Following DDD principles, this repository encapsulates all data access operations
 * for the Team aggregate root. It provides a domain-oriented interface to the
 * underlying storage system.
 */

/**
 * Find a team by its slug
 * 
 * Used in both self-registration flow to check if a team slug is available,
 * and in invitation flow to verify the team exists
 */
export const findTeamBySlug = async (
  params: { slug: string },
  deps: { findTeamBySlugFn: (slug: string) => Promise<TeamSlugLookupResult> },
): Promise<TeamSlugLookupResult> => {
  return deps.findTeamBySlugFn(params.slug);
};

/**
 * Find a team by its ID
 * 
 * Used primarily in the invitation flow to locate a team when only the ID is known
 */
export const findTeamById = async (
  params: { teamId: string },
  deps: { findTeamFn: (teamId: string) => Promise<TeamSlugLookupResult> },
): Promise<TeamSlugLookupResult> => {
  return deps.findTeamFn(params.teamId);
};

/**
 * Create a new team
 * 
 * Used in self-registration flow to create a team after the user account
 * has been successfully created
 */
export const createTeam = async (
  params: { teamData: TeamCreateData },
  deps: { createTeamFn: (teamData: TeamCreateData) => Promise<TeamCreationResult> },
): Promise<TeamCreationResult> => {
  return deps.createTeamFn(params.teamData);
}; 