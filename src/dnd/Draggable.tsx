import React, { PropsWithChildren } from 'react';
import { useDraggable, UseDraggableArguments } from '@dnd-kit/core';
import { Button } from '../ui/button';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidV4 } from 'uuid';

type DraggableProps = PropsWithChildren;
export const Draggable: React.FunctionComponent<DraggableProps> = (props) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `draggable-${uuidV4()}`,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <>
      <Button ref={setNodeRef} style={style} {...listeners} {...attributes}>
        {props.children}
      </Button>
      {isDragging && <Button className="opacity-50">{props.children}</Button>}
    </>
  );
};
