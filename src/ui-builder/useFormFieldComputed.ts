import { useRefContinuousUpdate } from '@/hooks/useRefContinuousUpdate';
import { ComponentInstance } from '@/ui-builder/types';
import { useMemo, useRef } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { UseBaseComponentReturn } from './useBaseComponent';
import { resolveArrayIndexesForFieldName, updateAndCompareDependencies } from './utils';

type UseFormFieldComputedProps = {
  formMethods: UseFormReturn;
  componentInstance: ComponentInstance;
} & Pick<UseBaseComponentReturn, '_memorizedMeta'>;
export const useFormFieldComputed = ({
  componentInstance,
  formMethods,
  _memorizedMeta,
}: UseFormFieldComputedProps) => {
  const computed = useRefContinuousUpdate(componentInstance.computed);

  const _memorizedComputedDependencies = useRef<
    Record<string, { props?: any[]; state?: any[]; fields?: any[]; meta?: any[] }>
  >({});
  const _memorizedComputedResult = useRef<Record<string, any>>({});

  const allComputedFieldsDependencies = useMemo(() => {
    const fieldsDependencies = Object.values(computed.current ?? {}).reduce(
      (result, computedMethod) => {
        return result.concat(
          ...(computedMethod?.__config.dependencies?.fields ?? []).map((f) =>
            resolveArrayIndexesForFieldName(componentInstance.parentPaths ?? [], f)
          )
        );
      },
      [] as string[]
    );

    // Remove duplicated fields
    return [...new Set(fieldsDependencies)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          prevDepValues: _memorizedComputedDependencies.current?.[computedName]?.props ?? [],
        });
        const {
          isDifference: isDifferenceState,
          prevValues: prevState,
          newValues: newState,
        } = updateAndCompareDependencies({
          values: componentInstance.state,
          depConfigs: computedMethod?.__config.dependencies?.state ?? [],
          prevDepValues: _memorizedComputedDependencies.current?.[computedName]?.state ?? [],
        });
        const {
          isDifference: isDifferenceFieldValues,
          prevValues: prevFieldValues,
          newValues: newFieldValues,
        } = updateAndCompareDependencies({
          values: formMethods.getValues(),
          depConfigs: (computedMethod?.__config.dependencies?.fields ?? []).map((f) =>
            resolveArrayIndexesForFieldName(componentInstance.parentPaths ?? [], f)
          ),
          prevDepValues: _memorizedComputedDependencies.current?.[computedName]?.fields ?? [],
        });

        const {
          isDifference: isDifferenceMeta,
          prevValues: prevMeta,
          newValues: newMeta,
        } = updateAndCompareDependencies({
          values: _memorizedMeta.current,
          depConfigs: computedMethod?.__config.dependencies?.meta ?? [],
          prevDepValues: _memorizedComputedDependencies.current?.[computedName]?.meta ?? [],
        });
        if (isDifferenceProps || isDifferenceState || isDifferenceFieldValues || isDifferenceMeta) {
          _memorizedComputedDependencies.current[computedName] = {
            ..._memorizedComputedDependencies.current[computedName],
            props: newProps,
          };
          _memorizedComputedDependencies.current[computedName] = {
            ..._memorizedComputedDependencies.current[computedName],
            state: newState,
          };
          _memorizedComputedDependencies.current[computedName] = {
            ..._memorizedComputedDependencies.current[computedName],
            meta: newMeta,
          };
          _memorizedComputedDependencies.current[computedName] = {
            ..._memorizedComputedDependencies.current[computedName],
            fields: newFieldValues,
          };
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
                meta: {
                  new: newMeta,
                  previous: prevMeta,
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
  }, [
    componentInstance.props,
    componentInstance.state,
    allComputedFieldsDependenciesValue,
    _memorizedMeta.current,
  ]);

  return computedResults;
};
