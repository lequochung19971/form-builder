import { DependencyList, useEffect, useMemo, useRef } from 'react';
import { useDidMount } from './useDidMount';
import { useRefContinuousUpdate } from './useRefContinuousUpdate';
import { useWillUnmount } from './useWillUnmount';

export function useDidMountAndUpdate(
  callback: (didMount: boolean) => void,
  dependencies?: DependencyList
): void {
  const hasMountedRef = useRef<boolean>(true);
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
    hasMountedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, internalConditions);

  useWillUnmount(() => {
    hasMountedRef.current = false;
  });
}
