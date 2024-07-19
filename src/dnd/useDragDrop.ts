import {
  useDraggable,
  UseDraggableArguments,
  useDroppable,
  UseDroppableArguments,
} from '@dnd-kit/core';
import { Disabled } from '@dnd-kit/sortable/dist/types';
import { useCombinedRefs } from '@dnd-kit/utilities';

export type UseDragDropArguments = Omit<UseDraggableArguments, 'disabled'> &
  Pick<UseDroppableArguments, 'resizeObserverConfig'> & {
    disabled?: boolean | Disabled;
  };

export const useDragDrop = ({
  id,
  attributes,
  data,
  resizeObserverConfig,
  disabled,
}: UseDragDropArguments) => {
  const { setNodeRef: setDroppableNodeRef, ...restDroppable } = useDroppable({
    id,
    data,
    disabled: typeof disabled === 'boolean' ? disabled : disabled?.droppable,
    resizeObserverConfig,
  });
  const { setNodeRef: setDraggableNodeRef, ...restDraggable } = useDraggable({
    id,
    data,
    attributes,
    disabled: typeof disabled === 'boolean' ? disabled : disabled?.droppable,
  });
  const setNodeRef = useCombinedRefs(setDroppableNodeRef, setDraggableNodeRef);
  return {
    ...restDroppable,
    ...restDraggable,
    setNodeRef,
  };
};
