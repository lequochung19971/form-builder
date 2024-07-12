import { DependencyList, EffectCallback, useEffect, useMemo, useRef } from 'react';
import { useDidMount } from './useDidMount';
import { useWillUnmount } from './useWillUnmount';

export function useDidUpdate(callback: EffectCallback, dependencies?: DependencyList): void {
  const hasMountedRef = useRef<boolean>(false);

  const internalConditions = useMemo(() => {
    if (typeof dependencies !== 'undefined' && !Array.isArray(dependencies)) {
      return [dependencies];
    } else if (Array.isArray(dependencies) && dependencies.length === 0) {
      console.warn(
        'Using [] as the second argument makes useDidUpdate a noop. The second argument should either be `undefined` or an array of length greater than 0.'
      );
    }

    return dependencies;
  }, [dependencies]);

  useEffect(() => {
    if (hasMountedRef.current) {
      callback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, internalConditions);

  useDidMount(() => {
    hasMountedRef.current = true;
  });

  useWillUnmount(() => {
    hasMountedRef.current = false;
  });
}
