import React, { CSSProperties, useMemo } from 'react';
import { UniqueIdentifier, useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { Item, SortableItem } from './SortableItem';
import { DataItem, DropHerePlaceholder, flattenTree } from './DndTest';

const containerStyle: CSSProperties = {
  background: '#dadada',
  padding: '50px 10px 25px',
  flex: 1,
  borderRadius: 8,
  border: '1px solid #ababab',
  display: 'flex',
  alignSelf: 'stretch',
  minHeight: 50,
};

type ContainerProps = {
  children: React.ReactNode;
  row?: boolean;
  style?: CSSProperties;
  className?: string;
};

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>((props, ref) => {
  const { children, style = {}, className } = props;

  return (
    <div className="space-y-4 p-4 border border-pink-600 rounded-md" ref={ref} style={style}>
      {children}
    </div>
  );
});

type SortableContainerProps = {
  data: DataItem;
  id: UniqueIdentifier;
  style?: CSSProperties;
  index: number;
};

export default function SortableContainer(props: SortableContainerProps) {
  const { data, id, index } = props;

  const items = data?.children ?? [];
  const itemIds = items.map((item) => item.id);

  const { isOver, setNodeRef } = useDroppable({
    id: `new-${id}`,
    data: {
      isNew: true,
      item: {
        ...data,
        index,
      },
    },
  });

  if (isOver) {
    console.log('SortableContainer is over', id);
  }

  const flattenedChildren = useMemo(() => flattenTree(data.children ?? []), [data.children]);

  return (
    <SortableItem
      id={id}
      data={data}
      index={index}
      className="px-4 py-8 border border-pink-600 rounded-md">
      {data.id}
      {!itemIds.length && (
        <DropHerePlaceholder ref={setNodeRef} isOver={isOver} className="h-[200px]" />
      )}

      <div className="py-4 space-y-4 ">
        {items.map((item, index) => {
          if (item.type === 'container') {
            return <SortableContainer key={item.id} id={item.id} data={item} index={index} />;
          }

          return (
            <SortableItem key={item.id} id={item.id} data={item} index={index}>
              {<Item>{item.id}</Item>}
            </SortableItem>
          );
        })}
      </div>
    </SortableItem>
  );
}
