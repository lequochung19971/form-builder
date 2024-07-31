import { useDidMount } from '@/hooks/useDidMount';
import { useDidMountAndUpdate } from '@/hooks/useDidMountAndUpdate';
import { useDidUpdate } from '@/hooks/useDidUpdate';
import { useRefContinuousUpdate } from '@/hooks/useRefContinuousUpdate';
import { useWillUnmount } from '@/hooks/useWillUnmount';
import {
  ComponentInstance,
  LifecycleName,
  BaseComponentProps,
  LifecycleConfigs,
  LifecycleActionMethod,
} from '@/ui-builder/types';
import { set } from 'lodash';
import { useMemo, useRef, useCallback, ComponentState } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { updateAndCompareDependencies } from './utils';
type UseFormFieldLifecycleProps = {
  formMethods: UseFormReturn;
  componentInstance: ComponentInstance;
};
export const useFormFieldLifecycle = ({
  componentInstance,
  formMethods,
}: UseFormFieldLifecycleProps) => {
  const lifecycle = useRefContinuousUpdate(componentInstance.lifecycle);

  const allLifecycleFieldsDependencies = useMemo(() => {
    const fieldsDependencies = Object.values(lifecycle.current ?? {}).reduce(
      (result, lifecycleActions) => {
        return result.concat(
          ...Object.values(lifecycleActions ?? {}).reduce(
            (res, actionMethod) =>
              res.concat(...(actionMethod?.__config.dependencies?.fields ?? [])),
            [] as string[]
          )
        );
      },
      [] as string[]
    );

    // Remove duplicated fields
    return [...new Set(fieldsDependencies)];
  }, [lifecycle]);

  const allLifecycleFieldsDependenciesValue = useWatch({
    control: formMethods.control,
    name: allLifecycleFieldsDependencies,
  });

  const _memorizedDependencies = useRef<
    Record<LifecycleName, Record<string, { props?: any[]; state?: any[]; fields?: any[] }>>
  >({
    mount: {},
    mountAndUpdate: {},
    unmount: {},
    update: {},
  });

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

  const updateAndCompareFields = useCallback(
    ({
      fieldValues,
      actionName,
      depConfigs,
      lifecycleName,
    }: {
      fieldValues: any;
      actionName: string;
      lifecycleName: keyof LifecycleConfigs;
      depConfigs: string[];
    }) => {
      const { isDifference, prevValues, newValues } = updateAndCompareDependencies({
        values: fieldValues,
        depConfigs,
        prevDepValues: _memorizedDependencies.current?.[lifecycleName]?.[actionName]?.fields ?? [],
      });

      if (isDifference) {
        set(_memorizedDependencies.current, `${lifecycleName}.${actionName}.fields`, newValues);
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
          const {
            prevValues: prevFieldValues,
            newValues: newFieldValues,
            isDifference: isFieldsDifference,
          } = updateAndCompareFields({
            actionName,
            lifecycleName,
            depConfigs: dependencies.state ?? [],
            fieldValues: formMethods.getValues(),
          });
          if (isPropsDifference || isStateDifference || isFieldsDifference) {
            actionMethod?.({
              params: actionMethod.__config.params,
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
                fields: {
                  new: newFieldValues,
                  previous: prevFieldValues,
                },
              },
            });
          }
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      componentInstance.props,
      componentInstance.state,
      allLifecycleFieldsDependenciesValue,
      updateAndCompareProps,
      updateAndCompareState,
      updateAndCompareFields,
    ]
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
};
