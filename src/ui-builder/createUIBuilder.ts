import { createFormControl } from '@/form/logic/createFormControl';
import convertToArrayPayload from '@/utils/convertToArrayPayload';
import createSubject, { Subject } from '@/utils/createSubject';
import { produce } from 'immer';
import { get, isUndefined, merge, set } from 'lodash';
import {
  ArrayFieldComponentInstance,
  ComponentConfig,
  ComponentControl,
  ComponentInstance,
  ComponentState,
  ParentPath,
  PartialComponentInstance,
} from './types';
import move from '@/utils/move';
import {
  compareFieldNames,
  createMappedFieldNameForComponentInstances,
  createMappedFieldNameForValues,
  detectAndGenerateCircularDependencyGraph,
  isArrayFieldComponent,
  isFormComponent,
  isFormFieldComponent,
  isObjectFieldComponent,
  isUIComponent,
  isUIContainerComponent,
  removeAt,
  resolveArrayIndices as resolveArrayIndexes,
} from './utils';
import { createFieldArray } from '@/form/createFieldArray';

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
  _setComponentInstance: (
    componentName: string,
    updateComponentInstance: ComponentInstance
  ) => void;
  _updatePartialComponentInstance: (
    componentName: string,
    updatedInstance: PartialComponentInstance
  ) => void;
  _getComponentInstances: (
    componentName: string | string[]
  ) => ComponentInstance | ComponentInstance[];
  _forceSubscribe: () => void;
  subjects: {
    instances: ComponentInstancesSubject;
  };
  get componentInstances(): Record<string, ComponentInstance>;
  get validationDependencies(): ValidationDependency[];
};

export const createUIBuilder = (args: {
  componentConfigs: ComponentConfig[];
}): UIBuilderControl => {
  const { componentConfigs } = args;

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

  const _setComponentInstance = (
    componentName: string,
    updateComponentInstance: ComponentInstance
  ) => {
    const result = produce(_componentInstances, (draft) => {
      set(draft, componentName, updateComponentInstance);
    });
    _subjects.instances.next({
      componentName,
      componentInstances: result,
    });
    setComponentInstances(result);
  };
  const _updatePartialComponentInstance = (
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

  /**
   * @description This function will create component instances from component configurations, it will mutate the `result` params is passed from outside
   */
  const createComponentInstances = (
    componentConfigs: ComponentConfig[],
    result: Record<string, ComponentInstance>,
    parentPaths = [] as ParentPath[]
  ) => {
    componentConfigs.forEach((comConfig) => {
      const { mappedComponentName: mappedComponentInstanceName } =
        createMappedFieldNameForComponentInstances(comConfig.componentName, parentPaths);
      const neededComponentStateProperties: ComponentState = {
        componentName: comConfig.componentName,
        name: comConfig.fieldName,
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
            const { mappedComponentName: mappedFormComponentInstanceName } =
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
        updatePartialComponentInstance: _updatePartialComponentInstance,
      };

      const __formControl = isFormComponent(comConfig.type)
        ? createFormControl({
            mode: 'all',
          })
        : undefined;

      /**
       * For UI components
       */
      if (isUIComponent(comConfig.type)) {
        set(result, mappedComponentInstanceName, {
          __state: neededComponentStateProperties,
          componentConfig: comConfig,
          __formControl,
          __control: basicComponentControl,
          parentPaths,
        } as ComponentInstance);

        if (isUIContainerComponent(comConfig.type) && comConfig.components?.length) {
          createComponentInstances(
            comConfig.components,
            result,
            parentPaths.concat({
              id: comConfig.id,
              type: comConfig.type,
              fieldName: comConfig.fieldName,
              componentName: comConfig.componentName,
            })
          );
        }

        /**
         * For FORM FIELD components
         */
      } else if (isFormFieldComponent(comConfig.type)) {
        const formComponent = parentPaths.find((p) => isFormComponent(p.type));
        if (!formComponent)
          throw Error('Form field component must be wrapped inside form component');
        const { mappedFieldName: mappedFieldValueName } = createMappedFieldNameForValues(
          comConfig.fieldName!,
          parentPaths
        );

        /**
         * Save validation dependencies to use for trigger if dependent fields are changed.
         */
        if (Object.keys(comConfig.validations ?? {}).length) {
          const saveValidationDependencies = () => {
            Object.values(comConfig.validations ?? {}).forEach((validationConfig) => {
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
            });
          };
          saveValidationDependencies();
          console.log(_validationDependencies);
        }

        const getFormComponentInstances = () => {
          const parentPathsToFormComponentPosition = [] as ParentPath[];
          for (const path of parentPaths) {
            if (isFormComponent(path.type)) {
              break;
            }
            parentPathsToFormComponentPosition.push(path);
          }
          const { mappedComponentName: mappedFormComponentInstanceName } =
            createMappedFieldNameForComponentInstances(
              formComponent.componentName,
              parentPathsToFormComponentPosition
            );

          return get(_componentInstances, mappedFormComponentInstanceName);
        };

        const formComponentInstance = getFormComponentInstances();

        if (isArrayFieldComponent(comConfig.type)) {
          const { getValues, control, reset } = formComponentInstance.__formControl!;
          // Init defaultValue
          reset(set(getValues() ?? {}, mappedFieldValueName, comConfig.defaultValue));

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
                mappedComponentInstanceName
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
                            type: currentArrayInstance.componentConfig.type,
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
                  componentName: mappedComponentInstanceName,
                  componentInstances: result,
                });
                setComponentInstances(result);
              } else {
                _setComponentInstance(mappedComponentInstanceName, {
                  ...get(_componentInstances, mappedComponentInstanceName),
                  __children: [],
                });
              }
            },
            prepend: (value, options) => {
              const currentArrayInstance = get(
                _componentInstances,
                mappedComponentInstanceName
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
                      type: currentArrayInstance.componentConfig.type,
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
                componentName: mappedComponentInstanceName,
                componentInstances: _componentInstances,
              });
            },
            append: (appendValue, options) => {
              const currentArrayInstance = get(
                _componentInstances,
                mappedComponentInstanceName
              ) as ArrayFieldComponentInstance;

              arrayField.append?.(appendValue, options);

              convertToArrayPayload(appendValue).forEach((_, index) => {
                const paths =
                  currentArrayInstance.parentPaths?.concat?.([
                    {
                      id: currentArrayInstance.componentConfig.id,
                      type: currentArrayInstance.componentConfig.type,
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
                componentName: mappedComponentInstanceName,
                componentInstances: _componentInstances,
              });
            },
            remove: (index) => {
              if (isUndefined(index)) return;

              const currentArrayInstance = get(
                _componentInstances,
                mappedComponentInstanceName
              ) as ArrayFieldComponentInstance;

              arrayField.remove?.(index);

              if (currentArrayInstance.__children?.length) {
                removeAt(currentArrayInstance.__children, index);
              }

              _subjects.instances.next({
                componentName: mappedComponentInstanceName,
                componentInstances: _componentInstances,
              });

              setComponentInstances(result);
            },
            insert: (atIndex, value, options) => {
              if (isUndefined(atIndex)) return;

              const currentArrayInstance = get(
                _componentInstances,
                mappedComponentInstanceName
              ) as ArrayFieldComponentInstance;
              arrayField.insert?.(atIndex, value, options);
              const formerChildren = currentArrayInstance.__children?.slice(0, atIndex) ?? [];
              const laterChildren = currentArrayInstance.__children?.slice(atIndex) ?? [];
              convertToArrayPayload(value).forEach((_, idx) => {
                const paths =
                  currentArrayInstance.parentPaths?.concat?.([
                    {
                      id: currentArrayInstance.componentConfig.id,
                      type: currentArrayInstance.componentConfig.type,
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
                componentName: mappedComponentInstanceName,
                componentInstances: _componentInstances,
              });
            },
            swap: (indexA, indexB) => {
              if (isUndefined(indexA) || isUndefined(indexB)) return;

              const currentArrayInstance = get(
                _componentInstances,
                mappedComponentInstanceName
              ) as ArrayFieldComponentInstance;
              arrayField.swap?.(indexA, indexB);

              if (currentArrayInstance.__children?.length) {
                [currentArrayInstance.__children[indexA], currentArrayInstance.__children[indexB]] =
                  [
                    currentArrayInstance.__children[indexB],
                    currentArrayInstance.__children[indexA],
                  ];
              }

              _subjects.instances.next({
                componentName: mappedComponentInstanceName,
                componentInstances: _componentInstances,
              });
            },
            move: (from, to) => {
              if (isUndefined(from) || isUndefined(to)) return;

              const currentArrayInstance = get(
                _componentInstances,
                mappedComponentInstanceName
              ) as ArrayFieldComponentInstance;
              arrayField.move?.(from, to);

              if (currentArrayInstance.__children) {
                move(currentArrayInstance.__children, from, to);
              }

              _subjects.instances.next({
                componentName: mappedComponentInstanceName,
                componentInstances: _componentInstances,
              });
            },
            update: (index, updateValue) => {
              const currentArrayInstance = get(
                _componentInstances,
                mappedComponentInstanceName
              ) as ArrayFieldComponentInstance;

              if (currentArrayInstance.__children?.[index]) {
                arrayField?.update?.(index, updateValue);
                const paths =
                  currentArrayInstance.parentPaths?.concat?.([
                    {
                      id: currentArrayInstance.componentConfig.id,
                      type: currentArrayInstance.componentConfig.type,
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
                componentName: mappedComponentInstanceName,
                componentInstances: _componentInstances,
              });
            },
          } as ComponentControl;
          set(result, mappedComponentInstanceName, {
            __state: neededComponentStateProperties,
            componentConfig: comConfig,
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
                  type: comConfig.type,
                  componentName: comConfig.componentName,
                  fieldName: comConfig.fieldName,
                  index: index,
                })
              )
            );
          }
        } else if (isObjectFieldComponent(comConfig.type)) {
          set(result, mappedComponentInstanceName, {
            __state: neededComponentStateProperties,
            componentConfig: comConfig,
            __control: basicComponentControl,
            parentPaths,
          } as ComponentInstance);

          if (comConfig.components?.length) {
            createComponentInstances(
              comConfig.components,
              result,
              parentPaths.concat({
                id: comConfig.id,
                type: comConfig.type,
                fieldName: comConfig.fieldName,
                componentName: comConfig.componentName,
              })
            );
          }
        } else {
          // Primitive field
          set(result, mappedComponentInstanceName, {
            __state: neededComponentStateProperties,
            componentConfig: comConfig,
            __control: basicComponentControl,
            parentPaths,
          } as ComponentInstance);
        }
      }
    });
  };

  createComponentInstances(componentConfigs, _componentInstances, []);
  setComponentInstances(_componentInstances);

  const r = detectAndGenerateCircularDependencyGraph(_validationDependencies);

  return {
    _setComponentInstance,
    _getComponentInstances,
    _forceSubscribe,
    _updatePartialComponentInstance,
    get subjects() {
      return _subjects;
    },
    get componentInstances() {
      return _componentInstances;
    },
    get validationDependencies() {
      return _validationDependencies;
    },
  };
};
