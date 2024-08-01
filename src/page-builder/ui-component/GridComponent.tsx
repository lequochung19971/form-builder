import { ComponentItem } from '../PageBuilder';
import React, { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { useUIComponent } from '@/ui-builder/useUIComponent';
import { BaseComponentProps } from '../types';
import { cn } from '@/utils/uiUtils';

export type GridComponentProps = BaseComponentProps;

export const GridComponent: React.FunctionComponent<GridComponentProps> = ({
  componentConfig,
  parentPaths: parentPaths,
}) => {
  const { componentInstance } = useUIComponent({
    componentConfig,
    parentPaths: parentPaths,
  });
  const {
    props: { colNumber = 1 },
  } = componentInstance;
  const mappedParentPaths = useMemo(
    () =>
      parentPaths?.concat({
        id: componentConfig.id,
        group: componentConfig.group,
        componentName: componentConfig.componentName,
      }),
    [componentConfig.componentName, componentConfig.group, componentConfig.id, parentPaths]
  );

  return (
    <div
      className={cn('grid gap-4', {
        'grid-cols-1': colNumber,
        'grid-cols-2': colNumber,
        'grid-cols-3': colNumber,
        'grid-cols-4': colNumber,
        'grid-cols-5': colNumber,
        'grid-cols-6': colNumber,
        'grid-cols-7': colNumber,
        'grid-cols-8': colNumber,
        'grid-cols-9': colNumber,
        'grid-cols-10': colNumber,
        'grid-cols-11': colNumber,
        'grid-cols-12': colNumber,
      })}>
      <Label>{componentConfig.fieldName}</Label>

      {componentConfig?.components?.map((com, index) => (
        <ComponentItem
          key={`${com.id}-${index}`}
          componentConfig={com}
          parentId={componentConfig.id}
          parentPaths={mappedParentPaths}
          index={index}
        />
      ))}
    </div>
  );
};
