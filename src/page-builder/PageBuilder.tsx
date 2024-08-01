import { Button } from '@/components/ui/button';
import { ComponentConfig, ParentPath } from '@/ui-builder/types';
import { useUIBuilder } from '@/ui-builder/useUIBuilder';
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
import { isNil } from 'lodash';
import React, { createContext, forwardRef, memo, useContext, useMemo, useState } from 'react';
import { v4 as uuidV4 } from 'uuid';
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
import { addItemAtIndex, flattenTree, moveItemToIndex, removeItem, updateItem } from './utils';
import { UIBuilderProvider } from '@/ui-builder/UIBuilderContext';
import { ComponentType } from './types';

type PageBuilderContextValue = {
  isBuildingMode: boolean;
  handleOnClickEditComponent: (id: string) => void;
  handleOnClickDeleteComponent: (id: string) => void;
};

const PageBuilderContext = createContext<PageBuilderContextValue>({} as PageBuilderContextValue);
export const usePageBuilderContext = () => useContext(PageBuilderContext);

export type ComponentItemProps = {
  componentConfig: ComponentConfig;
  props?: object;
  parentPaths: ParentPath[];
  index: number;
  parentId?: string;
};

export const ComponentItem: React.FunctionComponent<ComponentItemProps> = memo((props) => {
  const { componentConfig, parentPaths: parentPaths, index, parentId } = props;
  const { isBuildingMode, handleOnClickDeleteComponent, handleOnClickEditComponent } =
    usePageBuilderContext();

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

export const PageBuilder: React.FunctionComponent<{
  defaultComponentConfigs?: ComponentConfig[];
}> = ({ defaultComponentConfigs = [] }) => {
  const uiBuilderMethods = useUIBuilder({
    defaultComponentConfigs: defaultComponentConfigs,
  });
  const [selectedComponentConfig, setSelectedComponentConfig] =
    useState<Partial<ComponentConfig>>();
  const [isBuildingMode, setIsBuildingMode] = useState(true);
  const [overAt, setOverAt] = useState<{ parentId?: string; index?: number }>({
    parentId: '',
    index: 0,
  });

  const [componentConfigs, setComponentConfigs] =
    useState<ComponentConfig[]>(defaultComponentConfigs);
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
    uiBuilderMethods.reset(configs);
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
        setSelectedComponentConfig(getDefaultComponentConfig(activeItem.type!));
        setOverAt({
          index: 0,
        });
        return componentConfigs;
      }

      if (active.data.current?.isNew) {
        const addIndex =
          overPosition === 'above' ? overItem?.index ?? 0 : (overItem?.index ?? 0) + 1;

        setSelectedComponentConfig(getDefaultComponentConfig(activeItem.type!));
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
            group: activeItem.group,
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
    setActiveData(undefined);
  }

  const handleOnSaveProperties = (values: Partial<ComponentConfig>) => {
    const currentComponent = flattenedData.find((d) => d.id === values.id);

    const config: Partial<ComponentConfig> = {
      ...values,
      props: {
        ...(values.props ?? {}),
        defaultValue: values.group === 'form-array-field' ? [{}] : undefined,
      },
    };

    // Add New
    if (!currentComponent) {
      updateComponentConfigs(
        addItemAtIndex(
          componentConfigs,
          config as ComponentConfig,
          overAt?.index ?? 0,
          overAt?.parentId
        )
      );
    } else {
      updateComponentConfigs(
        updateItem(componentConfigs, currentComponent.id, config as ComponentConfig)
      );
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
        {/* <Button onClick={() => setIsBuildingMode((prev) => !prev)}>Toggle mode</Button>
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
          <NewComponentDraggable type={ComponentType.BUTTON} name={ComponentType.BUTTON} />
          <NewComponentDraggable type={ComponentType.TEXT} name={ComponentType.TEXT} />
        </div> */}
        {!componentConfigs.length ? (
          <DropHerePlaceholder className="h-[200px]" />
        ) : (
          <div className="border border-muted-foreground rounded-md p-4">
            <PageBuilderContext.Provider
              value={{
                isBuildingMode: false,
                handleOnClickDeleteComponent,
                handleOnClickEditComponent,
              }}>
              <UIBuilderProvider {...uiBuilderMethods}>
                <div className="space-y-4">
                  {componentConfigs.map((component, index) => (
                    <ComponentItem
                      key={component.id}
                      componentConfig={component}
                      parentPaths={[]}
                      index={index}
                    />
                  ))}
                </div>
              </UIBuilderProvider>
            </PageBuilderContext.Provider>
          </div>
        )}
        <DragOverlay>{getDragOverlay()}</DragOverlay>
      </DndContext>
    </div>
  );
};
