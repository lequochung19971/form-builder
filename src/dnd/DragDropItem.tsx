import React, { PropsWithChildren, useState } from 'react';
import { useDraggable, UseDraggableArguments, useDroppable } from '@dnd-kit/core';
import { Button } from '../ui/button';
import { CSS, useCombinedRefs } from '@dnd-kit/utilities';
import { v4 as uuidV4 } from 'uuid';
import { ComponentConfig } from '../form-builder/types';
import { cn } from '@/utils/uiUtils';

type DragDropItemProps = PropsWithChildren & {
  item: Partial<ComponentConfig>;
};
export const DragDropItem: React.FunctionComponent<DragDropItemProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableNodeRef,
    transform,
  } = useDraggable({
    id: props.item.id!,
    data: {
      item: props.item,
    },
  });
  const style = {
    transform: CSS.Translate.toString(transform),
  };
  const {
    setNodeRef: setDroppableNodeRef,
    isOver,
    node,
    rect,
    over,
  } = useDroppable({
    id: props.item.id!,
    data: {
      item: props.item,
    },
  });
  console.log('====>  node', node);
  console.log('====>  rect', rect);
  console.log('====> over', over);

  const setNodeRef = useCombinedRefs(setDroppableNodeRef, setDraggableNodeRef);

  return (
    <div
      className={cn('border border-primary p-2 w-fill', {
        'border-pink-600': isOver,
      })}
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}>
      {props.children}
    </div>
  );
};
