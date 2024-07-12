import { Interpolation, Theme } from '@emotion/react';
import {
  UseFormReturn,
  FieldValues,
  ValidateResult,
  FieldError,
  DeepPartial,
} from 'react-hook-form';
import { CreateArrayReturn } from './createFieldArray';

export type CState = {
  name: string;
  type: string;
  disabled?: boolean;
  hidden?: boolean;
  loading?: boolean;
  invalid?: boolean;
  isTouched?: boolean;
  isDirty?: boolean;
  error?: FieldError;
  index?: number;
};

export type ComponentInstance = {
  __state: CState;
  __children?: Record<string, ComponentInstance> | Record<string, ComponentInstance>[];
  componentConfig: ComponentConfig;
  parentPaths?: ParentPath[];
  __control: ComponentControl;
};

export type PartialComponentInstance = {
  __state?: Partial<CState>;
  __children?: Record<string, ComponentInstance> | Record<string, ComponentInstance>[];
  __control?: ComponentControl;
  parentPaths?: ParentPath[];
};

export type ComponentArrayControl = CreateArrayReturn & {
  append: (value: Record<string, any>) => void;
  remove: (index: number) => void;
  generateInnerComponentInstances: (arrayFields: Record<string, unknown>[]) => void;
};

export type FormBuilderControl = {
  setComponentInstance: (name: string, componentState: PartialComponentInstance) => void;
  getComponentInstances: (name: string | string[]) => ComponentInstance | ComponentInstance[];
  setComponentInstances: React.Dispatch<React.SetStateAction<Record<string, ComponentInstance>>>;
  getForm: () => UseFormReturn<FieldValues, any, FieldValues>;
};

export type ComponentControl = FormBuilderControl & {
  getCurrent: () => ComponentInstance;
  getParents: () => ComponentInstance[];
} & Partial<ComponentArrayControl>;

export type VisibilityMethodArgs = {
  control: ComponentControl;
  watches?: {
    values?: unknown[];
    states?: CState[];
  };
};

type ValidationConfig<TFieldValue, TFormValues> = (
  fieldValue: TFieldValue,
  formValues: TFormValues,
  componentControl: ComponentControl
) => ValidateResult;

type ActionArgs<TEvent> = {
  event: TEvent;
  control: ComponentControl;
};

type ClickAction = (args: ActionArgs<React.MouseEvent<HTMLElement>>) => void;
type ChangeAction = (args: ActionArgs<React.ChangeEvent<HTMLElement>>) => void;
type BlurAction = (args: ActionArgs<React.FocusEvent<HTMLElement>>) => void;

export enum ComponentType {
  INPUT = 'input',
  BUTTON = 'button',
  OBJECT_CONTAINER = 'objectContainer',
  ARRAY_CONTAINER = 'arrayContainer',
}

export type ParentPath = {
  name: string;
  /**
   * if having index,it means array
   */
  index?: number;
};

export type BaseComponentProps<T extends ComponentConfig = ComponentConfig> = {
  componentConfig: T;
  parentPaths: ParentPath[];
};

export type BaseComponentConfig = {
  id: string;
  name: string;
};

export type ValidationConfigs = Record<string, ValidationConfig<any, Record<string, any>>>;

export type WatchConfig = string[] | string;

export type Watch = {
  values?: WatchConfig;
  states?: WatchConfig;
};

export type VisibilityConfig = {
  disabled?:
    | {
        method: (args: VisibilityMethodArgs) => boolean;
        watch?: Watch;
      }
    | boolean;
  hide?:
    | {
        method: (args: VisibilityMethodArgs) => boolean;
        watch?: Watch;
      }
    | boolean;
};

export type ComponentConfig = {
  id: string;
  name: string;
  type: ComponentType;
  // For Array Component
  innerComponents?: ComponentConfig[];

  // For Objet Component
  components?: ComponentConfig[];

  children?: React.ReactNode;
  label?: string;
  placeholder?: string;
  visibility?: VisibilityConfig;
  validations?: ValidationConfigs;
  actions?: {
    click?: ClickAction;
    change?: ChangeAction;
    blur?: BlurAction;
  };
  css?: Interpolation<Theme>;
};
