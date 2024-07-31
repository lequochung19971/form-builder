import convertToArrayPayload from '@/utils/convertToArrayPayload';
import { forEach, get, isUndefined } from 'lodash';
import { SyntheticEvent } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  ActionMethods,
  ComponentInstance,
  EventActionMethods,
  ParentPath,
  ValidationConfigs,
  ValidationMethods,
  WhenConditionConfigs,
} from './types';

export const createMappedFieldName = (current: string, parentPaths = [] as ParentPath[]) => {
  const parentName = parentPaths.reduce((result, path) => {
    if (!path.fieldName) return result;

    if (result) {
      result =
        typeof path.index === 'number'
          ? `${result}.${path.fieldName}[${path.index}]`
          : `${result}.${path.fieldName}`;
    } else {
      result =
        typeof path.index === 'number' ? `${path.fieldName}[${path.index}]` : path.fieldName!;
    }
    return result;
  }, '');

  return {
    mappedParentFieldName: parentName,
    mappedFieldName: parentName ? `${parentName}.${current}` : current,
  };
};

export const createMappedComponentName = (current: string, parentPaths = [] as ParentPath[]) => {
  const parentName = parentPaths.reduce((result, path, index) => {
    result = result ? `${result}.${path.componentName}` : path.componentName;

    const isNotLast = index < parentPaths.length - 1;
    if (isNotLast) {
      result =
        typeof path.index === 'number'
          ? `${result}.__children[${path.index}]`
          : `${result}.__children`;
    }

    return result;
  }, '');

  if (!parentName) {
    return {
      mappedParentComponentName: undefined,
      mappedComponentName: current,
    };
  }

  const lastPath = parentPaths[parentPaths.length - 1];

  return {
    mappedParentComponentName: parentName,
    mappedComponentName:
      typeof lastPath.index === 'number'
        ? `${parentName}.__children[${lastPath.index}].${current}`
        : `${parentName}.__children.${current}`,
  };
};

function removeAtIndexes<T>(data: T[], indexes: number[]): T[] {
  let i = 0;

  for (const index of indexes) {
    data.splice(index - i, 1);
    i++;
  }

  return data.length ? data : [];
}

export const removeAt = <T>(data: T[], index?: number | number[]): T[] =>
  isUndefined(index)
    ? []
    : removeAtIndexes(
        data,
        (convertToArrayPayload(index) as number[]).sort((a, b) => a - b)
      );

export const shouldSubscribeByComponentName = <T extends string | string[] | undefined>({
  componentName,
  signalName,
}: {
  componentName: T;
  signalName?: string;
}) =>
  (!!componentName && componentName === signalName) ||
  convertToArrayPayload(componentName).some(
    (currentName) => currentName && currentName === signalName
  );

type DependencyConfig = {
  fieldName: string;
  deps: string[];
};

type CircularDependencyResult = {
  hasCircularDependencies: boolean;
  circularGraph: CircularDependencyEntry[] | null;
};

type CircularDependencyEntry = {
  fieldName: string;
  cyclePath: string[];
};

export function detectAndGenerateCircularDependencyGraph(
  config: DependencyConfig[]
): CircularDependencyResult {
  // Build a map of dependencies
  const dependencyMap = new Map<string, string[]>();
  config.forEach((item) => {
    dependencyMap.set(item.fieldName, item.deps);
  });

  const visited = new Set<string>();
  const inStack = new Set<string>();
  const circularDependencies = new Map<string, string[]>();

  function detectCycle(fieldName: string, path: string[]): boolean {
    if (inStack.has(fieldName)) {
      // Cycle detected; create a human-readable cycle path
      const cycleStartIndex = path.indexOf(fieldName);
      const cyclePath = path.slice(cycleStartIndex).concat(fieldName); // Complete cycle
      if (!circularDependencies.has(fieldName)) {
        circularDependencies.set(fieldName, cyclePath);
      }
      return true;
    }
    if (visited.has(fieldName)) {
      return false;
    }

    visited.add(fieldName);
    inStack.add(fieldName);
    path.push(fieldName);

    const deps = dependencyMap.get(fieldName) || [];
    let hasCycle = false;
    for (const dep of deps) {
      if (detectCycle(dep, path)) {
        hasCycle = true;
      }
    }

    path.pop();
    inStack.delete(fieldName);
    return hasCycle;
  }

  let hasCircularDependencies = false;
  for (const fieldName of dependencyMap.keys()) {
    if (detectCycle(fieldName, [])) {
      hasCircularDependencies = true;
    }
  }

  // Convert circularDependencies Map to a more intuitive format
  const formattedCircularDependencies: CircularDependencyEntry[] = Array.from(
    circularDependencies.entries()
  ).map(([key, value]) => ({
    fieldName: key,
    cyclePath: value,
  }));

  return {
    hasCircularDependencies,
    circularGraph: formattedCircularDependencies.length ? formattedCircularDependencies : null,
  };
}

export function matchesPatternFieldName(pattern: string, fieldName: string): boolean {
  // Escape special regex characters in the string pattern
  const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Replace '[]' with the regex pattern for matching both bracket and dot notations
  const regexPattern = escapedPattern.replace('\\[\\]', '(?:\\[(\\d+)\\]|.(\\d+))');

  // Create the regex from the pattern
  const regex = new RegExp(`^${regexPattern}$`);

  // Test the input string against the regex
  return regex.test(fieldName);
}

export function resolveArrayIndexesForFieldName<
  T extends string | string[],
  R = T extends string[] ? string[] : string
>(parentPaths: ParentPath[], fieldName: T) {
  if (typeof fieldName === 'string') {
    return parentPaths.reduce((result, path) => {
      if (path.fieldName && typeof path.index === 'number') {
        result = result.replace('[]', `[${path.index}]`);
      }
      return result;
    }, fieldName as string) as R;
  }

  return fieldName.map((name) => {
    return parentPaths.reduce((result, path) => {
      if (path.fieldName && typeof path.index === 'number') {
        result = result.replace('[]', `[${path.index}]`);
      }
      return result;
    }, name);
  }) as R;
}

export function resolveArrayIndexesForComponentName<
  T extends string | string[],
  R = T extends string[] ? string[] : string
>(parentPaths: ParentPath[], componentName: T) {
  if (typeof componentName === 'string') {
    return parentPaths.reduce((result, path) => {
      if (path.componentName && typeof path.index === 'number') {
        result = result.replace('[]', `[${path.index}]`);
      }
      return result;
    }, componentName as string) as R;
  }

  return componentName.map((name) => {
    return parentPaths.reduce((result, path) => {
      if (path.componentName && typeof path.index === 'number') {
        result = result.replace('[]', `[${path.index}]`);
      }
      return result;
    }, name);
  }) as R;
}

export function compareFieldNames(firstFieldName: string, secondFieldName: string) {
  function normalizeFieldName(fieldName: string): string {
    /**
     * Convert array indexes in square brackets to dot notation for easy comparison
     * Example: array[0].firstName => array.0.firstName
     */
    return fieldName.replace(/\[(\d+)\]/g, '.$1');
  }

  // Compare the normalized field names
  return normalizeFieldName(firstFieldName) === normalizeFieldName(secondFieldName);
}

// TODO: In coming feature
export const executeWhenCondition = (
  deps: any[] | undefined,
  condition: WhenConditionConfigs
): boolean => {
  return false;
};

export const generateValidationMethods = ({
  formMethods,
  componentInstance,
  parentPaths,
  validationMethods,
}: {
  formMethods: UseFormReturn;
  parentPaths: ParentPath[];
  componentInstance: ComponentInstance;
  validationMethods: ValidationMethods;
}) =>
  Object.entries(validationMethods).reduce((result, [methodName, validator]) => {
    if (validator) {
      result = {
        ...result,
        [methodName]: (fieldValue: unknown, formValues: Record<string, unknown>) => {
          if (typeof validator.__config === 'boolean') {
            return validator({
              fieldValue,
              formValues,
              componentInstance,
            });
          }

          const dependentFieldValues = validator.__config?.when?.dependsOn.length
            ? formMethods.getValues(
                resolveArrayIndexesForFieldName(parentPaths, validator.__config.when.dependsOn)
              )
            : undefined;

          if (
            validator.__config.when?.conditions &&
            executeWhenCondition(dependentFieldValues, validator.__config.when.conditions)
          )
            return true;

          return validator({
            fieldValue,
            formValues,
            componentInstance,
            dependentFieldValues,
            message: validator.__config.message,
            params: validator.__config.params,
          });
        },
      };
    }

    return result;
  }, {});

export const generateActions = ({
  eventActionMethods,
  componentInstance,
}: {
  eventActionMethods: EventActionMethods;
  componentInstance: ComponentInstance;
}) => {
  const executeActions = (event: SyntheticEvent, methods: ActionMethods) => {
    Object.values(methods).forEach((method) => {
      method?.({
        event,
        componentInstance,
      });
    });
  };

  return Object.entries(eventActionMethods).reduce(
    (result, [key, method]) => ({
      ...result,
      [key]: method ? (event: React.SyntheticEvent) => executeActions(event, method) : undefined,
    }),
    {} as Record<keyof EventActionMethods, (event: React.SyntheticEvent) => void>
  );
};

export const updateAndCompareDependencies = ({
  values,
  depConfigs: depsConfigs,
  prevDepValues,
}: {
  depConfigs: string[];
  values: Record<string, any>;
  prevDepValues: any[];
}) => {
  let isDifference = false;
  const newDepValues = (depsConfigs ?? []).reduce(
    (deps, key) => deps.concat(get(values, key)),
    [] as any[]
  );

  isDifference = (prevDepValues ?? []).some((pd, index) => pd !== newDepValues[index]);

  return {
    isDifference,
    prevValues: prevDepValues,
    newValues: isDifference ? newDepValues : prevDepValues,
  };
};
