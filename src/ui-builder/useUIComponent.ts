import { ComponentProps } from './types';
import { useWatchComponentInstance } from './useWatchComponentInstance';
import { createMappedFieldNameForComponentInstances } from './utils';

export const useUIComponent = (props: ComponentProps) => {
  const { componentConfig, parentPaths: parentPaths } = props;

  const { mappedComponentName: mappedComponentInstanceName } =
    createMappedFieldNameForComponentInstances(componentConfig.componentName, parentPaths);

  const componentInstance = useWatchComponentInstance({
    componentName: mappedComponentInstanceName,
  });

  if (!componentInstance) {
    throw new Error(`There is no componentInstance: ${mappedComponentInstanceName}`);
  }

  return {
    mappedComponentName: mappedComponentInstanceName,
    componentInstance,
    parentPaths,
  };
};
