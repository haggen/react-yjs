import { useRef, useInsertionEffect, useCallback } from "react";

type F = (...a: any[]) => any;

export function useEvent<T extends F>(callback?: T) {
  const ref = useRef<F | undefined>(() => {
    throw new Error("Cannot call an event handler while rendering.");
  });
  useInsertionEffect(() => {
    ref.current = callback;
  });
  return useCallback<F>((...a) => ref.current?.(...a), []) as T;
}
