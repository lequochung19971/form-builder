import { useDidMount } from '@/hooks/useDidMount';
import { useDidMountAndUpdate } from '@/hooks/useDidMountAndUpdate';
import { useDidUpdate } from '@/hooks/useDidUpdate';
import { useRefContinuousUpdate } from '@/hooks/useRefContinuousUpdate';
import { useWillUnmount } from '@/hooks/useWillUnmount';
import {
  BaseComponentProps,
  ComponentInstance,
  ComponentMeta,
  LifecycleActionMethod,
  LifecycleConfigs,
  LifecycleName,
} from '@/ui-builder/types';
import { ComponentState, useCallback, useMemo, useRef } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { UseBaseComponentReturn } from './useBaseComponent';
import { resolveArrayIndexesForFieldName, updateAndCompareDependencies } from './utils';
type UseFormFieldLifecycleProps = {
  formMethods: UseFormReturn;
  componentInstance: ComponentInstance;
} & Pick<UseBaseComponentReturn, '_memorizedMeta'>;
export const useFormFieldLifecycle = ({
  componentInstance,
  formMethods,
  _memorizedMeta,
}: UseFormFieldLifecycleProps) => {
  const lifecycle = useRefContinuousUpdate(componentInstance.lifecycle);

  const allLifecycleFieldsDependencies = useMemo(() => {
    const fieldsDependencies = Object.values(lifecycle.current ?? {}).reduce(
      (result, lifecycleActions) => {
        return result.concat(
          ...Object.values(lifecycleActions ?? {}).reduce(
            (res, actionMethod) =>
              res.concat(
                ...(actionMethod?.__config.dependencies?.fields ?? []).map((f) =>
                  resolveArrayIndexesForFieldName(componentInstance.parentPaths ?? [], f)
                )
              ),
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

  const _memorizedLifecycleDependencies = useRef<
    Record<
      LifecycleName,
      Record<string, { props?: any[]; state?: any[]; fields?: any[]; meta?: any[] }>
    >
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
        prevDepValues:
          _memorizedLifecycleDependencies.current?.[lifecycleName]?.[actionName]?.props ?? [],
      });

      if (isDifference) {
        _memorizedLifecycleDependencies.current = {
          ..._memorizedLifecycleDependencies.current,
          [lifecycleName]: {
            ..._memorizedLifecycleDependencies.current[lifecycleName],
            [actionName]: {
              ..._memorizedLifecycleDependencies.current[lifecycleName]?.[actionName],
              props: newValues,
            },
          },
        };
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
        _memorizedLifecycleDependencies.current = {
          ..._memorizedLifecycleDependencies.current,
          [lifecycleName]: {
            ..._memorizedLifecycleDependencies.current[lifecycleName],
            [actionName]: {
              ..._memorizedLifecycleDependencies.current[lifecycleName]?.[actionName],
              state: newValues,
            },
          },
        };
      }

      return {
        isDifference,
        prevValues,
        newValues,
      };
    },
    []
  );

  const updateAndCompareMeta = useCallback(
    ({
      meta,
      actionName,
      depConfigs,
      lifecycleName,
    }: {
      meta: ComponentMeta;
      actionName: string;
      lifecycleName: keyof LifecycleConfigs;
      depConfigs: string[];
    }) => {
      const { isDifference, prevValues, newValues } = updateAndCompareDependencies({
        values: meta,
        depConfigs,
        prevDepValues:
          _memorizedLifecycleDependencies.current?.[lifecycleName]?.[actionName]?.meta ?? [],
      });

      if (isDifference) {
        _memorizedLifecycleDependencies.current = {
          ..._memorizedLifecycleDependencies.current,
          [lifecycleName]: {
            ..._memorizedLifecycleDependencies.current[lifecycleName],
            [actionName]: {
              ..._memorizedLifecycleDependencies.current[lifecycleName]?.[actionName],
              meta: newValues,
            },
          },
        };
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
        prevDepValues:
          _memorizedLifecycleDependencies.current?.[lifecycleName]?.[actionName]?.fields ?? [],
      });

      if (isDifference) {
        _memorizedLifecycleDependencies.current = {
          ..._memorizedLifecycleDependencies.current,
          [lifecycleName]: {
            ..._memorizedLifecycleDependencies.current[lifecycleName],
            [actionName]: {
              ..._memorizedLifecycleDependencies.current[lifecycleName]?.[actionName],
              fields: newValues,
            },
          },
        };
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
      lifecycleMethods: LifecycleActionMethod[],
      didMount: boolean
    ) => {
      lifecycleMethods.forEach((actionMethod, index) => {
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
            actionName: `${actionMethod.__config.name}___${index}`,
            lifecycleName,
            depConfigs: dependencies.props ?? [],
            props: componentInstance.props,
          });
          const {
            prevValues: prevState,
            newValues: newState,
            isDifference: isStateDifference,
          } = updateAndCompareState({
            actionName: `${actionMethod.__config.name}___${index}`,
            lifecycleName,
            depConfigs: dependencies.state ?? [],
            state: componentInstance.state,
          });
          const {
            prevValues: prevFieldValues,
            newValues: newFieldValues,
            isDifference: isFieldsDifference,
          } = updateAndCompareFields({
            actionName: `${actionMethod.__config.name}___${index}`,
            lifecycleName,
            depConfigs: dependencies.state ?? [],
            fieldValues: formMethods.getValues(),
          });
          const {
            prevValues: prevMeta,
            newValues: newMeta,
            isDifference: isMetaDifference,
          } = updateAndCompareMeta({
            // Add index because in case of using the same action name
            actionName: `${actionMethod.__config.name}___${index}`,
            lifecycleName,
            depConfigs: dependencies.state ?? [],
            meta: _memorizedMeta.current,
          });
          if (isPropsDifference || isStateDifference || isFieldsDifference || isMetaDifference) {
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
                meta: {
                  previous: prevMeta,
                  new: newMeta,
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
      _memorizedMeta.current,
      updateAndCompareProps,
      updateAndCompareState,
      updateAndCompareFields,
    ]
  );

  useDidMount(() => {
    executeMountAndUpdateLifecycle('mount', lifecycle.current.mountAndUpdate ?? [], true);
  });

  useDidMountAndUpdate(
    (didMount) => {
      executeMountAndUpdateLifecycle(
        'mountAndUpdate',
        lifecycle.current.mountAndUpdate ?? [],
        didMount
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [executeMountAndUpdateLifecycle]
  );

  useDidUpdate(() => {
    executeMountAndUpdateLifecycle('update', lifecycle.current.update ?? [], false);
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
