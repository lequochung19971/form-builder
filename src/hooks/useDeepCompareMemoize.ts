import { isEqual } from 'lodash';
import { useMemo, useRef, DependencyList, EffectCallback, useEffect } from 'react';

export function useDeepCompareMemoize<T = unknown>(value: T) {
  const ref = useRef<T>();
  // it can be done by using useMemo as well
  // but useRef is rather cleaner and easier

  if (!isEqual(ref.current, value)) {
    ref.current = { ...value };
  }

  return ref.current;
}

export function useDeepCompareMemo<T>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(
    factory,
    // eslint-disable-next-line react-hooks/rules-of-hooks
    deps?.map<unknown>((d) => useDeepCompareMemoize(d))
  );
}

export const useDeepCompareEffect = (effect: EffectCallback, deps?: DependencyList) =>
  useEffect(effect, deps?.map(useDeepCompareMemoize));
