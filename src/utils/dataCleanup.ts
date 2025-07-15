import { TeamData } from "../types";

// Define the minimal interface we need for cleanup
interface StateWithTeams {
  teams?: TeamData[];
}

/**
 * Clean up corrupted team data from the state
 * This function removes incomplete team entries that are missing required fields
 */
export const cleanupTeamData = <T extends StateWithTeams>(state: T): T => {
  if (!state.teams) {
    return state;
  }

  const validTeams = state.teams.filter((team): team is TeamData => {
    // Check if team has all required fields
    const isValid =
      team &&
      typeof team === "object" &&
      typeof team.id === "string" &&
      team.id.length > 0 &&
      typeof team.month === "number" &&
      typeof team.year === "number" &&
      team.teamName !== undefined &&
      team.currentCostCenter !== undefined &&
      typeof team.headcount === "number" &&
      typeof team.cost === "number";

    if (!isValid) {
      console.warn("Removing invalid team data:", team);
    }

    return isValid;
  });

  const removedCount = state.teams.length - validTeams.length;

  if (removedCount > 0) {
    console.log(`Cleaned up ${removedCount} corrupted team entries`);
  }

  return {
    ...state,
    teams: validTeams,
  };
};

/**
 * Get statistics about data corruption in the current state
 */
export const getDataCorruptionStats = (state: StateWithTeams) => {
  const stats = {
    teams: {
      total: state.teams?.length || 0,
      valid: 0,
      invalid: 0,
      invalidEntries: [] as any[],
    },
  };

  if (state.teams) {
    state.teams.forEach((team: any) => {
      const isValid =
        team &&
        typeof team === "object" &&
        typeof team.id === "string" &&
        team.id.length > 0 &&
        typeof team.month === "number" &&
        typeof team.year === "number" &&
        team.teamName !== undefined &&
        team.currentCostCenter !== undefined &&
        typeof team.headcount === "number" &&
        typeof team.cost === "number";

      if (isValid) {
        stats.teams.valid++;
      } else {
        stats.teams.invalid++;
        stats.teams.invalidEntries.push(team);
      }
    });
  }

  return stats;
};
