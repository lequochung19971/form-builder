import { Input, InputProps } from '@/components/ui/input';
import * as React from 'react';
import { BaseComponentProps, ComponentConfig } from '../types';
import { useFormBuilderContext } from '../PageBuilder';
import { Label } from '@/components/ui/label';
import { DragDropWrapper } from '../dnd/DragDropWrapper';
import { useUIComponent } from '../hooks';

export type InputComponentProps = BaseComponentProps<ComponentConfig>;
export const InputComponent: React.FunctionComponent<InputComponentProps> = (props) => {
  const { componentConfig, parentPaths: parentPaths, index, parentId } = props;
  const { isBuildingMode } = useFormBuilderContext();

  const { componentInstance: componentInstance } = useUIComponent({
    componentConfig,
    parentPaths: parentPaths,
    index,
  });

  const input = (
    <div className="flex flex-col w-full space-y-2 z-10">
      <Label>{componentConfig.componentName}</Label>
      <Input data-no-dnd placeholder={`Enter a ${componentConfig.componentName}`} />
    </div>
  );

  if (isBuildingMode) {
    return (
      <DragDropWrapper
        index={index}
        id={componentConfig.id}
        data={componentConfig}
        parentId={parentId}>
        {input}
      </DragDropWrapper>
    );
  }

  return input;
};
