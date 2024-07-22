import { get, isNil, merge } from 'lodash';
import { ComponentConfig, ComponentInstance, ParentPath } from '../ui-builder/types';
import convertToArrayPayload from '@/utils/convertToArrayPayload';

export function flattenTree(tree: ComponentConfig[]): ComponentConfig[] {
  const result: ComponentConfig[] = [];

  function traverse(node: ComponentConfig) {
    result.push(node); // Copy the node without its children components
    if (node.components) {
      for (const child of node.components) {
        traverse(child);
      }
    }
  }

  for (const item of tree) {
    traverse(item);
  }

  return result;
}

// Add an item to a parent item in the tree
export function addItem(
  tree: ComponentConfig[],
  parentId: string,
  newItem: ComponentConfig
): ComponentConfig[] {
  return tree.map((item) => {
    if (item.id === parentId) {
      return {
        ...item,
        components: item.components ? [...item.components, newItem] : [newItem],
      };
    }
    if (item.components) {
      return { ...item, components: addItem(item.components, parentId, newItem) };
    }
    return item;
  });
}

// Find an item in the tree
export function findItem(tree: ComponentConfig[], id: string): ComponentConfig | undefined {
  for (const node of tree) {
    if (node.id === id) {
      return node;
    }
    if (node.components) {
      const found = findItem(node.components, id);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

// Remove an item from the tree
export function removeItem(tree: ComponentConfig[], id: string): ComponentConfig[] {
  return tree.reduce((acc, item) => {
    if (item.id === id) {
      return acc;
    }
    if (item.components) {
      return [...acc, { ...item, components: removeItem(item.components, id) }];
    }
    return [...acc, item];
  }, [] as ComponentConfig[]);
}

// Add an item to a parent item at a specific index in the tree
export function addItemAtIndex(
  tree: ComponentConfig[],
  newItem: ComponentConfig,
  index: number,
  parentId?: string
): ComponentConfig[] {
  if (isNil(parentId)) {
    const newTree = [...tree];
    newTree.splice(index, 0, newItem);
    return newTree;
  }
  return tree.map((item) => {
    if (item.id === parentId) {
      const updatedChildren = item.components ? [...item.components] : [];
      updatedChildren.splice(index, 0, newItem);
      return { ...item, components: updatedChildren };
    }
    if (item.components) {
      return { ...item, components: addItemAtIndex(item.components, newItem, index, parentId) };
    }
    return item;
  });
}

// Move an item within the tree to a new parent at a specific index
export function moveItemToIndex(
  tree: ComponentConfig[],
  itemId: string,
  index: number,
  newParentId?: string
): ComponentConfig[] {
  const itemToMove = findItem(tree, itemId);
  if (!itemToMove) {
    throw new Error(`Item with id ${itemId} not found`);
  }
  const treeWithoutItem = removeItem(tree, itemId);
  const newItem = { ...itemToMove, parentId: newParentId };
  return addItemAtIndex(treeWithoutItem, newItem, index, newParentId);
}

// Check if an item is a child or grandchild of another item
export function isDescendant(tree: ComponentConfig[], parentId: string, childId: string): boolean {
  for (const item of tree) {
    if (item.id === parentId) {
      if (item.components) {
        for (const child of item.components) {
          if (child.id === childId || isDescendant(item.components, child.id, childId)) {
            return true;
          }
        }
      }
    } else if (item.components) {
      if (isDescendant(item.components, parentId, childId)) {
        return true;
      }
    }
  }
  return false;
}

// Update an item in the tree
export function updateItem(
  tree: ComponentConfig[],
  id: string,
  newItem: Partial<ComponentConfig>
): ComponentConfig[] {
  return tree.map((item) => {
    if (item.id === id) {
      return merge(item, newItem);
    }

    if (item.components) {
      return merge({ ...item }, { components: updateItem(item.components ?? [], id, newItem) });
    }
    return item;
  });
}

export function getParentsById(tree: ComponentConfig[], itemId: string) {
  const parents = [] as ComponentConfig[];

  function findParents(currentTree: ComponentConfig[], currentItemId: string) {
    for (const item of currentTree) {
      if (item.id === currentItemId) {
        return true;
      }
      if (item.components) {
        const found = findParents(item.components ?? [], currentItemId);
        if (found) {
          parents.push(item);
          return true;
        }
      }
    }
    return false;
  }

  findParents(tree, itemId);
  return parents.reverse();
}

const getParentsByParentPaths = (
  componentInstances: Record<string, ComponentInstance>,
  parentPaths: ParentPath[]
) => {
  let step: string;
  const result: ComponentInstance[] = [];
  parentPaths?.forEach((path) => {
    const instance: ComponentInstance = get(
      componentInstances,
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
};
