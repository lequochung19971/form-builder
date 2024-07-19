import React, {
  CSSProperties,
  PropsWithChildren,
  useDeferredValue,
  useMemo,
  useState,
} from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/utils/uiUtils';
import { ClientRect, UniqueIdentifier, useDndContext, useDndMonitor } from '@dnd-kit/core';
import { DataItem } from './DndTest';
import { useDragDrop } from './useDragDrop';

export const checkPosition = (activeRect: ClientRect, overRect: ClientRect) => {
  if (!activeRect || !overRect) return;

  const activePoint = activeRect.top;
  const overMidPoint = overRect.top + overRect.height / 2;

  if (activePoint < overMidPoint) {
    return 'above';
  } else if (activePoint > overMidPoint) {
    return 'below';
  }
};

export const Item: React.FunctionComponent<PropsWithChildren> = (props) => {
  return <div className={cn('border border-primary rounded-md p-2 w-fill')}>{props.children}</div>;
};

type SortableItemProps = PropsWithChildren & {
  handlePosition?: 'top' | 'right';
  id: UniqueIdentifier;
  data: DataItem;
  index: number;
  className?: string;
};
export const SortableItem: React.FunctionComponent<SortableItemProps> = (props) => {
  const { children, data, index, className } = props;
  const [position, setPosition] = useState<'below' | 'above'>();
  const deferredPosition = useDeferredValue(position);

  useDndMonitor({
    onDragMove(event) {
      if (event.over?.id === data.id) {
        const position = checkPosition(
          event.active.rect.current.translated as ClientRect,
          event?.over.rect as ClientRect
        );
        setPosition(position);
      }
    },
  });
  const { attributes, listeners, setNodeRef, transform, over, active, isDragging, isOver } =
    useDragDrop({
      id: data.id,
      data: {
        item: {
          ...data,
          index,
        },
      },
    });

  if (over?.data.current?.item.type === 'container') {
    console.log('is over container');
    console.log(deferredPosition, isOver);
  }

  const style = {
    transform: CSS.Translate.toString(transform),
    flex: 1,
    position: 'relative',
  } as CSSProperties;

  if (isDragging) {
    return <div style={style} ref={setNodeRef} {...attributes} {...listeners}></div>;
  }

  return (
    <>
      {deferredPosition === 'above' && isOver && (
        <div className="w-full h-10 bg-secondary mb-4"></div>
      )}
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn('drag-drop', className)}>
        {children}
      </div>
      {deferredPosition === 'below' && isOver && (
        <div className="w-full h-10 bg-secondary mt-4"></div>
      )}
    </>
  );
};
