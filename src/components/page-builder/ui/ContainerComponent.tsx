import { ComponentConfig, BaseComponentProps, ComponentInstance } from '../types';
import { ComponentItem } from '../PageBuilder';
import React, { useMemo } from 'react';
import { css } from '@emotion/react';
import { Label } from '@/components/ui/label';
import { useUIComponent } from '../hooks';

export type ContainerComponentProps = BaseComponentProps<ComponentConfig>;

export const ContainerComponent: React.FunctionComponent<ContainerComponentProps> = (props) => {
  const { componentConfig, parentPaths: parentPaths, index } = props;

  useUIComponent({
    componentConfig,
    parentPaths: parentPaths,
    index,
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
      <Label>{componentConfig.name}</Label>
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
