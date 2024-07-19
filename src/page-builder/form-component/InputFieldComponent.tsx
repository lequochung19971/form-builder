import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as React from 'react';
import { usePageBuilderContext } from '../PageBuilder';
import { DragDropWrapper } from '../dnd/DragDropWrapper';
import { BaseComponentProps, ComponentConfig } from '../types';
import { useFormFieldComponent } from '../hooks';

export type InputFieldComponentProps = BaseComponentProps<ComponentConfig>;
export const InputFieldComponent: React.FunctionComponent<InputFieldComponentProps> = (props) => {
  const { componentConfig, parentPaths: parentPaths, index, parentId } = props;
  const { isBuildingMode } = usePageBuilderContext();

  const { field } = useFormFieldComponent({
    componentConfig,
    parentPaths: parentPaths,
    index,
  });

  const input = (
    <div className="flex flex-col w-full space-y-2 z-10">
      <Label>{componentConfig.componentName}</Label>
      <Input data-no-dnd {...field} placeholder={`Enter a ${componentConfig.componentName}`} />
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
