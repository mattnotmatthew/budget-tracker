import { TeamData, TeamState } from "../../types";

export type { TeamState };

export type TeamAction =
  | { type: "ADD_TEAM"; payload: TeamData }
  | { type: "UPDATE_TEAM"; payload: TeamData }
  | { type: "DELETE_TEAM"; payload: string }
  | { type: "LOAD_TEAMS"; payload: TeamData[] };

export const initialTeamState: TeamState = {
  teams: [],
};

export const teamReducer = (
  state: TeamState,
  action: TeamAction
): TeamState => {
  switch (action.type) {
    case "ADD_TEAM":
      return {
        ...state,
        teams: [...state.teams, action.payload],
      };

    case "UPDATE_TEAM":
      return {
        ...state,
        teams: state.teams.map((team) =>
          team.id === action.payload.id ? action.payload : team
        ),
      };

    case "DELETE_TEAM":
      return {
        ...state,
        teams: state.teams.filter((team) => team.id !== action.payload),
      };

    case "LOAD_TEAMS":
      return {
        ...state,
        teams: action.payload,
      };

    default:
      return state;
  }
};