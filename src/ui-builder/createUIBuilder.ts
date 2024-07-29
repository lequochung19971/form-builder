import { createFieldArray } from '@/form/createFieldArray';
import { createFormControl } from '@/form/logic/createFormControl';
import convertToArrayPayload from '@/utils/convertToArrayPayload';
import createSubject, { Subject } from '@/utils/createSubject';
import move from '@/utils/move';
import { produce } from 'immer';
import { get, isUndefined, merge, set } from 'lodash';
import { DeepPartial } from 'react-hook-form';
import builtInActionMethods from './actionMethods';
import {
  ActionConfigs,
  ActionMethodCreations,
  ActionMethods,
  ArrayFieldComponentInstance,
  BaseComponentProps,
  ComponentConfig,
  ComponentControl,
  ComponentInstance,
  ComponentState,
  EventActionMethods,
  LifecycleActionMethod,
  LifecycleActionMethodCreations,
  LifecycleActionMethods,
  ParentPath,
  PartialComponentInstance,
  ValidationConfig,
  ValidationConfigMethod,
  ValidationMethod,
  ValidationMethodCreations,
  ValidationMethods,
} from './types';
import {
  compareFieldNames,
  createMappedComponentName,
  createMappedFieldName,
  removeAt,
  resolveArrayIndexesForFieldName as resolveArrayIndexes,
} from './utils';
import builtInValidationMethods from './validationMethods';

export type ComponentInstancesNextArgs = {
  componentName?: string;
  subscribeAll?: boolean;
  componentInstances: Record<string, ComponentInstance>;
};

type ComponentInstancesSubject = Subject<ComponentInstancesNextArgs>;

type ValidationDependency = {
  fieldName: string;
  deps: string[];
};
export type UIBuilderControl = {
  /**
   * @caveat
   * - Be careful when using `_setComponentInstance`.
   * - Limit using `_setComponentInstance`, and recommend using `_setComponentProps`, `_updatePartialComponentProps` to update props.
   * - If you want to update component state, recommend using `setComponentState` in each component instance `__control`, don't use `_setComponentInstance` to update `state`, it' not a best practice.
   */
  _setComponentInstance: <TInstance extends ComponentInstance = ComponentInstance>(
    componentName: string,
    updateComponentInstance: TInstance
  ) => void;
  _updatePartialComponentInstance: (
    componentName: string,
    updatedInstance: PartialComponentInstance
  ) => void;
  _updatePartialComponentProps: <TProps extends BaseComponentProps = BaseComponentProps>(
    componentName: string,
    updatedProps: DeepPartial<TProps>
  ) => void;
  _setComponentProps: <TProps extends BaseComponentProps = BaseComponentProps>(
    componentName: string,
    componentProps: TProps | ((prevProps: TProps) => TProps)
  ) => void;
  _getComponentInstances: <
    T extends string | string[],
    R = T extends string[] ? ComponentInstance[] : ComponentInstance
  >(
    componentName: T
  ) => R;
  _forceSubscribe: () => void;
  subjects: {
    instances: ComponentInstancesSubject;
  };
  get componentInstances(): Record<string, ComponentInstance>;
  get validationDependencies(): ValidationDependency[];
  get actionMethods(): ActionMethodCreations;
  get validationMethods(): ValidationMethodCreations;
};

export const createUIBuilder = (args: {
  componentConfigs: ComponentConfig[];
  customActionMethods?: ActionMethodCreations;
  customValidationMethods?: ValidationMethodCreations;
  customLifecycleActionMethodCreations?: LifecycleActionMethodCreations;
}): UIBuilderControl => {
  const {
    componentConfigs,
    customActionMethods = {},
    customValidationMethods = {},
    customLifecycleActionMethodCreations = {},
  } = args;
  const _actionMethods = {
    ...builtInActionMethods,
    ...customActionMethods,
  } as ActionMethodCreations;
  const _validationMethods = {
    ...builtInValidationMethods,
    ...customValidationMethods,
  } as ValidationMethodCreations;
  const _lifecycleActionMethods = {
    ...customLifecycleActionMethodCreations,
  } as LifecycleActionMethodCreations;

  let _componentInstances = {} as Record<string, ComponentInstance>;
  const _validationDependencies = [] as ValidationDependency[];

  const _subjects = {
    instances: createSubject<ComponentInstancesNextArgs>(),
  };

  const setComponentInstances = (instances: Record<string, ComponentInstance>) => {
    _componentInstances = instances;
  };

  const _forceSubscribe = () => {
    _subjects.instances.next({
      subscribeAll: true,
      componentInstances: _componentInstances,
    });
  };

  const _setComponentInstance = <TInstance extends ComponentInstance = ComponentInstance>(
    componentName: string,
    updateComponentInstance: TInstance
  ) => {
    set(_componentInstances, componentName, updateComponentInstance);

    _subjects.instances.next({
      componentName,
      componentInstances: _componentInstances,
    });
    setComponentInstances(_componentInstances);
  };
  const _updatePartialComponentInstance = (
    componentName: string,
    updatedInstance: PartialComponentInstance
  ) => {
    const prevComponentInstance = get(_componentInstances, componentName);
    if (prevComponentInstance) {
      const newComponentInstance = merge(prevComponentInstance, updatedInstance);

      set(_componentInstances, componentName, newComponentInstance);
    }

    _subjects.instances.next({
      componentName,
      componentInstances: _componentInstances,
    });
    setComponentInstances(_componentInstances);
  };
  const _setComponentProps = <TProps extends BaseComponentProps = BaseComponentProps>(
    componentName: string,
    componentProps: TProps | ((prevProps: TProps) => TProps)
  ) => {
    const prevComponentInstance = get(_componentInstances, componentName);
    if (prevComponentInstance) {
      const newComponentProps =
        typeof componentProps === 'function'
          ? componentProps(prevComponentInstance.props as TProps)
          : componentProps;
      prevComponentInstance.props = newComponentProps;

      set(_componentInstances, componentName, { ...prevComponentInstance });
    }

    _subjects.instances.next({
      componentName,
      componentInstances: _componentInstances,
    });
    setComponentInstances(_componentInstances);
  };
  const _updatePartialComponentProps = <TProps extends BaseComponentProps = BaseComponentProps>(
    componentName: string,
    updatedProps: DeepPartial<TProps>
  ) => {
    const prevComponentInstance = get(_componentInstances, componentName);
    if (prevComponentInstance) {
      prevComponentInstance.props = produce(prevComponentInstance.props, (draft) => {
        merge(draft, updatedProps);
      });

      set(_componentInstances, componentName, { ...prevComponentInstance });
    }

    _subjects.instances.next({
      componentName,
      componentInstances: _componentInstances,
    });
    setComponentInstances(_componentInstances);
  };
  const _setComponentState = <TState extends ComponentState = ComponentState>(
    componentName: string,
    state: TState | ((prevState: TState) => TState)
  ) => {
    const prevComponentInstance = get(_componentInstances, componentName);
    const newState =
      typeof state === 'function' ? state(prevComponentInstance.state as TState) : state;
    if (prevComponentInstance) {
      prevComponentInstance.state = newState;

      set(_componentInstances, componentName, { ...prevComponentInstance });
    }

    _subjects.instances.next({
      componentName,
      componentInstances: _componentInstances,
    });
    setComponentInstances(_componentInstances);
  };
  const _updatePartialComponentState = <TState extends ComponentState = ComponentState>(
    componentName: string,
    updatedState: DeepPartial<TState>
  ) => {
    const prevComponentInstance = get(_componentInstances, componentName);
    if (prevComponentInstance) {
      prevComponentInstance.state = produce(prevComponentInstance.state, (draft) => {
        merge(draft, updatedState);
      });

      set(_componentInstances, componentName, { ...prevComponentInstance });
    }

    _subjects.instances.next({
      componentName,
      componentInstances: _componentInstances,
    });
    setComponentInstances(_componentInstances);
  };
  const _getComponentInstances = <
    T extends string | string[],
    R = T extends string[] ? ComponentInstance[] : ComponentInstance
  >(
    componentName: T
  ): R => {
    if (Array.isArray(componentName)) {
      return componentName.reduce((result, n) => {
        if (get(_componentInstances, n)) {
          result.push(get(_componentInstances, n));
        }

        return result;
      }, [] as ComponentInstance[]) as R;
    }

    return get(_componentInstances, componentName) as R;
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
      const { mappedComponentName } = createMappedComponentName(
        comConfig.componentName,
        parentPaths
      );
      const neededComponentStateProperties: ComponentState = {};

      const { actions, validations, ...restProps } = comConfig.props ?? ({} as BaseComponentProps);

      /**
       * get action methods
       */
      const actionsFns = Object.entries(actions ?? {}).reduce(
        (result, [event, config]: [string, ActionConfigs]) => ({
          ...result,
          [event]: Object.entries(config ?? {}).reduce((methods, [actionName, actionConfig]) => {
            const method = _actionMethods[actionName];
            return {
              ...methods,
              [actionName]: (args) =>
                method?.({
                  ...args,
                  config: actionConfig,
                }),
            };
          }, {} as ActionMethods),
        }),
        {} as EventActionMethods
      );

      /**
       * get lifecycle actions methods
       */
      const lifecycleActionsFns = Object.entries(comConfig.lifecycle ?? {}).reduce(
        (result, [lifecycleName, actConfigs]) => {
          return {
            ...result,
            [lifecycleName]: Object.entries(actConfigs).reduce(
              (methods, [actionName, actionConfig]) => {
                const definedMethod = _lifecycleActionMethods[actionName];
                const method: LifecycleActionMethod = (...args) => definedMethod?.(...args);
                method.__config = actionConfig;
                return {
                  ...methods,
                  [actionName]: definedMethod ? method : undefined,
                } as LifecycleActionMethod;
              },
              {} as LifecycleActionMethod
            ),
          };
        },
        {} as LifecycleActionMethods
      );

      const componentProps: BaseComponentProps = {
        ...(restProps ?? {}),
        actions: actionsFns,
      };

      const basicComponentControl: ComponentControl = {
        getCurrent: () => _getComponentInstances(mappedComponentName) as ComponentInstance,
        getParentComponents: () => {
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
                  ? `${step}.${path.fieldName}.__children[${path.index}]`
                  : `${step}.${path.fieldName}.__children`;
            } else {
              step =
                typeof path.index === 'number'
                  ? `${path.fieldName}.__children[${path.index}]`
                  : `${path.fieldName}.__children`;
            }
          });

          return result;
        },
        getParentFormFieldComponents: () => {
          return basicComponentControl
            .getParentComponents()
            .filter(
              (c) =>
                c.componentConfig.group === 'form-array-field' ||
                c.componentConfig.group === 'form-field'
            );
        },
        getFormControl: () => {
          const formComponent = parentPaths.find((p) => p.group === 'form');
          if (formComponent) {
            const parentPathsToFormComponentPosition = [] as ParentPath[];
            for (const path of parentPaths) {
              if (path.group === 'form') {
                break;
              }
              parentPathsToFormComponentPosition.push(path);
            }
            const { mappedComponentName: mappedFormComponentName } = createMappedComponentName(
              formComponent.componentName,
              parentPathsToFormComponentPosition
            );
            const formComponentInstance = _getComponentInstances(
              mappedFormComponentName
            ) as ComponentInstance;

            return formComponentInstance?.__formControl;
          }
        },
        getComponentInstances: _getComponentInstances,
        updatePartialComponentProps: _updatePartialComponentProps,
        setComponentProps: _setComponentProps,
        updatePartialComponentState: (updatedState) =>
          _updatePartialComponentState(mappedComponentName, updatedState),
        setComponentState: (state) => _setComponentState(mappedComponentName, state),
      };

      /**
       * Save validation dependencies to use for trigger if dependent fields are changed.
       */
      const saveValidationDependencies = () => {
        if (Object.keys(validations ?? {}).length) {
          const { mappedFieldName: mappedFieldValueName } = createMappedFieldName(
            comConfig.fieldName!,
            parentPaths
          );

          Object.values(comConfig.props?.validations ?? {}).forEach(
            (validationConfig: ValidationConfigMethod | boolean) => {
              if (typeof validationConfig === 'boolean') return;

              if (validationConfig.when?.dependsOn?.length) {
                validationConfig.when?.dependsOn.forEach((dependentFieldName) => {
                  const index = _validationDependencies.findIndex((d) =>
                    compareFieldNames(
                      d.fieldName,
                      resolveArrayIndexes(parentPaths, dependentFieldName)
                    )
                  );
                  if (index > -1) {
                    _validationDependencies[index].deps = [
                      ...new Set([..._validationDependencies[index].deps, mappedFieldValueName]),
                    ];
                  } else {
                    _validationDependencies.push({
                      fieldName: resolveArrayIndexes(parentPaths, dependentFieldName),
                      deps: [mappedFieldValueName],
                    });
                  }
                });
              }
            }
          );
        }
      };

      /**
       * For UI components
       */
      if (comConfig.group === 'ui') {
        set(result, mappedComponentName, {
          state: neededComponentStateProperties,
          props: componentProps,
          componentConfig: comConfig,
          __lifecycle: lifecycleActionsFns,
          __control: basicComponentControl,
          parentPaths,
        } as ComponentInstance);

        if (comConfig.components?.length) {
          createComponentInstances(
            comConfig.components,
            result,
            parentPaths.concat({
              id: comConfig.id,
              group: comConfig.group,
              fieldName: comConfig.fieldName,
              componentName: comConfig.componentName,
            })
          );
        }
        /**
         * For FORM components
         */
      } else if (comConfig.group === 'form') {
        /**
         * Get validators
         */
        const validators = Object.entries(
          (comConfig.props?.validations ?? {}) as Record<
            string,
            ValidationConfig[keyof ValidationConfig]
          >
        ).reduce((result, [key, config]) => {
          const definedMethod = _validationMethods[key];
          const method: ValidationMethod = (...args) => definedMethod?.(...args);
          method.__config = config;
          return {
            ...result,
            [key]: config && definedMethod ? method : undefined,
          };
        }, {} as ValidationMethods);

        set(result, mappedComponentName, {
          state: neededComponentStateProperties,
          componentConfig: comConfig,
          props: {
            ...componentProps,
            validations: validators,
          },
          __formControl: createFormControl({
            mode: 'all',
          }),
          __lifecycle: lifecycleActionsFns,
          __control: basicComponentControl,
          parentPaths,
        } as ComponentInstance);

        if (comConfig.components?.length) {
          createComponentInstances(
            comConfig.components,
            result,
            parentPaths.concat({
              id: comConfig.id,
              group: comConfig.group,
              fieldName: comConfig.fieldName,
              componentName: comConfig.componentName,
            })
          );
        }
        /**
         * For FORM FIELD components
         */
      } else if (comConfig.group === 'form-field') {
        const formComponent = parentPaths.find((p) => p.group === 'form');
        if (!formComponent)
          throw Error('Form field component must be wrapped inside form component');

        set(result, mappedComponentName, {
          state: neededComponentStateProperties,
          props: componentProps,
          componentConfig: comConfig,
          __lifecycle: lifecycleActionsFns,
          __control: basicComponentControl,
          parentPaths,
        } as ComponentInstance);

        saveValidationDependencies();

        if (comConfig.components?.length) {
          createComponentInstances(
            comConfig.components,
            result,
            parentPaths.concat({
              id: comConfig.id,
              group: comConfig.group,
              fieldName: comConfig.fieldName,
              componentName: comConfig.componentName,
            })
          );
        }
      } else if (comConfig.group === 'form-array-field') {
        const formComponent = parentPaths.find((p) => p.group === 'form');

        if (!formComponent)
          throw Error('Form field component must be wrapped inside form component');
        const { mappedFieldName: mappedFieldValueName } = createMappedFieldName(
          comConfig.fieldName!,
          parentPaths
        );

        const getFormComponentInstances = () => {
          const parentPathsToFormComponentPosition = [] as ParentPath[];
          for (const path of parentPaths) {
            if (path.group === 'form') {
              break;
            }
            parentPathsToFormComponentPosition.push(path);
          }
          const { mappedComponentName: mappedFormComponentInstanceName } =
            createMappedComponentName(
              formComponent.componentName,
              parentPathsToFormComponentPosition
            );

          return get(_componentInstances, mappedFormComponentInstanceName);
        };

        const formComponentInstance = getFormComponentInstances();

        saveValidationDependencies();

        const { getValues, control, reset } = formComponentInstance.__formControl!;
        // Init defaultValue
        reset(set(getValues() ?? {}, mappedFieldValueName, comConfig.props?.defaultValue));

        const arrayField = createFieldArray({
          name: mappedFieldValueName,
          control: control,
        });
        const arrayComponentControl = {
          ...basicComponentControl,
          ...arrayField,
          replace: (value) => {
            const currentArrayInstance = get(
              _componentInstances,
              mappedComponentName
            ) as ArrayFieldComponentInstance;
            const arrayValue = convertToArrayPayload(value);
            if (arrayValue.length) {
              arrayField.replace(arrayValue);
              const result = produce(_componentInstances, (draft) => {
                Array(arrayValue.length)
                  .fill(0)
                  .map((_, index) => {
                    const paths =
                      currentArrayInstance.parentPaths?.concat?.([
                        {
                          id: currentArrayInstance.componentConfig.id,
                          group: currentArrayInstance.componentConfig.group,
                          fieldName: currentArrayInstance.componentConfig.fieldName,
                          componentName: currentArrayInstance.componentConfig.componentName,
                          index,
                        },
                      ]) ?? [];
                    createComponentInstances(
                      currentArrayInstance.componentConfig.components ?? [],
                      draft as Record<string, ComponentInstance>,
                      paths
                    );
                  });
              });
              _subjects.instances.next({
                componentName: mappedComponentName,
                componentInstances: result,
              });
              setComponentInstances(result);
            } else {
              _setComponentInstance(mappedComponentName, {
                ...get(_componentInstances, mappedComponentName),
                __children: [],
              });
            }
          },
          prepend: (value, options) => {
            const currentArrayInstance = get(
              _componentInstances,
              mappedComponentName
            ) as ArrayFieldComponentInstance;

            arrayField.prepend?.(value, options);

            const cloneChildren =
              Array.isArray(currentArrayInstance.__children) &&
              currentArrayInstance.__children.length
                ? [...currentArrayInstance.__children]
                : [];
            (currentArrayInstance.__children as Record<string, ComponentInstance>[]) = [];
            convertToArrayPayload(value).forEach((_, index) => {
              const paths =
                currentArrayInstance.parentPaths?.concat?.([
                  {
                    id: currentArrayInstance.componentConfig.id,
                    group: currentArrayInstance.componentConfig.group,
                    fieldName: currentArrayInstance.componentConfig.fieldName,
                    componentName: currentArrayInstance.componentConfig.componentName,
                    index,
                  },
                ]) ?? [];
              createComponentInstances(
                currentArrayInstance.componentConfig.components ?? [],
                _componentInstances as Record<string, ComponentInstance>,
                paths
              );
            });
            (currentArrayInstance.__children as Record<string, ComponentInstance>[]).push(
              ...(cloneChildren as Record<string, ComponentInstance>[])
            );

            _subjects.instances.next({
              componentName: mappedComponentName,
              componentInstances: _componentInstances,
            });
          },
          append: (appendValue, options) => {
            const currentArrayInstance = get(
              _componentInstances,
              mappedComponentName
            ) as ArrayFieldComponentInstance;

            arrayField.append?.(appendValue, options);

            convertToArrayPayload(appendValue).forEach((_, index) => {
              const paths =
                currentArrayInstance.parentPaths?.concat?.([
                  {
                    id: currentArrayInstance.componentConfig.id,
                    group: currentArrayInstance.componentConfig.group,
                    fieldName: currentArrayInstance.componentConfig.fieldName,
                    componentName: currentArrayInstance.componentConfig.componentName,
                    index: ((currentArrayInstance.__children?.length as number) ?? 0) + index,
                  },
                ]) ?? [];
              createComponentInstances(
                currentArrayInstance.componentConfig.components ?? [],
                _componentInstances as Record<string, ComponentInstance>,
                paths
              );
            });
            _subjects.instances.next({
              componentName: mappedComponentName,
              componentInstances: _componentInstances,
            });
          },
          remove: (index) => {
            if (isUndefined(index)) return;

            const currentArrayInstance = get(
              _componentInstances,
              mappedComponentName
            ) as ArrayFieldComponentInstance;

            arrayField.remove?.(index);

            if (currentArrayInstance.__children?.length) {
              removeAt(currentArrayInstance.__children, index);
            }

            _subjects.instances.next({
              componentName: mappedComponentName,
              componentInstances: _componentInstances,
            });

            setComponentInstances(result);
          },
          insert: (atIndex, value, options) => {
            if (isUndefined(atIndex)) return;

            const currentArrayInstance = get(
              _componentInstances,
              mappedComponentName
            ) as ArrayFieldComponentInstance;
            arrayField.insert?.(atIndex, value, options);
            const formerChildren = currentArrayInstance.__children?.slice(0, atIndex) ?? [];
            const laterChildren = currentArrayInstance.__children?.slice(atIndex) ?? [];
            convertToArrayPayload(value).forEach((_, idx) => {
              const paths =
                currentArrayInstance.parentPaths?.concat?.([
                  {
                    id: currentArrayInstance.componentConfig.id,
                    group: currentArrayInstance.componentConfig.group,
                    fieldName: currentArrayInstance.componentConfig.fieldName,
                    componentName: currentArrayInstance.componentConfig.componentName,
                    index: atIndex + idx,
                  },
                ]) ?? [];
              createComponentInstances(
                currentArrayInstance.componentConfig.components ?? [],
                _componentInstances as Record<string, ComponentInstance>,
                paths
              );
            });

            currentArrayInstance.__children = [
              ...formerChildren,
              ...(currentArrayInstance.__children?.slice?.(
                atIndex,
                atIndex + convertToArrayPayload(value).length
              ) ?? []),
              ...laterChildren,
            ];

            _subjects.instances.next({
              componentName: mappedComponentName,
              componentInstances: _componentInstances,
            });
          },
          swap: (indexA, indexB) => {
            if (isUndefined(indexA) || isUndefined(indexB)) return;

            const currentArrayInstance = get(
              _componentInstances,
              mappedComponentName
            ) as ArrayFieldComponentInstance;
            arrayField.swap?.(indexA, indexB);

            if (currentArrayInstance.__children?.length) {
              [currentArrayInstance.__children[indexA], currentArrayInstance.__children[indexB]] = [
                currentArrayInstance.__children[indexB],
                currentArrayInstance.__children[indexA],
              ];
            }

            _subjects.instances.next({
              componentName: mappedComponentName,
              componentInstances: _componentInstances,
            });
          },
          move: (from, to) => {
            if (isUndefined(from) || isUndefined(to)) return;

            const currentArrayInstance = get(
              _componentInstances,
              mappedComponentName
            ) as ArrayFieldComponentInstance;
            arrayField.move?.(from, to);

            if (currentArrayInstance.__children) {
              move(currentArrayInstance.__children, from, to);
            }

            _subjects.instances.next({
              componentName: mappedComponentName,
              componentInstances: _componentInstances,
            });
          },
          update: (index, updateValue) => {
            const currentArrayInstance = get(
              _componentInstances,
              mappedComponentName
            ) as ArrayFieldComponentInstance;

            if (currentArrayInstance.__children?.[index]) {
              arrayField?.update?.(index, updateValue);
              const paths =
                currentArrayInstance.parentPaths?.concat?.([
                  {
                    id: currentArrayInstance.componentConfig.id,
                    group: currentArrayInstance.componentConfig.group,
                    fieldName: currentArrayInstance.componentConfig.fieldName,
                    componentName: currentArrayInstance.componentConfig.componentName,
                    index,
                  },
                ]) ?? [];
              createComponentInstances(
                currentArrayInstance.componentConfig.components ?? [],
                _componentInstances as Record<string, ComponentInstance>,
                paths
              );
            }

            _subjects.instances.next({
              componentName: mappedComponentName,
              componentInstances: _componentInstances,
            });
          },
        } as ComponentControl;
        set(result, mappedComponentName, {
          state: neededComponentStateProperties,
          props: componentProps,
          componentConfig: comConfig,
          __lifecycle: lifecycleActionsFns,
          __control: arrayComponentControl,
          parentPaths,
        } as ComponentInstance);

        const value: Record<string, any>[] | undefined = getValues(mappedFieldValueName);
        if (value?.length && comConfig.components?.length) {
          value.forEach((_, index) =>
            createComponentInstances(
              comConfig.components ?? [],
              result,
              parentPaths.concat({
                id: comConfig.id,
                group: comConfig.group,
                componentName: comConfig.componentName,
                fieldName: comConfig.fieldName,
                index: index,
              })
            )
          );
        }
      }
    });
  };

  createComponentInstances(componentConfigs, _componentInstances, []);
  setComponentInstances(_componentInstances);

  // const r = detectAndGenerateCircularDependencyGraph(_validationDependencies);

  return {
    _setComponentProps,
    _setComponentInstance,
    _getComponentInstances,
    _forceSubscribe,
    _updatePartialComponentInstance,
    _updatePartialComponentProps,
    get subjects() {
      return _subjects;
    },
    get componentInstances() {
      return _componentInstances;
    },
    get validationDependencies() {
      return _validationDependencies;
    },
    get actionMethods() {
      return _actionMethods;
    },
    get validationMethods() {
      return _validationMethods;
    },
  };
};
