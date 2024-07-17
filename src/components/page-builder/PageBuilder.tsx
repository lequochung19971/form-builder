import { cn } from '@/utils/uiUtils';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  MeasuringConfiguration,
  MeasuringStrategy,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { get, isNil } from 'lodash';
import React, {
  createContext,
  forwardRef,
  memo,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { FieldValues, FormProvider, UseFormReturn, useForm } from 'react-hook-form';
import { v4 as uuidV4 } from 'uuid';
import { Button } from '../ui/button';
import { ComponentToolbar } from './ComponentToolbar';
import { NewComponentDraggable } from './NewComponentDraggable';
import {
  AllComponentProps,
  configuredComponents,
  getDefaultComponentConfig,
} from './configuredComponents';
import { checkOverPosition } from './dnd/checkOverPosition';
import { CustomMouseSensor, CustomPointerSensor } from './dnd/customSensor';
import { ComponentPropertiesDialog } from './properties-configuration/ComponentPropertiesDialog';
import { CState, ComponentConfig, ComponentInstance, ComponentType, ParentPath } from './types';
import {
  addItemAtIndex,
  flattenTree,
  getParentsById,
  isDataArrayComponent,
  moveItemToIndex,
  removeItem,
  updateItem,
} from './utils';
import { createPageBuilder } from './createAppBuilder';

const usePageBuilder = (props: {
  componentConfigs: ComponentConfig[];
  form: UseFormReturn<FieldValues, any, FieldValues>;
}) => {
  const formBuilderControl = useRef(createPageBuilder(props));
  const [componentInstances, setComponentInstances] = useState(
    formBuilderControl.current._componentInstances
  );

  useEffect(() => {
    if (!formBuilderControl.current) return;

    const observer = (instances: Record<string, ComponentInstance>) => {
      setComponentInstances(instances);
    };
    formBuilderControl.current.watch(observer);
    return () => {
      formBuilderControl.current.unwatch(observer);
    };
  }, []);

  return {
    componentInstances,
    setComponentInstances: formBuilderControl.current.setComponentInstances,
    setComponentInstance: formBuilderControl.current.setComponentInstance,
    getComponentInstances: formBuilderControl.current.getComponentInstances,
    reset: (componentConfigs: ComponentConfig[]) => {
      formBuilderControl.current = createPageBuilder({
        ...props,
        componentConfigs,
      });
      setComponentInstances(formBuilderControl.current._componentInstances);
    },
  };
};

type FormBuilderContextValue = {
  componentInstances: Record<string, ComponentInstance>;
  isBuildingMode?: boolean;
  handleOnClickEditComponent?: (id: string) => void;
  handleOnClickDeleteComponent?: (id: string) => void;
};

const FormBuilderContext = createContext<FormBuilderContextValue>({} as FormBuilderContextValue);
export const useFormBuilderContext = () => useContext(FormBuilderContext);

export type ComponentItemProps = {
  componentConfig: ComponentConfig;
  props?: object;
  parentPaths: ParentPath[];
  index: number;
  parentId?: string;
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

export const ComponentItem: React.FunctionComponent<ComponentItemProps> = memo((props) => {
  const { componentConfig, parentPaths: parentPaths, index, parentId } = props;
  const { isBuildingMode, handleOnClickDeleteComponent, handleOnClickEditComponent } =
    useFormBuilderContext();

  const Component = configuredComponents[
    componentConfig.type as keyof typeof configuredComponents
  ] as React.FunctionComponent<AllComponentProps>;

  if (!Component) {
    throw Error(
      `Does not exist component ${componentConfig.type} name is ${componentConfig.componentName}`
    );
  }

  if (isBuildingMode) {
    return (
      <ComponentToolbar
        id={componentConfig.id}
        onDelete={handleOnClickDeleteComponent}
        onEdit={handleOnClickEditComponent}>
        <Component
          componentConfig={componentConfig}
          parentPaths={parentPaths}
          index={index}
          parentId={parentId}
        />
      </ComponentToolbar>
    );
  }

  return (
    <Component componentConfig={componentConfig} parentPaths={parentPaths} parentId={parentId} />
  );
});

export const DropHerePlaceholder = forwardRef<any, { isOver?: boolean; className?: string }>(
  ({ className }, ref) => {
    const { isOver, setNodeRef } = useDroppable({
      id: 'droppable-root',
      data: {
        isRoot: true,
      },
    });
    return (
      <div
        ref={setNodeRef}
        className={cn(
          'min-h-10 w-full flex justify-center items-center border rounded-md border-dotted border-muted-foreground',
          {
            'bg-secondary': isOver,
          },
          className
        )}>
        Drop here
      </div>
    );
  }
);

const measuring: MeasuringConfiguration = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
};

export const PageBuilder: React.FunctionComponent = () => {
  const form = useForm({
    mode: 'all',
  }) as UseFormReturn<FieldValues, any, FieldValues>;

  const formBuilder = usePageBuilder({
    form,
    componentConfigs: [],
  });
  const [selectedComponentConfig, setSelectedComponentConfig] =
    useState<Partial<ComponentConfig>>();
  const [overAt, setOverAt] = useState<{ parentId?: string; index?: number }>({
    parentId: '',
    index: 0,
  });
  console.log('values', form.watch());

  const [componentConfigs, setComponentConfigs] = useState<ComponentConfig[]>(
    [] as ComponentConfig[]
  );
  const [activeData, setActiveData] = useState<{
    item?: ComponentConfig;
    isNew?: boolean;
  }>();

  const sensors = useSensors(
    useSensor(CustomPointerSensor),
    useSensor(CustomMouseSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const updateComponentConfigs = (configs: ComponentConfig[]) => {
    setComponentConfigs(configs);
    formBuilder.reset(configs);
  };

  const flattenedData = useMemo(() => flattenTree(componentConfigs), [componentConfigs]);

  function getDragOverlay() {
    if (!activeData) {
      return null;
    }

    if (activeData.isNew) return <Button className="opacity-50">{activeData.item?.type}</Button>;

    return (
      <div className="border border-primary rounded-md p-2 w-fit">{`${activeData.item?.componentName}`}</div>
    );
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;

    setActiveData(active.data.current);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    const handler = () => {
      const activeItem = active?.data.current?.item as ComponentConfig;
      const overItem = over?.data.current?.item as ComponentConfig;

      if (!active.rect.current.translated || !over) return componentConfigs;

      const overPosition = checkOverPosition(active.rect.current.translated, over?.rect);

      if (over?.data?.current?.isRoot) {
        setSelectedComponentConfig(getDefaultComponentConfig(activeItem.type));
        setOverAt({
          index: 0,
        });
        return componentConfigs;
      }

      if (active.data.current?.isNew) {
        const addIndex =
          overPosition === 'above' ? overItem?.index ?? 0 : (overItem?.index ?? 0) + 1;

        setSelectedComponentConfig(getDefaultComponentConfig(activeItem.type));
        setOverAt({
          index: addIndex,
          parentId: overItem.parentId,
        });
        return componentConfigs;
      }

      if (overItem?.id && activeItem?.id && overItem?.id === activeItem?.id)
        return componentConfigs;

      const overIsContainer = overItem?.type === 'container';
      const overIsEmptyContainer = overIsContainer && !overItem?.components?.length;

      // const activeIsContainer = activeItem?.type === 'container';
      // if (activeIsContainer && isDescendant(data, activeItem.id, overItem.id)) return;

      if (active.data.current?.isNew) {
        const addIndex =
          overPosition === 'above' ? (overItem?.index ?? 0) - 1 : overItem?.index ?? 0;
        return addItemAtIndex(
          componentConfigs,
          {
            id: `${activeItem.type}-${uuidV4()}`,
            componentName: `${activeItem.type}-${uuidV4()}`,
            type: activeItem.type,
          },
          addIndex,
          overItem.parentId
        );
      }

      if (overIsEmptyContainer && activeItem.parentId !== overItem.id) {
        // Add new at index is 0 for current parent
        return moveItemToIndex(componentConfigs, activeItem.id, 0, overItem.id);
      }

      const overFlattenedIndex = flattenedData.findIndex((d) => d.id === overItem.id);
      const activeFlattenedIndex = flattenedData.findIndex((d) => d.id === activeItem.id);

      if (activeFlattenedIndex === -1 || activeFlattenedIndex === -1) return componentConfigs;

      const isMoveDown = activeFlattenedIndex < overFlattenedIndex;

      let atOverIndex: number;

      if (activeItem.parentId !== overItem.id) {
        atOverIndex = overPosition === 'above' ? overItem.index ?? 0 : (overItem.index ?? 0) + 1;
      } else {
        // Move down
        if (isMoveDown) {
          atOverIndex = overPosition === 'above' ? (overItem.index ?? 0) - 1 : overItem.index ?? 0;
          // Move up
        } else {
          atOverIndex = overPosition === 'above' ? overItem.index ?? 0 : (overItem.index ?? 0) + 1;
        }
      }

      if (!isNil(atOverIndex)) {
        return moveItemToIndex(componentConfigs, activeItem.id, atOverIndex, overItem.parentId);
      }

      return componentConfigs;
    };
    updateComponentConfigs(handler());
    // setActiveData(undefined);
  }

  const handleOnSaveProperties = (values: Partial<ComponentConfig>) => {
    const currentComponent = flattenedData.find((d) => d.id === values.id);

    /**
     * Set default form value for data array component
     */
    if (isDataArrayComponent(values.type!)) {
      const currentParent = flattenedData.find((d) => d.id === overAt?.parentId);
      const parents: ComponentConfig[] = currentParent
        ? getParentsById(componentConfigs, currentParent.id).concat(currentParent)
        : [];
      let parentKey = '';
      if (parents.length) {
        parentKey = parents.reduce((result, p) => {
          if (!p.name) return result;

          if (isDataArrayComponent(p.type)) {
            result = result ? `${result}.0.${p.name}` : p.name!;
          } else {
            result = result ? `${result}.${p.name}` : p.name!;
          }
          return result;
        }, '');
      }
      form.setValue(parentKey ? `${parentKey}.0.${values.name}` : values.name!, [{}]);
    }

    // Add New
    if (!currentComponent) {
      updateComponentConfigs(
        addItemAtIndex(
          componentConfigs,
          values as ComponentConfig,
          overAt?.index ?? 0,
          overAt?.parentId
        )
      );
    } else {
      updateComponentConfigs(updateItem(componentConfigs, currentComponent.id, values));
    }

    setSelectedComponentConfig(undefined);
    setOverAt({});
  };

  const handleOnClickEditComponent = (id: string) => {
    const currentComponent = flattenedData.find((d) => d.id === id);
    setSelectedComponentConfig(currentComponent);
  };

  const handleOnClickDeleteComponent = (id: string) => {
    updateComponentConfigs(removeItem(componentConfigs, id));
  };

  return (
    <div className="container">
      <ComponentPropertiesDialog
        open={!!selectedComponentConfig}
        componentConfig={selectedComponentConfig!}
        onSubmit={handleOnSaveProperties}
        onClose={() => {
          setSelectedComponentConfig(undefined);
          setOverAt({});
        }}
      />
      <DndContext
        measuring={measuring}
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}>
        <div className="space-x-4 mb-4 p-4 border border-dotted border-muted-foreground rounded-md">
          <NewComponentDraggable type={ComponentType.INPUT} name={ComponentType.INPUT} />
          <NewComponentDraggable type={ComponentType.TABS} name={ComponentType.TABS} />
          <NewComponentDraggable
            type={ComponentType.INPUT_FIELD}
            name={ComponentType.INPUT_FIELD}
          />
          <NewComponentDraggable
            type={ComponentType.ARRAY_CONTAINER}
            name={ComponentType.ARRAY_CONTAINER}
          />
          <NewComponentDraggable type={ComponentType.FORM} name={ComponentType.FORM} />
        </div>
        {!componentConfigs.length ? (
          <DropHerePlaceholder className="h-[200px]" />
        ) : (
          <div className="border border-muted-foreground rounded-md p-4">
            <div>
              <FormProvider {...form}>
                <FormBuilderContext.Provider
                  value={{
                    componentInstances: formBuilder.componentInstances,
                    isBuildingMode: true,
                    handleOnClickDeleteComponent,
                    handleOnClickEditComponent,
                  }}>
                  <form className="space-y-4">
                    {formBuilder.componentInstances &&
                      componentConfigs.map((component, index) => (
                        <ComponentItem
                          key={component.id}
                          componentConfig={component}
                          parentPaths={[]}
                          index={index}
                        />
                      ))}
                  </form>
                </FormBuilderContext.Provider>
              </FormProvider>
            </div>
          </div>
        )}
        <DragOverlay>{getDragOverlay()}</DragOverlay>
      </DndContext>
    </div>
  );
};
