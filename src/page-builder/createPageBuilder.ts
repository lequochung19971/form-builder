import { produce } from 'immer';
import { get, merge, set } from 'lodash';
import { createFieldArray } from './createFieldArray';
import {
  ComponentConfig,
  ComponentControl,
  ComponentInstance,
  CState,
  ParentPath,
  PartialComponentInstance,
  VisibilityConfig,
} from './types';
import { isDataArrayComponent, isFormComponent, isUIContainerComponent } from './utils';
import { createFormControl } from '@/form/logic/createFormControl';
import createSubject, { Subject } from '@/form/utils/createSubject';

export const createMappedFieldNameForValues = (
  current: string,
  parentPaths = [] as ParentPath[]
) => {
  const parentName = parentPaths.reduce((result, path) => {
    if (!path.name) return result;

    if (result) {
      result =
        typeof path.index === 'number'
          ? `${result}.${path.name}[${path.index}]`
          : `${result}.${path.name}`;
    } else {
      result = typeof path.index === 'number' ? `${path.name}[${path.index}]` : path.name!;
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

export type ComponentInstancesNextArgs = {
  componentName?: string;
  subscribeAll?: boolean;
  componentInstances: Record<string, ComponentInstance>;
};

type ComponentInstancesSubject = Subject<ComponentInstancesNextArgs>;

export type PageBuilderControl = {
  _setComponentInstance: (componentName: string, updatedInstance: PartialComponentInstance) => void;
  _getComponentInstances: (
    componentName: string | string[]
  ) => ComponentInstance | ComponentInstance[];
  _forceSubscribe: () => void;
  subjects: {
    instances: ComponentInstancesSubject;
  };
  get componentInstances(): Record<string, ComponentInstance>;
};

export const createPageBuilder = (args: {
  componentConfigs: ComponentConfig[];
}): PageBuilderControl => {
  const { componentConfigs } = args;

  let _componentInstances = {} as Record<string, ComponentInstance>;

  const _subjects = {
    instances: createSubject<ComponentInstancesNextArgs>(),
  };

  const setComponentInstances = (instances: Record<string, ComponentInstance>) => {
    _componentInstances = instances;
    // _subjects.instances.next({
    //   componentInstances: _componentInstances,
    // });
  };

  const _forceSubscribe = () => {
    _subjects.instances.next({
      subscribeAll: true,
      componentInstances: _componentInstances,
    });
  };

  const _setComponentInstance = (
    componentName: string,
    updatedInstance: PartialComponentInstance
  ) => {
    const result = produce(_componentInstances, (draft) => {
      const prevComponentInstance = get(draft, componentName) ?? {};

      const newComponentInstance = merge(prevComponentInstance, updatedInstance);

      set(draft, componentName, newComponentInstance);
    });
    _subjects.instances.next({
      componentName,
      componentInstances: result,
    });
    setComponentInstances(result);
  };
  const _getComponentInstances = (
    componentName: string | string[]
  ): ComponentInstance | ComponentInstance[] => {
    if (Array.isArray(componentName)) {
      return componentName.reduce((result, n) => {
        if (get(_componentInstances, n)) {
          result.push(get(_componentInstances, n));
        }

        return result;
      }, [] as ComponentInstance[]);
    }

    return get(_componentInstances, componentName);
  };

  const getComponentStates = (
    comInstances: Record<string, ComponentInstance>,
    name: string | string[]
  ): CState | CState[] => {
    if (Array.isArray(name)) {
      return name.reduce((result, n) => {
        if (get(comInstances, n)) {
          result.push(get(comInstances, n) as unknown as CState);
        }

        return result;
      }, [] as CState[]);
    }

    return get(comInstances, name) as unknown as CState;
  };

  const getDisabledWatchKeys = (disabledConfig: VisibilityConfig['disabled']) => {
    const valuesWatchConfig =
      typeof disabledConfig !== 'boolean' ? disabledConfig?.watch?.values ?? [] : [];
    const componentStatesWatchConfig =
      typeof disabledConfig !== 'boolean' ? disabledConfig?.watch?.states ?? [] : [];

    const valuesWatchKeys = (() => {
      const watchKeys: string[] | string = valuesWatchConfig;

      if (typeof watchKeys === 'string') return [watchKeys];

      return watchKeys;
    })();

    const statesWatchKeys = (() => {
      const watchKeys: string[] | string = componentStatesWatchConfig;

      if (typeof watchKeys === 'string') return [watchKeys];

      return watchKeys;
    })();

    return {
      valuesWatchKeys: valuesWatchKeys,
      statesWatchKeys: statesWatchKeys,
    };
  };

  /**
   * @description This function will create component instances from component configurations, it will mutate the `result` params is passed from outside
   */
  const createComponentInstances = (
    componentConfigs: ComponentConfig[],
    result: Record<string, ComponentInstance>,
    parentPaths = [] as ParentPath[]
  ) => {
    componentConfigs.forEach((comConfig) => {
      const { mappedComponentInstanceName } = createMappedFieldNameForComponentInstances(
        comConfig.componentName,
        parentPaths
      );
      const neededComponentStateProperties: CState = {
        componentName: comConfig.componentName,
        name: comConfig.name,
        type: comConfig.type,
        disabled: false,
        hidden: false,
      };

      const basicComponentControl: ComponentControl = {
        getCurrent: () => _getComponentInstances(mappedComponentInstanceName) as ComponentInstance,
        getParents: () => {
          let step: string;
          const result: ComponentInstance[] = [];
          parentPaths?.forEach((path) => {
            const instance: ComponentInstance = _getComponentInstances(
              step ? `${step}.${path.componentName}` : path.componentName
            ) as ComponentInstance;

            if (instance) result.push(instance);

            // next step
            if (step) {
              step =
                typeof path.index === 'number'
                  ? `${step}.${path.name}.__children[${path.index}]`
                  : `${step}.${path.name}.__children`;
            } else {
              step =
                typeof path.index === 'number'
                  ? `${path.name}.__children[${path.index}]`
                  : `${path.name}.__children`;
            }
          });

          return result;
        },
        getFormControl: () => {
          const formComponent = parentPaths.find((p) => isFormComponent(p.type));
          if (formComponent) {
            const parentPathsToFormComponentPosition = [] as ParentPath[];
            for (const path of parentPaths) {
              if (isFormComponent(path.type)) {
                break;
              }
              parentPathsToFormComponentPosition.push(path);
            }
            const { mappedComponentInstanceName: mappedFormComponentInstanceName } =
              createMappedFieldNameForComponentInstances(
                formComponent.componentName,
                parentPathsToFormComponentPosition
              );
            const formComponentInstance = _getComponentInstances(
              mappedFormComponentInstanceName
            ) as ComponentInstance;

            return formComponentInstance?.__formControl;
          }
        },
        getComponentInstances: _getComponentInstances,
        setComponentInstance: _setComponentInstance,
        setComponentInstances,
      };

      const __formControl = isFormComponent(comConfig.type)
        ? createFormControl({
            mode: 'all',
          })
        : undefined;

      if (isUIContainerComponent(comConfig.type)) {
        set(result, mappedComponentInstanceName, {
          __state: neededComponentStateProperties,
          componentConfig: comConfig,
          __formControl,
          __control: basicComponentControl,
        } as ComponentInstance);

        if (comConfig.components?.length) {
          createComponentInstances(
            comConfig.components,
            result,
            parentPaths.concat({
              id: comConfig.id,
              type: comConfig.type,
              name: comConfig.name,
              componentName: comConfig.componentName,
            })
          );
        }
      } else if (isDataArrayComponent(comConfig.type)) {
        const formComponent = parentPaths.find((p) => isFormComponent(p.type));

        if (formComponent) {
          const parentPathsToFormComponentPosition = [] as ParentPath[];
          for (const path of parentPaths) {
            if (isFormComponent(path.type)) {
              break;
            }
            parentPathsToFormComponentPosition.push(path);
          }
          const { mappedComponentInstanceName: mappedFormComponentInstanceName } =
            createMappedFieldNameForComponentInstances(
              formComponent.componentName,
              parentPathsToFormComponentPosition
            );
          const formComponentInstance = get(_componentInstances, mappedFormComponentInstanceName);

          const { mappedFieldValueName } = createMappedFieldNameForValues(
            comConfig.name!,
            parentPaths
          );
          const { getValues, control, reset } = formComponentInstance.__formControl!;
          // Init defaultValue
          reset(set(getValues() ?? {}, mappedFieldValueName, comConfig.defaultValue));

          const arrayField = createFieldArray({
            name: mappedFieldValueName,
            control: control,
          });
          const arrayComponentControl = {
            ...basicComponentControl,
            append: (value) => {
              arrayField.append(value);
              const result = produce(_componentInstances, (draft) => {
                const currentArrayInstance = get(draft, mappedComponentInstanceName);
                const paths =
                  currentArrayInstance.parentPaths?.concat?.([
                    {
                      id: comConfig.id,
                      type: comConfig.type,
                      name: comConfig.name,
                      componentName: comConfig.componentName,
                      index: (currentArrayInstance.__children?.length as number) ?? 0,
                    },
                  ]) ?? [];
                createComponentInstances(
                  comConfig.components ?? [],
                  draft as Record<string, ComponentInstance>,
                  paths
                );
              });
              _subjects.instances.next({
                componentName: mappedComponentInstanceName,
                componentInstances: result,
              });
              setComponentInstances(result);
            },
            // TODO: will handle remove, insert, ... later
          } as ComponentControl;
          set(result, mappedComponentInstanceName, {
            __state: neededComponentStateProperties,
            componentConfig: comConfig,
            __control: arrayComponentControl,
          } as ComponentInstance);

          const value: Record<string, any>[] | undefined = getValues(mappedFieldValueName);
          if (value?.length && comConfig.components?.length) {
            value.forEach((_, index) =>
              createComponentInstances(
                comConfig.components ?? [],
                result,
                parentPaths.concat({
                  id: comConfig.id,
                  type: comConfig.type,
                  componentName: comConfig.componentName,
                  name: comConfig.name,
                  index: index,
                })
              )
            );
          }
        } else {
          console.error('Need FORM wrap outside');
        }
      } else {
        set(result, mappedComponentInstanceName, {
          __state: neededComponentStateProperties,
          componentConfig: comConfig,
          parentPaths,
          __formControl,
          __control: basicComponentControl,
        } as ComponentInstance);
      }
    });
  };

  createComponentInstances(componentConfigs, _componentInstances, []);
  setComponentInstances(_componentInstances);
  console.log(_componentInstances);

  return {
    _setComponentInstance,
    _getComponentInstances,
    _forceSubscribe,
    get subjects() {
      return _subjects;
    },
    get componentInstances() {
      return _componentInstances;
    },
  };
};
