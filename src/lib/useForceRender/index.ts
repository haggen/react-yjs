import { useReducer } from "react";

export function useUpdate() {
  return useReducer(() => [], []);
}
