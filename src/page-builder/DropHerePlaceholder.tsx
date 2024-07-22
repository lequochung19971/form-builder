import { ComponentConfig } from '@/ui-builder/types';
import { cn } from '@/utils/uiUtils';
import { useDroppable } from '@dnd-kit/core';
import { forwardRef } from 'react';

export const DropHerePlaceholder = forwardRef<
  any,
  { componentConfig: ComponentConfig; className?: string; parentId?: string }
>(({ className, componentConfig, parentId }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `new-${componentConfig.id}`,
    data: {
      item: {
        ...componentConfig,
        parentId,
        index: 0,
      },
    },
  });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-10 w-full flex justify-center items-center border rounded-md border-dotted border-muted-foreground text-sm',
        {
          'bg-secondary': isOver,
        },
        className
      )}>
      Drop here
    </div>
  );
});
