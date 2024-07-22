import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as React from 'react';
import { DragDropWrapper } from '../dnd/DragDropWrapper';
import { usePageBuilderContext } from '../PageBuilder';
import { useUIComponent } from '@/ui-builder/useUIComponent';
import { BaseComponentProps } from '../types';

export type InputComponentProps = BaseComponentProps;
export const InputComponent: React.FunctionComponent<InputComponentProps> = (props) => {
  const { componentConfig, parentPaths: parentPaths, index, parentId } = props;
  const { isBuildingMode } = usePageBuilderContext();

  useUIComponent({
    componentConfig,
    parentPaths: parentPaths,
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
