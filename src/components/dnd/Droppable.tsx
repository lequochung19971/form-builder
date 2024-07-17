import React, { PropsWithChildren } from 'react';
import { useDroppable, UseDroppableArguments } from '@dnd-kit/core';
type DroppableProps = PropsWithChildren;

export const Droppable: React.FunctionComponent<DroppableProps> = (props) => {
  const { isOver, setNodeRef } = useDroppable({
    id: 'droppable',
    data: {},
  });
  const style = {
    color: isOver ? 'green' : undefined,
  };

  return (
    <div
      className="w-full h-[200px] flex items-center justify-center border border-dotted border-primary"
      ref={setNodeRef}
      style={style}>
      {props.children}
    </div>
  );
};
