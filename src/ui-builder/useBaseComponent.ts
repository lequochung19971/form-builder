import { useRefContinuousUpdate } from '@/hooks/useRefContinuousUpdate';
import { MutableRefObject, useMemo, useRef } from 'react';
import { ComponentInstance, ComponentProps, EventActionMethods } from './types';
import { useWatchComponentInstance } from './useWatchComponentInstance';
import { createMappedComponentName, generateActions } from './utils';

export type UseBaseComponentReturn<T extends ComponentInstance = ComponentInstance> = {
  mappedComponentName: string;
  componentInstance: T;
  actions: Record<keyof EventActionMethods, (event?: any) => void>;
  get _memorizedMeta(): MutableRefObject<Partial<Record<string, any>>>;
};

export const useBaseComponent = <T extends ComponentInstance = ComponentInstance>(
  props: ComponentProps
): UseBaseComponentReturn<T> => {
  const { componentConfig, parentPaths, meta = {} } = props;
  const memorizedComponentConfig = useRefContinuousUpdate(componentConfig);

  const _memorizedMeta = useRef(meta);

  _memorizedMeta.current = useMemo(() => {
    return Object.entries(meta).reduce(
      (res, [key, metaValue]) => ({
        ...res,
        [key]: metaValue,
      }),
      {}
    );
  }, [meta]);

  const { mappedComponentName: mappedComponentName } = createMappedComponentName(
    memorizedComponentConfig.current.componentName,
    parentPaths
  );

  const componentInstance: T = useWatchComponentInstance({
    componentName: mappedComponentName,
  });

  if (!componentInstance) {
    throw new Error(`There is no componentInstance: ${mappedComponentName}`);
  }

  const componentActionMethods = useMemo(
    () =>
      generateActions({
        eventActionMethods: componentInstance.actions ?? {},
        componentInstance,
        meta: _memorizedMeta.current,
      }),
    [componentInstance]
  );

  return {
    mappedComponentName,
    componentInstance,
    actions: componentActionMethods,
    get _memorizedMeta() {
      return _memorizedMeta;
    },
  };
};
