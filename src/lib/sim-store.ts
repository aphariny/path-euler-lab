import { useSyncExternalStore } from "react";
import { DEFAULT_PARAMS, type SimParams } from "./solver";

let current: SimParams = { ...DEFAULT_PARAMS };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function setSimParams(p: SimParams) {
  current = p;
  emit();
}

export function resetSimParams() {
  setSimParams({ ...DEFAULT_PARAMS });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const getSnapshot = () => current;

export function useSimParams(): SimParams {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
