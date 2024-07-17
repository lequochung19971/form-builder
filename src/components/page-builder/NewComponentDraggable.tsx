import { useDraggable } from '@dnd-kit/core';
import { Button } from '../ui/button';
import { ComponentType } from './types';
import { CSS } from '@dnd-kit/utilities';

export const NewComponentDraggable: React.FunctionComponent<{
  type: ComponentType;
  name: string;
}> = ({ type, name }) => {
  const { setNodeRef, listeners, attributes, transform, isDragging } = useDraggable({
    id: type,
    data: {
      isNew: true,
      item: {
        type,
      },
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };
  if (isDragging) return <Button ref={setNodeRef}>{name}</Button>;

  return (
    <Button ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {name}
    </Button>
  );
};
