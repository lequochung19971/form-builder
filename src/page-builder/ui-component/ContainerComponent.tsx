import { ComponentItem } from '../PageBuilder';
import React, { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { useUIComponent } from '@/ui-builder/useUIComponent';
import { BaseComponentProps } from '../types';

export type ContainerComponentProps = BaseComponentProps;

export const ContainerComponent: React.FunctionComponent<ContainerComponentProps> = (props) => {
  const { componentConfig, parentPaths: parentPaths } = props;

  useUIComponent({
    componentConfig,
    parentPaths: parentPaths,
  });

  const mappedParentPaths = useMemo(
    () =>
      parentPaths?.concat({
        id: componentConfig.id,
        type: componentConfig.type,
        componentName: componentConfig.componentName,
      }),
    [componentConfig.componentName, componentConfig.id, componentConfig.type, parentPaths]
  );

  return (
    <div>
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
