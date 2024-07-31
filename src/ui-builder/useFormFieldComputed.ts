import { useRefContinuousUpdate } from '@/hooks/useRefContinuousUpdate';
import { ComponentInstance } from '@/ui-builder/types';
import { set } from 'lodash';
import { useRef, useMemo } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { updateAndCompareDependencies } from './utils';

type UseFormFieldComputedProps = {
  formMethods: UseFormReturn;
  componentInstance: ComponentInstance;
};
export const useFormFieldComputed = ({
  componentInstance,
  formMethods,
}: UseFormFieldComputedProps) => {
  const computed = useRefContinuousUpdate(componentInstance.computed);

  const _memorizedComputedDependencies = useRef<
    Record<string, { props: any[]; state: any[]; fields: any[] }>
  >({});
  const _memorizedComputedResult = useRef<Record<string, any>>({});

  const allComputedFieldsDependencies = useMemo(() => {
    const fieldsDependencies = Object.values(computed.current ?? {}).reduce(
      (result, computedMethod) => {
        return result.concat(...(computedMethod?.__config.dependencies?.fields ?? []));
      },
      [] as string[]
    );

    // Remove duplicated fields
    return [...new Set(fieldsDependencies)];
  }, [computed]);

  const allComputedFieldsDependenciesValue = useWatch({
    control: formMethods.control,
    name: allComputedFieldsDependencies,
  });

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
        const {
          isDifference: isDifferenceFieldValues,
          prevValues: prevFieldValues,
          newValues: newFieldValues,
        } = updateAndCompareDependencies({
          values: formMethods.getValues(),
          depConfigs: computedMethod?.__config.dependencies?.fields ?? [],
          prevDepValues: _memorizedComputedDependencies.current?.[computedName]?.fields ?? [],
        });

        if (isDifferenceProps || isDifferenceState || isDifferenceFieldValues) {
          set(_memorizedComputedDependencies.current, `${computedName}.props`, newProps);
          set(_memorizedComputedDependencies.current, `${computedName}.state`, newState);
          set(_memorizedComputedDependencies.current, `${computedName}.fields`, newFieldValues);
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
                fields: {
                  new: newFieldValues,
                  previous: prevFieldValues,
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
  }, [componentInstance.props, componentInstance.state, allComputedFieldsDependenciesValue]);

  return computedResults;
};
