import convertToArrayPayload from '@/utils/convertToArrayPayload';
import { isUndefined } from 'lodash';
import { ComponentType, ParentPath } from './types';

export const isFormFieldComponent = (type: ComponentType) => {
  return [
    ComponentType.INPUT_FIELD,
    ComponentType.ARRAY_CONTAINER,
    ComponentType.OBJECT_CONTAINER,
    ComponentType.DATA_TABLE,
  ].includes(type);
};

export const isUIComponent = (type: ComponentType) => {
  return [
    ComponentType.INPUT,
    ComponentType.CONTAINER,
    ComponentType.FORM,
    ComponentType.BUTTON,
    ComponentType.TABS,
    ComponentType.TAB,
  ].includes(type);
};

export const isUIContainerComponent = (type: ComponentType) => {
  return [
    ComponentType.CONTAINER,
    ComponentType.FORM,
    ComponentType.TABS,
    ComponentType.TAB,
  ].includes(type);
};

export const isArrayFieldComponent = (type: ComponentType) => {
  return [ComponentType.ARRAY_CONTAINER, ComponentType.DATA_TABLE].includes(type);
};

export const isObjectFieldComponent = (type: ComponentType) => {
  return [ComponentType.OBJECT_CONTAINER].includes(type);
};

export const isFormComponent = (type: ComponentType) => {
  return [ComponentType.FORM].includes(type);
};

export const createMappedFieldNameForValues = (
  current: string,
  parentPaths = [] as ParentPath[]
) => {
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
    mappedParentFieldValueName: parentName,
    mappedFieldValueName: parentName ? `${parentName}.${current}` : current,
  };
};

export const createMappedFieldNameForComponentInstances = (
  current: string,
  parentPaths = [] as ParentPath[]
) => {
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
      mappedParentComponentInstanceName: undefined,
      mappedComponentInstanceName: current,
    };
  }

  const lastPath = parentPaths[parentPaths.length - 1];

  return {
    mappedParentComponentInstanceName: parentName,
    mappedComponentInstanceName:
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
