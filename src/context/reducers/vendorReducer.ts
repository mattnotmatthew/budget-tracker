import { VendorData, VendorTracking } from "../../types";

export interface VendorState {
  vendorData: VendorData[];
  vendorTrackingData: VendorTracking[];
}

export type VendorAction =
  | { type: "ADD_VENDOR_DATA"; payload: VendorData }
  | { type: "UPDATE_VENDOR_DATA"; payload: VendorData }
  | { type: "DELETE_VENDOR_DATA"; payload: string }
  | { type: "LOAD_VENDOR_DATA"; payload: VendorData[] }
  | { type: "ADD_VENDOR_TRACKING"; payload: VendorTracking }
  | { type: "UPDATE_VENDOR_TRACKING"; payload: VendorTracking }
  | { type: "DELETE_VENDOR_TRACKING"; payload: string }
  | { type: "LOAD_VENDOR_TRACKING"; payload: VendorTracking[] };

export const initialVendorState: VendorState = {
  vendorData: [],
  vendorTrackingData: [],
};

export const vendorReducer = (
  state: VendorState,
  action: VendorAction
): VendorState => {
  switch (action.type) {
    case "ADD_VENDOR_DATA":
      return {
        ...state,
        vendorData: [...state.vendorData, action.payload],
      };

    case "UPDATE_VENDOR_DATA":
      return {
        ...state,
        vendorData: state.vendorData.map((vendor) =>
          vendor.id === action.payload.id ? action.payload : vendor
        ),
      };

    case "DELETE_VENDOR_DATA":
      return {
        ...state,
        vendorData: state.vendorData.filter(
          (vendor) => vendor.id !== action.payload
        ),
      };

    case "LOAD_VENDOR_DATA":
      return {
        ...state,
        vendorData: action.payload,
      };

    case "ADD_VENDOR_TRACKING":
      return {
        ...state,
        vendorTrackingData: [...state.vendorTrackingData, action.payload],
      };

    case "UPDATE_VENDOR_TRACKING":
      return {
        ...state,
        vendorTrackingData: state.vendorTrackingData.map((tracking) =>
          tracking.id === action.payload.id ? action.payload : tracking
        ),
      };

    case "DELETE_VENDOR_TRACKING":
      return {
        ...state,
        vendorTrackingData: state.vendorTrackingData.filter(
          (tracking) => tracking.id !== action.payload
        ),
      };

    case "LOAD_VENDOR_TRACKING":
      return {
        ...state,
        vendorTrackingData: action.payload,
      };

    default:
      return state;
  }
};