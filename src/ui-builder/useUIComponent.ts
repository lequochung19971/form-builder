import { useMemo } from 'react';
import { ComponentProps } from './types';
import { useUIBuilderContext } from './UIBuilderContext';
import { useWatchComponentInstance } from './useWatchComponentInstance';
import { createMappedComponentName, generateActions } from './utils';

export const useUIComponent = (props: ComponentProps) => {
  const { componentConfig, parentPaths: parentPaths } = props;

  const { actions = {} } = componentConfig;

  const { mappedComponentName: mappedComponentInstanceName } = createMappedComponentName(
    componentConfig.componentName,
    parentPaths
  );

  const { actionMethods } = useUIBuilderContext();

  const componentInstance = useWatchComponentInstance({
    componentName: mappedComponentInstanceName,
  });

  if (!componentInstance) {
    throw new Error(`There is no componentInstance: ${mappedComponentInstanceName}`);
  }

  const componentActionMethods = useMemo(
    () =>
      generateActions({
        actionMethods,
        actionsConfigs: actions,
        componentInstance,
      }),
    [actionMethods, actions, componentInstance]
  );

  return {
    mappedComponentName: mappedComponentInstanceName,
    componentInstance,
    parentPaths,
    actions: componentActionMethods,
  };
};
