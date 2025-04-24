import { success, failure } from '../types/result';
import { some, none } from '../types/option';
import { Team, TeamCreateData, TeamSlugLookupResult, TeamCreationResult } from '../types/domain';

// In-memory storage for teams
const teams: Record<string, Team> = {};

/**
 * Simulates looking up a team by slug in the database
 */
export async function findTeamBySlug(slug: string): Promise<TeamSlugLookupResult> {
  try {
    // Simulate some processing time
    // In a real implementation, this would query a database
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay to simulate DB access
    
    const foundTeam = Object.values(teams).find((team) => team.slug === slug);
    
    return success(foundTeam ? some(foundTeam) : none());
  } catch (error) {
    return failure({
      kind: 'db-error',
      error: error instanceof Error
        ? error
        : new Error(`Unknown error during team lookup: ${String(error)}`),
    });
  }
}

/**
 * Simulates creating a new team in the database
 */
export async function createTeam(teamData: TeamCreateData): Promise<TeamCreationResult> {
  try {
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay to simulate DB access
    
    // Check if team with this slug already exists
    const existingTeam = Object.values(teams).find((team) => team.slug === teamData.slug);
    if (existingTeam) {
      return failure({
        kind: 'db-error',
        error: new Error(`Team with slug ${teamData.slug} already exists`),
      });
    }

    // Create a new team with random ID
    const newTeam: Team = {
      id: `team-${Math.random().toString(36).substring(2, 9)}`,
      name: teamData.name,
      slug: teamData.slug,
      ownerId: teamData.ownerId,
    };

    // Store in our "database"
    teams[newTeam.id] = newTeam;

    return success(newTeam);
  } catch (error) {
    return failure({
      kind: 'db-error',
      error: error instanceof Error
        ? error
        : new Error(`Unknown error during team creation: ${String(error)}`),
    });
  }
}

/**
 * For testing: clear all teams
 */
export function clearAllTeams(): void {
  Object.keys(teams).forEach((key) => {
    delete teams[key];
  });
}

/**
 * For testing: add test team
 */
export function addTestTeam(team: Team): void {
  teams[team.id] = team;
}

/**
 * Simulates looking up a team by its owner ID
 */
export async function findTeamByOwner(id: string): Promise<TeamSlugLookupResult> {
  try {
    // Simulate some processing time
    // In a real implementation, this would query a database
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay to simulate DB access
    
    const foundTeam = Object.values(teams).find((team) => team.ownerId === id);

    return success(foundTeam ? some(foundTeam) : none());
  } catch (error) {
    return failure({
      kind: 'db-error',
      error: error instanceof Error
        ? error
        : new Error(`Unknown error during team lookup: ${String(error)}`),
    });
  }
}