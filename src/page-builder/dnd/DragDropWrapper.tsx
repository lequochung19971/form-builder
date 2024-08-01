import { cn } from '@/utils/uiUtils';
import { ClientRect, UniqueIdentifier, useDndMonitor } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import React, { CSSProperties, PropsWithChildren, useDeferredValue, useState } from 'react';
import { useDragDrop } from './useDragDrop';
import { checkOverPosition } from './checkOverPosition';

export const Item: React.FunctionComponent<PropsWithChildren> = (props) => {
  return <div className={cn('border border-primary rounded-md p-2 w-fill')}>{props.children}</div>;
};

type DragDropWrapperProps = PropsWithChildren & {
  id: UniqueIdentifier;
  data: any;
  index: number;
  className?: string;
  parentId?: string;
};
export const DragDropWrapper: React.FunctionComponent<DragDropWrapperProps> = (props) => {
  const { children, data, index, className, parentId } = props;
  const [position, setPosition] = useState<'below' | 'above'>();
  const deferredPosition = useDeferredValue(position);

  useDndMonitor({
    onDragMove(event) {
      if (event.over?.id === data.id) {
        const position = checkOverPosition(
          event.active.rect.current.translated as ClientRect,
          event?.over?.rect as ClientRect
        );
        setPosition(position);
      }
    },
  });
  const { attributes, listeners, setNodeRef, transform, over, isDragging, isOver } = useDragDrop({
    id: data.id,
    data: {
      item: {
        ...data,
        parentId,
        index,
      },
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    flex: 1,
    position: 'relative',
  } as CSSProperties;

  if (isDragging) {
    return <div ref={setNodeRef} style={style} {...attributes} {...listeners}></div>;
  }

  return (
    <div>
      {!isDragging && deferredPosition === 'above' && isOver && (
        <div className="w-full h-10 bg-secondary mb-4 rounded-md"></div>
      )}
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          'p-4 border border-dotted border-muted-foreground rounded-md relative hover:border-pink-600',
          className
        )}>
        <span className="absolute top-[-16px] left-0 text-primary !text-xs">{`<${data.type} />`}</span>
        {children}
      </div>
      {!isDragging && deferredPosition === 'below' && isOver && (
        <div className="w-full h-10 bg-secondary mt-4 rounded-md"></div>
      )}
    </div>
  );
};
