import { ComponentConfig, ComponentType, ParentPath } from '../types';
import { ArrayComponentProps, ArrayComponent } from './ArrayComponent';
import ButtonComponent, { ButtonComponentProps } from './ButtonComponent';
import InputComponent, { InputComponentProps } from './InputComponent';
import { ObjectComponent, ObjectComponentProps } from './ObjectComponent';

export const configuredComponents = {
  [ComponentType.INPUT]: InputComponent,
  [ComponentType.OBJECT_CONTAINER]: ObjectComponent,
  [ComponentType.BUTTON]: ButtonComponent,
  [ComponentType.ARRAY_CONTAINER]: ArrayComponent,
};

export type AllComponentProps = Partial<
  Omit<
    InputComponentProps & ObjectComponentProps & ArrayComponentProps & ButtonComponentProps,
    'componentConfig'
  >
> & {
  componentConfig: ComponentConfig;
  parentPaths: ParentPath[];
};
