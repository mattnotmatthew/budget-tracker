import { PlanningData, HistoricalAnalysis } from "../../types";
import { isFeatureEnabled } from "../../utils/featureFlags";

export interface PlanningState {
  planningMode: boolean;
  planningData: { [year: number]: PlanningData };
  selectedScenario?: string;
  historicalAnalysis: { [year: number]: HistoricalAnalysis };
}

export type PlanningAction =
  | { type: "SET_PLANNING_MODE"; payload: boolean }
  | { type: "SET_PLANNING_DATA"; payload: { year: number; data: PlanningData } }
  | {
      type: "UPDATE_PLANNING_DATA";
      payload: { year: number; data: Partial<PlanningData> };
    }
  | { type: "DELETE_PLANNING_DATA"; payload: number }
  | { type: "SET_SELECTED_SCENARIO"; payload: string }
  | {
      type: "SET_HISTORICAL_ANALYSIS";
      payload: { year: number; analysis: HistoricalAnalysis };
    };

export const initialPlanningState: PlanningState = {
  planningMode: false,
  planningData: {},
  selectedScenario: undefined,
  historicalAnalysis: {},
};

export const planningReducer = (
  state: PlanningState,
  action: PlanningAction
): PlanningState => {
  switch (action.type) {
    case "SET_PLANNING_MODE":
      if (!isFeatureEnabled("BUDGET_PLANNING")) {
        console.warn("Planning feature is disabled");
        return state;
      }
      return {
        ...state,
        planningMode: action.payload,
      };

    case "SET_PLANNING_DATA":
      if (!isFeatureEnabled("BUDGET_PLANNING")) {
        console.warn("Planning feature is disabled");
        return state;
      }
      return {
        ...state,
        planningData: {
          ...state.planningData,
          [action.payload.year]: action.payload.data,
        },
      };

    case "UPDATE_PLANNING_DATA":
      if (!isFeatureEnabled("BUDGET_PLANNING")) {
        console.warn("Planning feature is disabled");
        return state;
      }
      const existingData = state.planningData?.[action.payload.year];
      if (!existingData) {
        console.warn(`No planning data found for year ${action.payload.year}`);
        return state;
      }
      return {
        ...state,
        planningData: {
          ...state.planningData,
          [action.payload.year]: {
            ...existingData,
            ...action.payload.data,
            metadata: {
              ...existingData.metadata,
              lastModified: new Date(),
            },
          },
        },
      };

    case "DELETE_PLANNING_DATA":
      if (!isFeatureEnabled("BUDGET_PLANNING")) {
        console.warn("Planning feature is disabled");
        return state;
      }
      const { [action.payload]: deletedData, ...remainingData } =
        state.planningData || {};
      return {
        ...state,
        planningData: remainingData,
        selectedScenario:
          state.selectedScenario &&
          deletedData?.scenarios.some((s) => s.id === state.selectedScenario)
            ? undefined
            : state.selectedScenario,
      };

    case "SET_SELECTED_SCENARIO":
      if (!isFeatureEnabled("BUDGET_PLANNING")) {
        console.warn("Planning feature is disabled");
        return state;
      }
      return {
        ...state,
        selectedScenario: action.payload,
      };

    case "SET_HISTORICAL_ANALYSIS":
      if (!isFeatureEnabled("BUDGET_PLANNING")) {
        console.warn("Planning feature is disabled");
        return state;
      }
      return {
        ...state,
        historicalAnalysis: {
          ...state.historicalAnalysis,
          [action.payload.year]: action.payload.analysis,
        },
      };

    default:
      return state;
  }
};