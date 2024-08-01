import { useDidMount } from '@/hooks/useDidMount';
import { useDidMountAndUpdate } from '@/hooks/useDidMountAndUpdate';
import { useDidUpdate } from '@/hooks/useDidUpdate';
import { useRefContinuousUpdate } from '@/hooks/useRefContinuousUpdate';
import { useWillUnmount } from '@/hooks/useWillUnmount';
import { set } from 'lodash';
import { useCallback, useMemo, useRef } from 'react';
import {
  BaseComponentProps,
  ComponentInstance,
  ComponentProps,
  ComponentState,
  LifecycleActionMethod,
  LifecycleConfigs,
  LifecycleName,
} from './types';
import { useBaseComponent } from './useBaseComponent';
import { updateAndCompareDependencies } from './utils';

type UseUIComponentComputedProps = {
  componentInstance: ComponentInstance;
};
const useUIComponentComputed = ({ componentInstance }: UseUIComponentComputedProps) => {
  /**
   * ======================= Handle computed methods =======================
   */
  const computed = useRefContinuousUpdate(componentInstance.computed);
  const _memorizedComputedDependencies = useRef<Record<string, { props: any[]; state: any[] }>>({});
  const _memorizedComputedResult = useRef<Record<string, any>>({});

  const computedResults = useMemo(() => {
    _memorizedComputedResult.current = Object.entries(computed.current ?? {}).reduce(
      (computedResult, [computedName, computedMethod]) => {
        const {
          isDifference: isDifferenceProps,
          prevValues: prevProps,
          newValues: newProps,
        } = updateAndCompareDependencies({
          values: componentInstance.props,
          depConfigs: computedMethod?.__config.dependencies?.props ?? [],
          prevDepValues: _memorizedComputedDependencies.current?.[computedName]?.props,
        });

        const {
          isDifference: isDifferenceState,
          prevValues: prevState,
          newValues: newState,
        } = updateAndCompareDependencies({
          values: componentInstance.state,
          depConfigs: computedMethod?.__config.dependencies?.state ?? [],
          prevDepValues: _memorizedComputedDependencies.current?.[computedName]?.state,
        });

        if (isDifferenceProps || isDifferenceState) {
          set(_memorizedComputedDependencies.current, `${computedName}.props`, newProps);
          set(_memorizedComputedDependencies.current, `${computedName}.state`, newState);
          return {
            ...computedResult,
            [computedName]: computedMethod?.({
              params: computedMethod?.__config.params,
              componentInstance,
              dependencies: {
                props: {
                  new: newProps,
                  previous: prevProps,
                },
                state: {
                  new: newState,
                  previous: prevState,
                },
              },
            }),
          };
        }

        return computedResult;
      },
      _memorizedComputedResult.current
    );
    return _memorizedComputedResult.current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentInstance.props, componentInstance.state]);
  // =====================================================================

  return computedResults;
};

type UseUIComponentLifecycleProps = {
  componentInstance: ComponentInstance;
};
const useUIComponentLifecycle = ({ componentInstance }: UseUIComponentLifecycleProps) => {
  const _memorizedLifecycleDependencies = useRef<
    Record<LifecycleName, Record<string, { props: any[]; state: any[] }>>
  >({
    mount: {},
    mountAndUpdate: {},
    unmount: {},
    update: {},
  });

  const lifecycle = useRefContinuousUpdate(componentInstance.lifecycle);

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
        prevDepValues:
          _memorizedLifecycleDependencies.current?.[lifecycleName]?.[actionName]?.props ?? [],
      });

      if (isDifference) {
        set(
          _memorizedLifecycleDependencies.current,
          `${lifecycleName}.${actionName}.props`,
          newValues
        );
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
        prevDepValues:
          _memorizedLifecycleDependencies.current?.[lifecycleName]?.[actionName]?.state ?? [],
      });

      if (isDifference) {
        set(
          _memorizedLifecycleDependencies.current,
          `${lifecycleName}.${actionName}.state`,
          newValues
        );
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
    executeMountAndUpdateLifecycle('mount', lifecycle.current.mount ?? {}, true);
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
};

export const useUIComponent = (props: ComponentProps) => {
  const { actions, componentInstance, mappedComponentName } = useBaseComponent(props);

  const computedResults = useUIComponentComputed({
    componentInstance,
  });

  useUIComponentLifecycle({
    componentInstance,
  });

  return {
    mappedComponentName,
    componentInstance,
    actions,
    computed: computedResults,
  };
};
