import { useRefContinuousUpdate } from '@/hooks/useRefContinuousUpdate';
import { useMemo } from 'react';
import { ComponentInstance, ComponentProps } from './types';
import { useWatchComponentInstance } from './useWatchComponentInstance';
import { createMappedComponentName, generateActions } from './utils';

export const useBaseComponent = <T extends ComponentInstance = ComponentInstance>(
  props: ComponentProps
) => {
  const { componentConfig, parentPaths } = props;
  const memorizedComponentConfig = useRefContinuousUpdate(componentConfig);

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
      }),
    [componentInstance]
  );

  return {
    mappedComponentName,
    componentInstance,
    actions: componentActionMethods,
  };
};
