import { cn } from '@/utils/uiUtils';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  MeasuringConfiguration,
  MeasuringStrategy,
  PointerSensor,
  UniqueIdentifier,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { isNil } from 'lodash';
import { forwardRef, useMemo, useState } from 'react';
import { v4 as uuidV4 } from 'uuid';
import { ComponentConfig, ComponentType } from '../form-builder/types';
import { Button } from '../ui/button';
import { ComponentDraggable } from './ComponentDraggable';
import SortableContainer from './SortableContainer';
import { checkPosition, Item, SortableItem } from './SortableItem';

export function flattenTree(tree: DataItem[]): DataItem[] {
  const result: DataItem[] = [];

  function traverse(node: DataItem) {
    result.push({ ...node, children: undefined }); // Copy the node without its children
    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  for (const item of tree) {
    traverse(item);
  }

  return result;
}

const componentList: Partial<ComponentConfig>[] = [
  {
    type: ComponentType.INPUT,
  },
  {
    type: ComponentType.FORM,
  },
  {
    type: ComponentType.PAGE,
  },
];

const List = () => {
  return (
    <div className="p-4 w-full border border-primary space-x-2 mb-4">
      {componentList.map((component) => (
        <ComponentDraggable item={component}>{component.type}</ComponentDraggable>
      ))}
    </div>
  );
};

// Add an item to a parent item in the tree
function addItem(tree: DataItem[], parentId: UniqueIdentifier, newItem: DataItem): DataItem[] {
  return tree.map((item) => {
    if (item.id === parentId) {
      return {
        ...item,
        children: item.children ? [...item.children, newItem] : [newItem],
      };
    }
    if (item.children) {
      return { ...item, children: addItem(item.children, parentId, newItem) };
    }
    return item;
  });
}

// Find an item in the tree
function findItem(tree: DataItem[], id: UniqueIdentifier): DataItem | undefined {
  for (const node of tree) {
    if (node.id === id) {
      return node;
    }
    if (node.children) {
      const found = findItem(node.children, id);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

// Remove an item from the tree
function removeItem(tree: DataItem[], id: UniqueIdentifier): DataItem[] {
  return tree.reduce((acc: DataItem[], item) => {
    if (item.id === id) {
      return acc;
    }
    if (item.children) {
      return [...acc, { ...item, children: removeItem(item.children, id) }];
    }
    return [...acc, item];
  }, []);
}

// Add an item to a parent item at a specific index in the tree
function addItemAtIndex(
  tree: DataItem[],
  newItem: DataItem,
  index: number,
  parentId?: UniqueIdentifier
): DataItem[] {
  if (isNil(parentId)) {
    const newTree = [...tree];
    newTree.splice(index, 0, newItem);
    return newTree;
  }
  return tree.map((item) => {
    if (item.id === parentId) {
      const updatedChildren = item.children ? [...item.children] : [];
      updatedChildren.splice(index, 0, newItem);
      return { ...item, children: updatedChildren };
    }
    if (item.children) {
      return { ...item, children: addItemAtIndex(item.children, newItem, index, parentId) };
    }
    return item;
  });
}

// Move an item within the tree to a new parent at a specific index
function moveItemToIndex(
  tree: DataItem[],
  itemId: UniqueIdentifier,
  index: number,
  newParentId?: UniqueIdentifier
): DataItem[] {
  const itemToMove = findItem(tree, itemId);
  if (!itemToMove) {
    throw new Error(`Item with id ${itemId} not found`);
  }
  const treeWithoutItem = removeItem(tree, itemId);
  const newItem = { ...itemToMove, parentId: newParentId };
  return addItemAtIndex(treeWithoutItem, newItem, index, newParentId);
}

// Check if an item is a child or grandchild of another item
function isDescendant(
  tree: DataItem[],
  parentId: UniqueIdentifier,
  childId: UniqueIdentifier
): boolean {
  for (const item of tree) {
    if (item.id === parentId) {
      if (item.children) {
        for (const child of item.children) {
          if (child.id === childId || isDescendant(item.children, child.id, childId)) {
            return true;
          }
        }
      }
    } else if (item.children) {
      if (isDescendant(item.children, parentId, childId)) {
        return true;
      }
    }
  }
  return false;
}

const measuring: MeasuringConfiguration = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
};

export interface DataItem {
  id: UniqueIdentifier;
  type: 'item' | 'container';
  parentId?: UniqueIdentifier;
  children?: DataItem[];
  index?: number;
}

export const DropHerePlaceholder = forwardRef<any, { isOver?: boolean; className?: string }>(
  ({ isOver, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'min-h-10 w-full flex justify-center items-center border rounded-md border-dotted border-muted-foreground',
          {
            'bg-pink-600 border-pink-600': isOver,
          },
          className
        )}>
        Drop here
      </div>
    );
  }
);

export const DndTest = () => {
  const [data, setData] = useState<DataItem[]>([] as DataItem[]);
  const [activeItem, setActiveItem] = useState<DataItem>();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { isOver, setNodeRef } = useDroppable({
    id: 'droppable-root',
    data: {},
  });

  const flattenedData = useMemo(() => flattenTree(data), [data]);
  console.log(flattenedData);

  return (
    <div>
      <div className="space-x-4 mb-4">
        <Button onClick={addNewItem('item')}>Add Item</Button>
        <Button onClick={addNewItem('container')}>Add Container</Button>
      </div>
      <DndContext
        measuring={measuring}
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}>
        {/* <List /> */}
        {!data.length ? (
          <DropHerePlaceholder ref={setNodeRef} isOver={isOver} className="h-[200px]" />
        ) : (
          <div className="border border-muted-foreground rounded-md p-4">
            <div className="space-y-4">
              {data.map((item, index) => {
                if (item.type === 'container') {
                  return <SortableContainer key={item.id} id={item.id} data={item} index={index} />;
                }

                return (
                  <SortableItem key={item.id} id={item.id} data={item} index={index}>
                    <Item>{item.id}</Item>
                  </SortableItem>
                );
              })}
            </div>
          </div>
        )}
        <DragOverlay>{getDragOverlay()}</DragOverlay>
      </DndContext>
    </div>
  );

  function addNewItem(type: DataItem['type']) {
    return () => {
      setData((prev) => [
        ...prev,
        {
          id: `${type}-${uuidV4()}`,
          type,
        },
      ]);
    };
  }

  function getDragOverlay() {
    if (!activeItem) {
      return null;
    }

    return <div className="border border-primary rounded-md p-2 w-fit">{`${activeItem.id}`}</div>;
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;

    setActiveItem(active.data.current?.item);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    const activeItem = active?.data.current?.item as DataItem;
    const overItem = over?.data.current?.item as DataItem;

    if (overItem.id === activeItem.id) return;

    const overIsContainer = overItem?.type === 'container';
    const overIsEmptyContainer = overIsContainer && !overItem?.children?.length;

    // const activeIsContainer = activeItem?.type === 'container';
    // if (activeIsContainer && isDescendant(data, activeItem.id, overItem.id)) return;

    setData((prev) => {
      if (!active.rect.current.translated || !over) return prev;
      const overPosition = checkPosition(active.rect.current.translated, over?.rect);

      if (overIsEmptyContainer && activeItem.parentId !== overItem.id && over.data.current?.isNew) {
        // Add new at index is 0
        return moveItemToIndex(prev, activeItem.id, 0, overItem.id);
      }

      const overFlattenedIndex = flattenedData.findIndex((d) => d.id === overItem.id);
      const activeFlattenedIndex = flattenedData.findIndex((d) => d.id === activeItem.id);

      if (activeFlattenedIndex === -1 || activeFlattenedIndex === -1) return prev;

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
        return moveItemToIndex(prev, activeItem.id, atOverIndex, overItem.parentId);
      }

      return prev;
    });
    setActiveItem(undefined);
  }
};
