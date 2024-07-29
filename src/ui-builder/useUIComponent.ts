import { useDidMount } from '@/hooks/useDidMount';
import { useDidMountAndUpdate } from '@/hooks/useDidMountAndUpdate';
import { useDidUpdate } from '@/hooks/useDidUpdate';
import { useRefContinuousUpdate } from '@/hooks/useRefContinuousUpdate';
import { useWillUnmount } from '@/hooks/useWillUnmount';
import { set } from 'lodash';
import { useCallback, useRef } from 'react';
import {
  BaseComponentProps,
  ComponentProps,
  ComponentState,
  LifecycleActionMethod,
  LifecycleConfigs,
  LifecycleName,
} from './types';
import { useBaseComponent } from './useBaseComponent';
import { updateAndCompareDependencies } from './utils';

export const useUIComponent = (props: ComponentProps) => {
  const { actions, componentInstance, mappedComponentName } = useBaseComponent(props);

  const _memorizedDependencies = useRef<
    Record<LifecycleName, Record<string, { props: any[]; state: any[] }>>
  >({
    mount: {},
    mountAndUpdate: {},
    unmount: {},
    update: {},
  });

  const lifecycle = useRefContinuousUpdate(componentInstance.__lifecycle);

  const updateAndCompareProps = useCallback(
    ({
      props,
      actionName,
      depConfigs,
      lifecycleName,
    }: {
      props: BaseComponentProps;
      actionName: string;
      lifecycleName: keyof LifecycleConfigs;
      depConfigs: string[];
    }) => {
      const { isDifference, prevValues, newValues } = updateAndCompareDependencies({
        values: props,
        depConfigs,
        prevDepValues: _memorizedDependencies.current?.[lifecycleName]?.[actionName]?.props ?? [],
      });

      if (isDifference) {
        set(_memorizedDependencies.current, `${lifecycleName}.${actionName}.props`, newValues);
      }

      return {
        isDifference,
        prevValues,
        newValues,
      };
    },
    []
  );

  const updateAndCompareState = useCallback(
    ({
      state,
      actionName,
      depConfigs,
      lifecycleName,
    }: {
      state: ComponentState;
      actionName: string;
      lifecycleName: keyof LifecycleConfigs;
      depConfigs: string[];
    }) => {
      const { isDifference, prevValues, newValues } = updateAndCompareDependencies({
        values: state,
        depConfigs,
        prevDepValues: _memorizedDependencies.current?.[lifecycleName]?.[actionName]?.state ?? [],
      });

      if (isDifference) {
        set(_memorizedDependencies.current, `${lifecycleName}.${actionName}.state`, newValues);
      }

      return {
        isDifference,
        prevValues,
        newValues,
      };
    },
    []
  );

  const executeMountAndUpdateLifecycle = useCallback(
    (
      lifecycleName: LifecycleName,
      lifecycleMethods: Partial<Record<string, LifecycleActionMethod>>,
      didMount: boolean
    ) => {
      Object.entries(lifecycleMethods).forEach(([actionName, actionMethod]) => {
        if (didMount) {
          actionMethod?.({
            params: actionMethod.__config.params,
            componentInstance,
          });
          return;
        }

        const dependencies = actionMethod?.__config.dependencies;
        const isNoDependencies = !dependencies?.props?.length && !dependencies?.state?.length;

        /**
         * If no dependencies, action method will trigger every props or state change.
         */
        if (isNoDependencies) {
          actionMethod?.({
            params: actionMethod.__config.params,
            componentInstance,
          });
        } else {
          const {
            prevValues: prevProps,
            newValues: newProps,
            isDifference: isPropsDifference,
          } = updateAndCompareProps({
            actionName,
            lifecycleName,
            depConfigs: dependencies.props ?? [],
            props: componentInstance.props,
          });
          const {
            prevValues: prevState,
            newValues: newState,
            isDifference: isStateDifference,
          } = updateAndCompareState({
            actionName,
            lifecycleName,
            depConfigs: dependencies.state ?? [],
            state: componentInstance.state,
          });
          if (isPropsDifference || isStateDifference) {
            actionMethod?.({
              params: actionMethod.__config.params,
              componentInstance,
              dependencies: {
                props: {
                  previous: prevProps,
                  new: newProps,
                },
                state: {
                  previous: prevState,
                  new: newState,
                },
              },
            });
          }
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [componentInstance.props, componentInstance.state, updateAndCompareProps, updateAndCompareState]
  );

  useDidMount(() => {
    executeMountAndUpdateLifecycle('mount', lifecycle.current.mountAndUpdate ?? {}, true);
  });

  useDidMountAndUpdate(
    (didMount) => {
      executeMountAndUpdateLifecycle(
        'mountAndUpdate',
        lifecycle.current.mountAndUpdate ?? {},
        didMount
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [executeMountAndUpdateLifecycle]
  );

  useDidUpdate(() => {
    executeMountAndUpdateLifecycle('update', lifecycle.current.mountAndUpdate ?? {}, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executeMountAndUpdateLifecycle]);

  useWillUnmount(() => {
    Object.values(lifecycle.current.unmount ?? {}).forEach((actionMethod) => {
      actionMethod?.({
        params: actionMethod.__config.params,
        componentInstance,
      });
    });
  });

  return {
    mappedComponentName,
    componentInstance,
    actions,
  };
};
