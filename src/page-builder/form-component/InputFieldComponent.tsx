import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as React from 'react';
import { usePageBuilderContext } from '../PageBuilder';
import { DragDropWrapper } from '../dnd/DragDropWrapper';
import { useFormFieldComponent } from '@/ui-builder/useFormFieldComponent';
import { BaseComponentProps } from '../types';
import { cn } from '@/utils/uiUtils';

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  return (
    <p ref={ref} className={cn('text-sm font-medium text-destructive', className)} {...props}>
      {children}
    </p>
  );
});

export type InputFieldComponentProps = BaseComponentProps;
export const InputFieldComponent: React.FunctionComponent<InputFieldComponentProps> = (props) => {
  const { componentConfig, parentPaths: parentPaths, index, parentId } = props;
  const { isBuildingMode } = usePageBuilderContext();

  const { field, componentInstance, fieldState } = useFormFieldComponent({
    componentConfig,
    parentPaths: parentPaths,
  });
  const {
    props: { label },
  } = componentInstance;
  const error = fieldState.error;

  const input = (
    <div className="flex flex-col w-full space-y-2 z-10">
      <Label>{label}</Label>
      <Input
        data-no-dnd
        {...field}
        disabled={componentInstance.props.visibility?.disabled}
        placeholder={`Enter a ${label}`}
      />
      {!!fieldState.error?.message && <FormMessage>{fieldState.error?.message}</FormMessage>}
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
