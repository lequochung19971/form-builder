import { DependencyList, EffectCallback, useEffect, useMemo, useRef } from 'react';
import { useDidMount } from './useDidMount';
import { useWillUnmount } from './useWillUnmount';
import { useRefContinuousUpdate } from './useRefContinuousUpdate';

export function useDidMountAndUpdate(
  callback: (didMount: boolean) => void,
  dependencies?: DependencyList
): void {
  const hasMountedRef = useRef<boolean>(false);
  const memorizedCallback = useRefContinuousUpdate(callback);

  const internalConditions = useMemo(() => {
    if (typeof dependencies !== 'undefined' && !Array.isArray(dependencies)) {
      return [dependencies];
    } else if (Array.isArray(dependencies) && dependencies.length === 0) {
      console.warn(
        'Using [] as the second argument makes useDidMountAndUpdate a noop. The second argument should either be `undefined` or an array of length greater than 0.'
      );
    }

    return dependencies;
  }, [dependencies]);

  useEffect(() => {
    memorizedCallback.current?.(hasMountedRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, internalConditions);

  useDidMount(() => {
    hasMountedRef.current = true;
  });

  useWillUnmount(() => {
    hasMountedRef.current = false;
  });
}
