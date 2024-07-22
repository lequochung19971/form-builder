import { useRef, useState } from 'react';
import { get } from 'react-hook-form';
import { useUIBuilderContext } from './UIBuilderContext';
import { UIBuilderControl, ComponentInstancesNextArgs } from './createUIBuilder';
import { ComponentInstance } from './types';
import { useComponentSubscribe } from './useComponentSubscribe';
import { shouldSubscribeByComponentName } from './utils';

const generateWatch = (
  componentInstances: Record<string, ComponentInstance>,
  componentName: string | string[]
) => {
  if (Array.isArray(componentName)) {
    return componentName.reduce((result, componentName) => {
      return result.concat(get(componentInstances, componentName));
    }, [] as ComponentInstance[]);
  } else {
    return get(componentInstances, componentName);
  }
};

type UseWatchComponentInstance<T extends string[] | string> = {
  componentName: T;
  control?: UIBuilderControl;
};
export const useWatchComponentInstance = <
  T extends string[] | string,
  R = T extends string[] ? ComponentInstance[] : ComponentInstance
>(
  props: UseWatchComponentInstance<T>
) => {
  const uiBuilderMethods = useUIBuilderContext();
  const { componentName, control = uiBuilderMethods.control } = props;
  const _componentName = useRef(componentName);
  const [value, setValue] = useState<R>(
    generateWatch(control.componentInstances, _componentName.current) as R
  );

  useComponentSubscribe({
    next: ({
      componentInstances,
      componentName: signalName,
      subscribeAll,
    }: ComponentInstancesNextArgs) => {
      if (
        subscribeAll ||
        shouldSubscribeByComponentName({
          componentName: props.componentName,
          signalName,
        })
      ) {
        setValue({ ...generateWatch(componentInstances, _componentName.current) } as R);
      }
    },
    subject: control.subjects.instances,
  });

  return value;
};
