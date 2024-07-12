import { cloneDeep, get, isEqual, isNil, isNumber, merge, set } from 'lodash';
import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FieldValues,
  FormProvider,
  InternalFieldName,
  UseFormReturn,
  useController,
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import { useDeepCompareMemoize } from '../../hooks/useDeepCompareMemoize';
import { AllComponentProps, configuredComponents } from './controllers';
import {
  CState,
  ComponentArrayControl,
  ComponentConfig,
  ComponentControl,
  ComponentInstance,
  ComponentType,
  FormBuilderControl,
  ParentPath,
  PartialComponentInstance,
  VisibilityConfig,
} from './types';
import { css } from '@emotion/react';
import { produce } from 'immer';
import { createFieldArray } from './createFieldArray';
import { useSubscribe } from '../../hooks/useSubscribe';
import { v4 as uuidV4 } from 'uuid';

function arrayToObjectByKeys<TResult extends object = object>(arr: any[], keys: string[]) {
  return keys.reduce((res, dep, index) => {
    return {
      ...res,
      [dep]: arr[index],
    };
  }, {} as TResult);
}

const createMappedFieldNameForValues = (current: string, parentPaths = [] as ParentPath[]) => {
  const parentName = parentPaths.reduce((result, path) => {
    if (result) {
      result =
        typeof path.index === 'number'
          ? `${result}.${path.name}[${path.index}]`
          : `${result}.${path.name}`;
    } else {
      result = typeof path.index === 'number' ? `${path.name}[${path.index}]` : path.name;
    }
    return result;
  }, '');
  return {
    mappedParentFieldValueName: parentName,
    mappedFieldValueName: parentName ? `${parentName}.${current}` : current,
  };
};

const createMappedFieldNameForComponentInstances = (
  current: string,
  parentPaths = [] as ParentPath[]
) => {
  const parentName = parentPaths.reduce((result, path, index) => {
    result = result ? `${result}.${path.name}` : path.name;

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

const createFormBuilder = (args: {
  componentConfigs: ComponentConfig[];
  form: UseFormReturn<FieldValues, any, FieldValues>;
}) => {
  const { componentConfigs, form } = args;
  let _componentInstances = init(componentConfigs, form);
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
      args.componentConfig.name,
      args.parentPaths
    );

    const { mappedFieldValueName } = createMappedFieldNameForValues(
      args.componentConfig.name,
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
      generateInnerComponentInstances: (arrayFields) => {
        if (arrayFields.length) {
          const result = produce(_componentInstances, (draft) => {
            const currentArrayInstance = get(draft, mappedComponentInstanceName);

            Array(arrayFields.length)
              .fill(0)
              .map((_, index) => {
                const paths =
                  currentArrayInstance.parentPaths?.concat?.([
                    {
                      name: args.componentConfig.name,
                      index,
                    },
                  ]) ?? [];
                const newComponentsInstances = init(
                  args.componentConfig.innerComponents ?? [],
                  form,
                  paths
                );
                set(
                  draft,
                  `${mappedComponentInstanceName}.__children[${index}]`,
                  newComponentsInstances
                );
                run(
                  args.componentConfig.innerComponents as ComponentConfig[],
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
                name: args.componentConfig.name,
                index: (currentArrayInstance.__children?.length as number) ?? 0,
              },
            ]) ?? [];
          const newComponentsInstances = init(args.componentConfig.innerComponents ?? [], form, []);

          set(
            draft,
            `${mappedComponentInstanceName}.__children[${
              currentArrayInstance.__children?.length ?? 0
            }]`,
            newComponentsInstances
          );

          run(
            args.componentConfig.innerComponents ?? [],
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
            step ? `${step}.${path.name}` : path.name
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
      Array.isArray(args.componentConfig.innerComponents) &&
      Array.isArray(currentInstance.__children)
    ) {
      currentInstance.__children.forEach((_, index) => {
        run(
          args.componentConfig.innerComponents as ComponentConfig[],
          args.componentInstances,
          args.parentPaths.concat({
            name: args.componentConfig.name,
            index,
          })
        );
      });
    }
  };

  const runObject = (args: RunArgs) => {
    const { mappedComponentInstanceName } = createMappedFieldNameForComponentInstances(
      args.componentConfig.name,
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
            step ? `${step}.${path.name}` : path.name
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
        name: args.componentConfig.name,
      })
    );
  };
  const runPrimitive = (args: RunArgs) => {
    const { mappedComponentInstanceName } = createMappedFieldNameForComponentInstances(
      args.componentConfig.name,
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
            step ? `${step}.${path.name}` : path.name
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

const useFormBuilder = (props: {
  componentConfigs: ComponentConfig[];
  form: UseFormReturn<FieldValues, any, FieldValues>;
}) => {
  const formBuilderControl = useRef(createFormBuilder(props));
  const [componentInstances, setComponentInstances] = useState(
    formBuilderControl.current._componentInstances
  );

  useEffect(() => {
    if (!formBuilderControl.current) return;

    const observer = (instances: Record<string, ComponentInstance>) => {
      setComponentInstances(instances);
    };
    formBuilderControl.current.watch(observer);
  }, []);

  return {
    componentInstances,
    setComponentInstances: formBuilderControl.current.setComponentInstances,
    setComponentInstance: formBuilderControl.current.setComponentInstance,
    getComponentInstances: formBuilderControl.current.getComponentInstances,
  };
};

const init = (
  componentConfigs: ComponentConfig[],
  form: UseFormReturn<FieldValues, any, FieldValues>,
  parentPaths = [] as ParentPath[]
) => {
  const result = {} as Record<string, ComponentInstance>;
  componentConfigs.forEach((comConfig) => {
    const { mappedFieldValueName } = createMappedFieldNameForValues(comConfig.name, parentPaths);

    const { getValues, getFieldState } = form;

    const neededComponentStateProperties: CState = {
      ...(getFieldState(mappedFieldValueName) ?? {}),
      name: comConfig.name,
      type: comConfig.type,
      disabled: false,
      hidden: false,
    };

    if (comConfig.type === ComponentType.OBJECT_CONTAINER && comConfig.components?.length) {
      const children = init(
        comConfig.components,
        form,
        parentPaths.concat({
          name: comConfig.name,
        })
      );

      set(result, comConfig.name, {
        __state: neededComponentStateProperties,
        __children: children,
        componentConfig: comConfig,
      });
      return result;
    }

    if (comConfig.type === ComponentType.ARRAY_CONTAINER && comConfig.innerComponents?.length) {
      const value: Record<string, any>[] | undefined = getValues(mappedFieldValueName);
      let children: Record<string, ComponentInstance>[] | undefined;
      if (value?.length) {
        children = value.reduce<Record<string, ComponentInstance>[]>(
          (res, _, index) =>
            res.concat(
              init(
                comConfig.innerComponents ?? [],
                form,
                parentPaths.concat({
                  name: comConfig.name,
                  index: index,
                })
              )
            ),
          []
        );
      }

      set(result, comConfig.name, {
        __state: neededComponentStateProperties,
        __children: children,
        componentConfig: comConfig,
      });
      return result;
    }

    set(result, comConfig.name, {
      __state: neededComponentStateProperties,
      componentConfig: comConfig,
      parentPaths,
    });
  });
  return result;
};

const generateComponentInstances = (
  componentConfigs: ComponentConfig[],
  form: UseFormReturn<FieldValues, any, FieldValues>,
  mappedParentName = ''
) => {
  const result = {} as Record<string, ComponentInstance>;
  componentConfigs.forEach((comConfig) => {
    const mappedName = mappedParentName ? `${mappedParentName}.${comConfig.name}` : comConfig.name;
    const { getValues, getFieldState } = form;

    const neededComponentStateProperties: CState = {
      ...(getFieldState(mappedName) ?? {}),
      name: comConfig.name,
      type: comConfig.type,
      disabled: false,
      hidden: false,
    };

    set(result, mappedName, {
      __state: neededComponentStateProperties,
      componentConfig: comConfig,
    });

    if (comConfig.type === ComponentType.OBJECT_CONTAINER && comConfig.components?.length) {
      if (mappedName) {
        const states = generateComponentInstances(comConfig.components, form);

        set(result, mappedName, {
          __state: neededComponentStateProperties,
          __children: states,
          componentConfig: comConfig,
        });
      }
      return result;
    }

    if (comConfig.type === ComponentType.ARRAY_CONTAINER && comConfig.innerComponents?.length) {
      const value: Record<string, any>[] | undefined = getValues(mappedName);
      let children: Record<string, ComponentInstance>[] | undefined;
      if (value?.length) {
        children = value.reduce<Record<string, ComponentInstance>[]>(
          (res, _, index) =>
            res.concat(
              generateComponentInstances(
                comConfig.innerComponents ?? [],
                form,
                `${mappedName}[${index}]`
              )
            ),
          []
        );
      }

      set(result, mappedName, {
        __state: neededComponentStateProperties,
        __children: children,
        componentConfig: comConfig,
      });
    }
  });
  return result;
};

type FormBuilderProps = {
  components: ComponentConfig[];
  defaultValues: any;
};
type FormBuilderContextValue = {
  componentInstances: Record<string, ComponentInstance>;
};

const FormBuilderContext = createContext<FormBuilderContextValue>({} as FormBuilderContextValue);
export const useFormBuilderContext = () => useContext(FormBuilderContext);

export type ComponentItemProps = {
  componentConfig: ComponentConfig;
  props?: object;
  parentPaths: ParentPath[];
};

const useWatchComponentStates = (props: {
  componentInstances: Record<string, ComponentInstance>;
  keys: string[];
}) => {
  const { componentInstances, keys } = props;
  const memorizedComponentStates = useRef([] as CState[]);
  const watchedComponentStates = keys.reduce(
    (result, key) =>
      get(componentInstances, key)
        ? result.concat(get(componentInstances, key) as unknown as CState)
        : result,
    [] as CState[]
  );

  const hasChanged =
    !!watchedComponentStates.length &&
    (memorizedComponentStates.current.length !== watchedComponentStates.length ||
      watchedComponentStates.some((cs, index) => cs !== memorizedComponentStates.current[index]));

  if (hasChanged) {
    memorizedComponentStates.current = watchedComponentStates;
  }
  return memorizedComponentStates.current;
};

export const useArrayComponent = (props: ComponentItemProps) => {
  const { componentConfig, parentPaths: parentPaths } = props;

  const { validations: validations = {} } = componentConfig;

  const form = useFormContext();
  const { control } = form;

  const { componentInstances } = useFormBuilderContext();
  const { mappedFieldValueName } = createMappedFieldNameForValues(
    componentConfig.name,
    parentPaths
  );

  const { mappedComponentInstanceName } = createMappedFieldNameForComponentInstances(
    componentConfig.name,
    parentPaths
  );
  const componentInstance = useMemo(
    () => get(componentInstances, mappedComponentInstanceName),
    [componentInstances, mappedComponentInstanceName]
  );
  const componentInstanceRef = useRef(componentInstance);
  componentInstanceRef.current = componentInstance;

  const [fields, setFields] = React.useState(
    control._getFieldArray(mappedFieldValueName) as Record<string, string>[]
  );
  // const ids = React.useRef<string[]>(
  //   control._getFieldArray(mappedFieldValueName).map(() => uuidV4())
  // );
  const _fieldsRef = React.useRef(fields);
  const _name = React.useRef(mappedFieldValueName);
  // const _actioned = React.useRef(false);

  _name.current = mappedFieldValueName;
  _fieldsRef.current = fields;
  control._names.array.add(mappedFieldValueName);

  // props.rules &&
  //   (control as Control<TFieldValues>).register(
  //     name as FieldPath<TFieldValues>,
  //     props.rules as RegisterOptions<TFieldValues>,
  //   );

  const observer = (updateFields: Record<string, string>[]) => {
    // componentInstance.__control = {
    //   ...componentInstance.__control,
    //   fields: cloneDeep(updateFields),
    // };
    // componentInstanceRef.current.__control.fields = cloneDeep(updateFields);
    setFields([...updateFields]);
  };
  const observerRef = useRef(observer);
  observerRef.current = observer;

  React.useEffect(() => {
    const reference = componentInstance.__control.watchFields?.((...args) =>
      observerRef.current(...args)
    );
    return () => {
      reference?.unwatch();
    };
  }, [componentInstance]);

  useEffect(() => {
    return () => {
      console.log('unmount', mappedComponentInstanceName);
    };
  }, [mappedComponentInstanceName]);

  useSubscribe({
    next: ({
      values,
      name: fieldArrayName,
    }: {
      values?: FieldValues;
      name?: InternalFieldName;
    }) => {
      if (fieldArrayName === mappedFieldValueName || !fieldArrayName) {
        const fieldValues = get(values, mappedFieldValueName);
        if (Array.isArray(fieldValues)) {
          // console.log(componentInstances);
          // componentInstance.__control.ids = fieldValues.map(() => uuidV4());
          // componentInstance.__control.fields = fieldValues.map((field, index) => ({
          //   ...field,
          //   ['id']: componentInstance.__control.ids?.[index] || uuidV4(),
          // }));
          // setFields(componentInstance.__control.fields);
          componentInstance.__control.generateInnerComponentInstances?.(fieldValues);
        }
      }
    },
    subject: control._subjects.array,
  });

  React.useEffect(() => {
    componentInstance.__control.updateFormState?.();
    console.log(mappedFieldValueName);
    componentInstance.__control.logPrivateVars?.();
  }, [fields, control, componentInstance.__control]);

  const validate = useMemo(
    () =>
      Object.entries(validations).reduce((result, [key, v]) => {
        result = {
          ...result,
          [key]: (fieldValue: unknown, formValues: Record<string, unknown>) =>
            v(fieldValue, formValues, componentInstance.__control),
        };
        return result;
      }, {}),
    [validations, componentInstance.__control]
  );

  validate &&
    control.register(mappedFieldValueName, {
      validate,
    });
  // console.log(
  //   mappedFieldValueName,
  //   'componentInstance.__control._ids',
  //   componentInstance.__control.ids,
  //   componentInstance.__control.fields
  // );

  return {
    fields,
    mappedComponentInstanceName,
    mappedFieldValueName,
    parentPaths: parentPaths,
    componentInstance: componentInstance,
    components: componentInstance.__children as Record<string, ComponentInstance>[],
  };
};

export const useComponent = (props: ComponentItemProps) => {
  const { componentConfig, parentPaths: parentPaths } = props;

  const { actions: actions = {}, validations: validations = {} } = componentConfig;
  const { change, click, blur } = actions;

  const form = useFormContext();
  const { control } = form;

  const { componentInstances: componentInstances } = useFormBuilderContext();

  const { mappedFieldValueName } = createMappedFieldNameForValues(
    componentConfig.name,
    parentPaths
  );

  const { mappedComponentInstanceName } = createMappedFieldNameForComponentInstances(
    componentConfig.name,
    parentPaths
  );

  const componentInstance = useMemo(
    () => get(componentInstances, mappedComponentInstanceName),
    [componentInstances, mappedComponentInstanceName]
  );

  if (!componentInstance) {
    throw new Error(`There is no componentInstance: ${mappedComponentInstanceName}`);
  }

  const validate = useMemo(
    () =>
      Object.entries(validations).reduce((result, [key, v]) => {
        result = {
          ...result,
          [key]: (fieldValue: unknown, formValues: Record<string, unknown>) =>
            v(fieldValue, formValues, componentInstance.__control),
        };
        return result;
      }, {}),
    [validations, componentInstance.__control]
  );

  const controller = useController({
    control,
    name: mappedFieldValueName,
    rules: {
      validate,
    },
  });

  const { field, fieldState } = controller;
  const memorizedFieldState = useDeepCompareMemoize(fieldState);

  const disabledWatches = useMemo(() => {
    const valuesWatchConfig =
      typeof componentConfig.visibility?.disabled !== 'boolean'
        ? componentConfig.visibility?.disabled?.watch?.values ?? []
        : [];
    const componentStatesWatchConfig =
      typeof componentConfig.visibility?.disabled !== 'boolean'
        ? componentConfig.visibility?.disabled?.watch?.states ?? []
        : [];

    const valuesWatchKeys = (() => {
      const watchKeys: string[] | string = valuesWatchConfig;
      // if (typeof valuesWatchConfig === 'function') {
      //   watchKeys = valuesWatchConfig({
      //     index,
      //     parentName,
      //   });
      // } else {
      //   watchKeys = valuesWatchConfig;
      // }

      if (typeof watchKeys === 'string') return [watchKeys];

      return watchKeys;
    })();

    const statesWatchKeys = (() => {
      const watchKeys: string[] | string = componentStatesWatchConfig;
      // if (typeof componentStatesWatchConfig === 'function') {
      //   watchKeys = componentStatesWatchConfig({
      //     index,
      //     parentName,
      //   });
      // } else {
      //   watchKeys = componentStatesWatchConfig;
      // }

      if (typeof watchKeys === 'string') return [watchKeys];

      return watchKeys;
    })();

    return {
      valuesWatchKeys: valuesWatchKeys,
      statesWatchKeys: statesWatchKeys,
    };
  }, [componentConfig.visibility?.disabled]);

  const valuesWatchKeys = useMemo(
    () => Array.from(new Set(disabledWatches.valuesWatchKeys)),
    [disabledWatches.valuesWatchKeys]
  );

  const statesWatchKeys = useMemo(
    () => Array.from(new Set(disabledWatches.statesWatchKeys)),
    [disabledWatches.statesWatchKeys]
  );

  const statesWatches = useWatchComponentStates({
    componentInstances: componentInstances,
    keys: statesWatchKeys,
  });

  const valuesWatches = useWatch({
    control,
    name: valuesWatchKeys,
  });

  // Visibility
  const disabledResult = useMemo(
    () =>
      typeof componentConfig.visibility?.disabled !== 'boolean'
        ? componentConfig.visibility?.disabled?.method({
            control: componentInstance.__control,
            watches: {
              states: statesWatches,
              values: valuesWatches,
            },
          })
        : componentConfig.visibility?.disabled,
    [
      componentConfig.visibility?.disabled,
      componentInstance.__control,
      statesWatches,
      valuesWatches,
    ]
  );

  useEffect(() => {
    if (typeof disabledResult !== 'boolean') return;

    const neededComponentState = {
      ...(memorizedFieldState ?? {}),
      disabled: disabledResult,
    };

    componentInstance.__control.setComponentInstance(mappedComponentInstanceName, {
      __state: neededComponentState,
    });
  }, [
    disabledResult,
    mappedComponentInstanceName,
    componentConfig.type,
    memorizedFieldState,
    componentInstance.__control,
  ]);

  // Actions
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLElement>) => {
      field.onChange(e);
      change?.({
        event: e,
        control: componentInstance.__control,
      });
    },
    [field, change, componentInstance.__control]
  );

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
      click?.({
        event: e,
        control: componentInstance.__control,
      });
    },
    [click, componentInstance.__control]
  );

  const onBlur = useCallback(
    (e: React.FocusEvent<HTMLElement, Element>) => {
      field.onBlur();
      blur?.({
        event: e,
        control: componentInstance.__control,
      });
    },
    [blur, componentInstance.__control, field]
  );

  return {
    component: {
      onChange,
      onClick,
      onBlur,
      value: field.value,
      mappedComponentInstanceName,
      mappedFieldValueName,
    },
    componentInstance: componentInstance,
    parentPaths: parentPaths,
  };
};

export const ComponentItem: React.FunctionComponent<ComponentItemProps> = memo((props) => {
  const { componentConfig, parentPaths: parentPaths } = props;

  const ComponentController = configuredComponents[
    componentConfig.type
  ] as React.FunctionComponent<AllComponentProps>;

  return <ComponentController componentConfig={componentConfig} parentPaths={parentPaths} />;
});

export const FormBuilder: React.FunctionComponent<FormBuilderProps> = (props) => {
  const { components, defaultValues } = props;

  const form = useForm({
    defaultValues,
    mode: 'all',
  }) as UseFormReturn<FieldValues, any, FieldValues>;
  console.log('watch', form.getValues('array[0].object.secondArray'));

  const formBuilder = useFormBuilder({
    form,
    componentConfigs: components,
  });

  // const setComponentInstance = (name: string, instance: PartialComponentInstance) => {
  //   setComponentInstances?.((prev) => {
  //     return produce(prev, (draft) => {
  //       const prevComponentInstance = get(draft, name) ?? {};

  //       const newComponentInstance = merge(prevComponentInstance, instance);

  //       set(draft, name, newComponentInstance);
  //     });
  //   });
  // };

  // const getComponentInstances = useCallback(
  //   (name: string | string[]): ComponentInstance | ComponentInstance[] => {
  //     if (Array.isArray(name)) {
  //       return name.reduce((result, n) => {
  //         if (get(componentInstances, n)) {
  //           result.concat(get(componentInstances, n));
  //         }

  //         return result;
  //       }, [] as ComponentInstance[]);
  //     }

  //     return get(componentInstances, name);
  //   },
  //   [componentInstances]
  // );

  // const formBuilderControl = useMemo<FormBuilderControl>(() => {
  //   return {
  //     getForm: () => form,
  //     getComponentInstances: formBuilder.getComponentInstances,
  //     setComponentInstance: formBuilder.setComponentInstances,
  //     setComponentInstances: formBuilder.setComponentInstance,
  //   } as unknown as FormBuilderControl;
  // }, [
  //   form,
  //   formBuilder.getComponentInstances,
  //   formBuilder.setComponentInstance,
  //   formBuilder.setComponentInstances,
  // ]);

  // const memorizedFormBuilder = useRef<FormBuilderControl>(formBuilderControl);

  // memorizedFormBuilder.current.getForm = formBuilderControl.getForm;
  // memorizedFormBuilder.current.getComponentInstances = formBuilderControl.getComponentInstances;
  // memorizedFormBuilder.current.setComponentInstance = formBuilderControl.setComponentInstance;
  // memorizedFormBuilder.current.setComponentInstances = formBuilderControl.setComponentInstances;

  return (
    <FormProvider {...form}>
      <FormBuilderContext.Provider
        value={useMemo(
          () => ({
            componentInstances: formBuilder.componentInstances,
          }),
          [formBuilder.componentInstances]
        )}>
        <form
          css={css`
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
          `}>
          {formBuilder.componentInstances &&
            components.map((component) => (
              <ComponentItem key={component.id} componentConfig={component} parentPaths={[]} />
            ))}
        </form>
      </FormBuilderContext.Provider>
    </FormProvider>
  );
};
