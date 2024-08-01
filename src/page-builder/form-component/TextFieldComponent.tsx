import { useFormFieldComponent } from '@/ui-builder/useFormFieldComponent';
import { BaseComponentProps } from '../types';
import { cn } from '@/utils/uiUtils';
import { forwardRef } from 'react';
export type TextFieldComponentProps = BaseComponentProps;

const TextFieldComponent: React.FunctionComponent<TextFieldComponentProps> = ({
  componentConfig,
  parentPaths: parentPaths,
}) => {
  const { field } = useFormFieldComponent({
    componentConfig,
    parentPaths: parentPaths,
  });

  return <span>{field.value}</span>;
};

export default TextFieldComponent;
