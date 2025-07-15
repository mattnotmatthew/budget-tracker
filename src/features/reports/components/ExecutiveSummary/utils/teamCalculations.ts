import { TeamData } from "../../../../../types";

// Interfaces for team metrics
export interface TeamMetrics {
  totalTeams: number;
  totalHeadcount: number;
  totalCost: number;
  averageCostPerHead: number;
  costCenterGroups: CostCenterGroup[];
}

export interface CostCenterGroup {
  costCenter: string;
  teams: TeamData[];
  totalHeadcount: number;
  totalCost: number;
  averageCostPerHead: number;
}

// Calculate overall team metrics
export const getTeamMetrics = (teams: TeamData[]): TeamMetrics => {
  const totalTeams = teams.length;
  const totalHeadcount = teams.reduce((sum, team) => sum + team.headcount, 0);
  const totalCost = teams.reduce((sum, team) => sum + team.cost, 0);
  const averageCostPerHead =
    totalHeadcount > 0 ? totalCost / totalHeadcount : 0;

  const costCenterGroups = groupTeamsByCostCenter(teams);

  return {
    totalTeams,
    totalHeadcount,
    totalCost,
    averageCostPerHead,
    costCenterGroups,
  };
};

// Group teams by cost center
export const groupTeamsByCostCenter = (
  teams: TeamData[]
): CostCenterGroup[] => {
  // Group teams by cost center
  const groupedMap = teams.reduce((acc, team) => {
    const costCenter = team.currentCostCenter || "Unassigned";
    if (!acc[costCenter]) {
      acc[costCenter] = [];
    }
    acc[costCenter].push(team);
    return acc;
  }, {} as Record<string, TeamData[]>);

  // Convert to array and calculate totals for each group
  const groups: CostCenterGroup[] = Object.entries(groupedMap).map(
    ([costCenter, teams]) => {
      const totalHeadcount = teams.reduce(
        (sum, team) => sum + team.headcount,
        0
      );
      const totalCost = teams.reduce((sum, team) => sum + team.cost, 0);
      const averageCostPerHead =
        totalHeadcount > 0 ? totalCost / totalHeadcount : 0;

      // Sort teams by total cost descending within each group
      const sortedTeams = [...teams].sort((a, b) => b.cost - a.cost);

      return {
        costCenter,
        teams: sortedTeams,
        totalHeadcount,
        totalCost,
        averageCostPerHead,
      };
    }
  );

  // Sort groups alphabetically by cost center name (Unassigned goes last)
  return groups.sort((a, b) => {
    if (a.costCenter === "Unassigned") return 1;
    if (b.costCenter === "Unassigned") return -1;
    return a.costCenter.localeCompare(b.costCenter);
  });
};

// Calculate team efficiency (cost per head)
export const calculateTeamEfficiency = (team: TeamData): number | null => {
  if (team.headcount === 0) {
    return null;
  }
  return team.cost / team.headcount;
};

// Get chart data for headcount distribution
export const getHeadcountChartData = (costCenterGroups: CostCenterGroup[]) => {
  const data: Array<{ name: string; headcount: number; costCenter: string }> =
    [];

  costCenterGroups.forEach((group) => {
    group.teams.forEach((team) => {
      data.push({
        name: team.teamName,
        headcount: team.headcount,
        costCenter: group.costCenter,
      });
    });
  });

  return data;
};

// Get chart data for cost distribution by cost center
export const getCostDistributionChartData = (
  costCenterGroups: CostCenterGroup[]
) => {
  return costCenterGroups.map((group) => ({
    name: group.costCenter,
    value: group.totalCost,
    percentage: 0, // Will be calculated by the chart component
  }));
};

// Color palette for charts (consistent with Executive Summary theme)
export const CHART_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#84CC16", // Lime
  "#EC4899", // Pink
  "#6366F1", // Indigo
];

// Get color for a cost center (consistent across charts)
export const getCostCenterColor = (
  costCenter: string,
  costCenterGroups: CostCenterGroup[]
): string => {
  const index = costCenterGroups.findIndex(
    (group) => group.costCenter === costCenter
  );
  return CHART_COLORS[index % CHART_COLORS.length];
};
