import { FunctionalAllocationState, FunctionalAllocation } from '../../types';

export type { FunctionalAllocationState };

export type FunctionalAllocationAction =
  | { type: 'ADD_FUNCTIONAL_ALLOCATION'; payload: FunctionalAllocation }
  | { type: 'UPDATE_FUNCTIONAL_ALLOCATION'; payload: FunctionalAllocation }
  | { type: 'DELETE_FUNCTIONAL_ALLOCATION'; payload: string }
  | { type: 'SET_FUNCTIONAL_ALLOCATIONS'; payload: FunctionalAllocation[] };

const initialState: FunctionalAllocationState = {
  allocations: []
};

export const functionalAllocationReducer = (
  state: FunctionalAllocationState = initialState,
  action: FunctionalAllocationAction
): FunctionalAllocationState => {
  switch (action.type) {
    case 'ADD_FUNCTIONAL_ALLOCATION':
      return {
        ...state,
        allocations: [...state.allocations, action.payload]
      };

    case 'UPDATE_FUNCTIONAL_ALLOCATION':
      return {
        ...state,
        allocations: state.allocations.map(allocation =>
          allocation.id === action.payload.id ? action.payload : allocation
        )
      };

    case 'DELETE_FUNCTIONAL_ALLOCATION':
      return {
        ...state,
        allocations: state.allocations.filter(
          allocation => allocation.id !== action.payload
        )
      };

    case 'SET_FUNCTIONAL_ALLOCATIONS':
      return {
        ...state,
        allocations: action.payload
      };

    default:
      return state;
  }
};