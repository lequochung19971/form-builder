import { produce } from 'immer';
import { get, merge, set, cloneDeep } from 'lodash';
import { UseFormReturn, FieldValues } from 'react-hook-form';
import { createFieldArray } from './createFieldArray';
import {
  ComponentConfig,
  ComponentInstance,
  PartialComponentInstance,
  CState,
  VisibilityConfig,
  ParentPath,
  ComponentControl,
  ComponentType,
} from './types';
import { isFormComponent, isUIComponent } from './utils';
import { createFormControl } from '@/logic/createFormControl';

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

export const init = (
  componentConfigs: ComponentConfig[],
  parentPaths = [] as ParentPath[],
  result = {} as Record<string, ComponentInstance>
) => {
  componentConfigs.forEach((comConfig) => {
    const { mappedComponentInstanceName } = createMappedFieldNameForComponentInstances(
      comConfig.componentName,
      parentPaths
    );
    const neededComponentStateProperties: CState = {
      // ...(getFieldState(mappedFieldValueName) ?? {}),
      componentName: comConfig.componentName,
      name: comConfig.name,
      type: comConfig.type,
      disabled: false,
      hidden: false,
    };

    const __formControl = isFormComponent(comConfig.type)
      ? createFormControl({
          mode: 'all',
        })
      : undefined;

    if (comConfig.components?.length && isUIComponent(comConfig.type)) {
      set(result, mappedComponentInstanceName, {
        __state: neededComponentStateProperties,
        componentConfig: comConfig,
        __formControl,
      });
      init(
        comConfig.components,
        parentPaths.concat({
          id: comConfig.id,
          type: comConfig.type,
          name: comConfig.name,
          componentName: comConfig.componentName,
        }),
        result
      );

      return result;
    } else if (comConfig.type === ComponentType.ARRAY_CONTAINER && comConfig.components?.length) {
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
        const formComponentInstance = get(result, mappedFormComponentInstanceName);

        const { mappedFieldValueName } = createMappedFieldNameForValues(
          comConfig.name!,
          parentPaths
        );
        const { getValues } = formComponentInstance.__formControl!;

        const value: Record<string, any>[] | undefined = getValues(mappedFieldValueName);
        if (value?.length) {
          set(result, mappedComponentInstanceName, {
            __state: neededComponentStateProperties,
            componentConfig: comConfig,
          });

          value.forEach((_, index) =>
            init(
              comConfig.components ?? [],
              parentPaths.concat({
                id: comConfig.id,
                type: comConfig.type,
                componentName: comConfig.componentName,
                name: comConfig.name,
                index: index,
              }),
              result
            )
          );
        }

        return result;
      } else {
        console.error('Need FORM wrap outside');
      }
    } else {
      set(result, mappedComponentInstanceName, {
        __state: neededComponentStateProperties,
        componentConfig: comConfig,
        parentPaths,
        __formControl,
      });
    }
  });
};

export const createPageBuilder = (args: {
  componentConfigs: ComponentConfig[];
  form: UseFormReturn<FieldValues, any, FieldValues>;
}) => {
  const { componentConfigs, form } = args;
  let _componentInstances = {} as Record<string, ComponentInstance>;
  init(componentConfigs, [], _componentInstances);
  type Observer = (componentInstances: Record<string, ComponentInstance>) => void;
  let observers = [] as Observer[];

  const watch = (observer: Observer) => {
    observers.push(observer);
  };

  const unwatch = (observer: Observer) => {
    observers = observers.filter((ob) => ob !== observer);
  };

  const setComponentInstances = (instances: Record<string, ComponentInstance>) => {
    _componentInstances = instances;
    for (const observer of observers) {
      observer(_componentInstances);
    }
  };

  const updateComponentInstance = (
    instances: Record<string, ComponentInstance>,
    name: string,
    updatedInstance: PartialComponentInstance
  ) => {
    return produce(instances, (draft) => {
      const prevComponentInstance = get(draft, name) ?? {};

      const newComponentInstance = merge(prevComponentInstance, updatedInstance);

      set(draft, name, newComponentInstance);
    });
  };

  const mutateComponentInstance = (
    instances: Record<string, ComponentInstance>,
    name: string,
    updatedInstance: PartialComponentInstance
  ) => {
    const prevComponentInstance = get(instances, name) ?? {};

    const newComponentInstance = merge(prevComponentInstance, updatedInstance);

    set(instances, name, newComponentInstance);
  };

  const setComponentInstance = (name: string, updatedInstance: PartialComponentInstance) => {
    _componentInstances = produce(_componentInstances, (draft) => {
      const prevComponentInstance = get(draft, name) ?? {};

      const newComponentInstance = merge(prevComponentInstance, updatedInstance);

      set(draft, name, newComponentInstance);
    });
    setComponentInstances(_componentInstances);
  };
  const getComponentInstances = (
    name: string | string[]
  ): ComponentInstance | ComponentInstance[] => {
    if (Array.isArray(name)) {
      return name.reduce((result, n) => {
        if (get(_componentInstances, n)) {
          result.push(get(_componentInstances, n));
        }

        return result;
      }, [] as ComponentInstance[]);
    }

    return get(_componentInstances, name);
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

  const control = {
    getForm: () => form,
    setComponentInstance,
    getComponentInstances,
    setComponentInstances,
  };

  type RunArgs = {
    componentInstances: Record<string, ComponentInstance>;
    componentConfig: ComponentConfig;
    parentPaths: ParentPath[];
  };

  const runArray = (args: RunArgs) => {
    const { mappedComponentInstanceName } = createMappedFieldNameForComponentInstances(
      args.componentConfig.componentName,
      args.parentPaths
    );

    const { mappedFieldValueName } = createMappedFieldNameForValues(
      args.componentConfig.name!,
      args.parentPaths
    );

    const arrayField = createFieldArray({
      name: mappedFieldValueName,
      control: form.control,
    });

    const watchedStates: CState[] = getComponentStates(
      args.componentInstances,
      getDisabledWatchKeys(args.componentConfig.visibility?.disabled).statesWatchKeys
    ) as CState[];

    const watchedValues: CState[] = form.getValues(
      getDisabledWatchKeys(args.componentConfig.visibility?.disabled).valuesWatchKeys
    );

    const componentControl = {
      ...control,
      ...arrayField,
      setInnerComponentInstances: (arrayFields) => {
        if (arrayFields.length) {
          const currentArrayInstance = get(_componentInstances, mappedComponentInstanceName);
          currentArrayInstance.__control.updateValues?.(arrayFields);
          const result = produce(_componentInstances, (draft) => {
            // const ids = arrayFields.map((f) => f.id) as string[];
            const currentArrayInstance = get(draft, mappedComponentInstanceName);
            // mutateComponentInstance(
            //   draft as Record<string, ComponentInstance>,
            //   mappedComponentInstanceName,
            //   {
            //     __control: {
            //       ...currentArrayInstance.__control,
            //       ids: ids,
            //     },
            //   }
            // );

            Array(arrayFields.length)
              .fill(0)
              .map((_, index) => {
                const paths =
                  currentArrayInstance.parentPaths?.concat?.([
                    {
                      id: args.componentConfig.id,
                      type: args.componentConfig.type,
                      componentName: args.componentConfig.componentName,
                      index,
                    },
                  ]) ?? [];
                const newComponentsInstances = init(args.componentConfig.components ?? [], paths);
                set(
                  draft,
                  `${mappedComponentInstanceName}.__children[${index}]`,
                  newComponentsInstances
                );
                run(
                  args.componentConfig.components as ComponentConfig[],
                  draft as Record<string, ComponentInstance>,
                  paths
                );
              });
          });
          setComponentInstances(result);
        }
      },
      append: (value) => {
        arrayField.append(value);
        const result = produce(_componentInstances, (draft) => {
          const currentArrayInstance = get(draft, mappedComponentInstanceName);
          const paths =
            currentArrayInstance.parentPaths?.concat?.([
              {
                id: args.componentConfig.id,
                type: args.componentConfig.type,
                componentName: args.componentConfig.componentName,
                index: (currentArrayInstance.__children?.length as number) ?? 0,
              },
            ]) ?? [];
          const newComponentsInstances = init(args.componentConfig.components ?? [], []);

          set(
            draft,
            `${mappedComponentInstanceName}.__children[${
              currentArrayInstance.__children?.length ?? 0
            }]`,
            newComponentsInstances
          );

          run(
            args.componentConfig.components ?? [],
            draft as Record<string, ComponentInstance>,
            paths
          );
        });
        setComponentInstances(result);
      },
      remove: (index) => {
        arrayField.append(index);
      },
      getCurrent: () => getComponentInstances(mappedComponentInstanceName) as ComponentInstance,
      getParents: () => {
        let step: string;
        const result: ComponentInstance[] = [];
        args.parentPaths?.forEach((path) => {
          const instance: ComponentInstance = getComponentInstances(
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
    } as ComponentControl;

    // Visibility
    const disabledResult =
      typeof args.componentConfig.visibility?.disabled !== 'boolean'
        ? args.componentConfig.visibility?.disabled?.method({
            control: componentControl as ComponentControl,
            watches: {
              states: watchedStates,
              values: watchedValues,
            },
          })
        : args.componentConfig.visibility?.disabled;

    mutateComponentInstance(args.componentInstances, mappedComponentInstanceName, {
      __state: {
        disabled: !!disabledResult,
      },
      __control: componentControl as ComponentControl,
      parentPaths: args.parentPaths,
    });

    const currentInstance = get(args.componentInstances, mappedComponentInstanceName);

    if (
      Array.isArray(args.componentConfig.components) &&
      Array.isArray(currentInstance.__children)
    ) {
      currentInstance.__children.forEach((_, index) => {
        run(
          args.componentConfig.components as ComponentConfig[],
          args.componentInstances,
          args.parentPaths.concat({
            id: args.componentConfig.id,
            type: args.componentConfig.type,
            componentName: args.componentConfig.componentName,
            index,
          })
        );
      });
    }
  };

  const runObject = (args: RunArgs) => {
    const { mappedComponentInstanceName } = createMappedFieldNameForComponentInstances(
      args.componentConfig.componentName,
      args.parentPaths
    );

    const watchedStates: CState[] = getComponentStates(
      args.componentInstances,
      getDisabledWatchKeys(args.componentConfig.visibility?.disabled).statesWatchKeys
    ) as CState[];

    const watchedValues: CState[] = form.getValues(
      getDisabledWatchKeys(args.componentConfig.visibility?.disabled).valuesWatchKeys
    );

    const componentControl = {
      ...control,
      getCurrent: () => getComponentInstances(mappedComponentInstanceName),
      getParents: () => {
        let step: string;
        const result: ComponentInstance[] = [];
        args.parentPaths?.forEach((path) => {
          const instance: ComponentInstance = getComponentInstances(
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
    };

    // Visibility
    const disabledResult =
      typeof args.componentConfig.visibility?.disabled !== 'boolean'
        ? args.componentConfig.visibility?.disabled?.method({
            control: componentControl as ComponentControl,
            watches: {
              states: watchedStates,
              values: watchedValues,
            },
          })
        : args.componentConfig.visibility?.disabled;

    mutateComponentInstance(args.componentInstances, mappedComponentInstanceName, {
      __state: {
        disabled: !!disabledResult,
      },
      __control: componentControl as ComponentControl,
      parentPaths: args.parentPaths,
    });

    run(
      args.componentConfig.components ?? [],
      args.componentInstances,
      args.parentPaths.concat({
        id: args.componentConfig.id,
        type: args.componentConfig.type,
        name: args.componentConfig.name,
        componentName: args.componentConfig.componentName,
      })
    );
  };
  const runPrimitive = (args: RunArgs) => {
    const { mappedComponentInstanceName } = createMappedFieldNameForComponentInstances(
      args.componentConfig.componentName,
      args.parentPaths
    );

    const componentControl = {
      ...control,
      getCurrent: () => getComponentInstances(mappedComponentInstanceName),
      getParents: () => {
        let step: string;
        const result: ComponentInstance[] = [];
        args.parentPaths?.forEach((path) => {
          const instance: ComponentInstance = getComponentInstances(
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
    };

    const watchedStates: CState[] = getComponentStates(
      args.componentInstances,
      getDisabledWatchKeys(args.componentConfig.visibility?.disabled).statesWatchKeys
    ) as CState[];

    const watchedValues: CState[] = form.getValues(
      getDisabledWatchKeys(args.componentConfig.visibility?.disabled).valuesWatchKeys
    );

    // Visibility
    const disabledResult =
      typeof args.componentConfig.visibility?.disabled !== 'boolean'
        ? args.componentConfig.visibility?.disabled?.method({
            control: componentControl as ComponentControl,
            watches: {
              states: watchedStates,
              values: watchedValues,
            },
          })
        : args.componentConfig.visibility?.disabled;

    mutateComponentInstance(args.componentInstances, mappedComponentInstanceName, {
      __state: {
        disabled: !!disabledResult,
      },
      __control: componentControl as ComponentControl,
      parentPaths: args.parentPaths,
    });
  };

  const run = (
    configs: ComponentConfig[],
    componentInstances: Record<string, ComponentInstance>,
    parentPaths: ParentPath[]
  ) => {
    configs.forEach((config) => {
      if (config.type === ComponentType.ARRAY_CONTAINER) {
        runArray({
          componentInstances: componentInstances,
          componentConfig: config,
          parentPaths,
        });
      } else if (config.type === ComponentType.OBJECT_CONTAINER) {
        runObject({
          componentInstances: componentInstances,
          componentConfig: config,
          parentPaths,
        });
      } else {
        runPrimitive({
          componentInstances: componentInstances,
          componentConfig: config,
          parentPaths,
        });
      }
    });
    return componentInstances;
  };
  const clonedComponentInstances = cloneDeep(_componentInstances);
  const result = run(componentConfigs, clonedComponentInstances, []);
  setComponentInstances(result);

  return {
    ...control,
    watch,
    unwatch,
    _componentInstances,
  };
};
