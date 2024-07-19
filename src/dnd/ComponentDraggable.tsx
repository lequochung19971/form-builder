import React, { PropsWithChildren, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidV4 } from 'uuid';
import { ComponentConfig } from '../form-builder/types';
import { Button } from '@/components/ui/button';

type DraggableProps = PropsWithChildren & {
  item: Partial<ComponentConfig>;
};
export const ComponentDraggable: React.FunctionComponent<DraggableProps> = (props) => {
  const [id] = useState(uuidV4());
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `draggable-${id}`,
    data: {
      isNew: true,
      item: props.item,
    },
  });
  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <Button ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {props.children}
    </Button>
  );
};
