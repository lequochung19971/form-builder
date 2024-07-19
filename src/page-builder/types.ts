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
  componentName: string;
  type: string;
  name?: string;
  disabled?: boolean;
  hidden?: boolean;
  loading?: boolean;
  index?: number;
};

export type ComponentInstance = {
  __state: CState;
  __children?: Record<string, ComponentInstance> | Record<string, ComponentInstance>[];
  componentConfig: ComponentConfig;
  parentPaths?: ParentPath[];
  __control: ComponentControl;
  /**
   * if ComponentType is FORM, it will have __formControl
   */
  __formControl?: Omit<UseFormReturn<FieldValues, any>, 'formState'>;
};

export type PartialComponentInstance = {
  __state?: Partial<CState>;
  __children?: Record<string, ComponentInstance> | Record<string, ComponentInstance>[];
  __control?: Partial<ComponentControl>;
  parentPaths?: ParentPath[];

  /**
   * if ComponentType is FORM, it will have __formControl
   */
  __formControl?: Omit<UseFormReturn<FieldValues, any>, 'formState'>;
};

export type FormComponentControl = Omit<UseFormReturn<FieldValues, any>, 'formState'>;

export type ComponentArrayControl = CreateArrayReturn & {
  append: (value: Record<string, any>) => void;
  remove: (index: number) => void;
  set: (arrayFields: Record<string, unknown>[]) => void;
};

export type ComponentControl = {
  getCurrent: () => ComponentInstance;
  getParents: () => ComponentInstance[];
  setComponentInstance: (name: string, componentState: PartialComponentInstance) => void;
  getComponentInstances: (name: string | string[]) => ComponentInstance | ComponentInstance[];
  setComponentInstances: (instances: Record<string, ComponentInstance>) => void;

  /**
   * if parent of a component is FORM, it will return formControl
   */
  getFormControl: () => Omit<UseFormReturn<FieldValues, any>, 'formState'> | undefined;
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
  /**
   * UI components
   */
  INPUT = 'input',
  BUTTON = 'button',
  CONTAINER = 'container',
  PAGE = 'page',
  FORM = 'form',
  DIALOG = 'dialog',
  TABS = 'tabs',
  TAB = 'tab',
  COLUMN = 'column',

  /**
   * Data components
   * Components are used inside Form component and used to collected data
   */
  INPUT_FIELD = 'inputField',
  OBJECT_CONTAINER = 'objectContainer',
  ARRAY_CONTAINER = 'arrayContainer',
  SUBMIT_BUTTON = 'submitButton',
  DATA_TABLE = 'dataTable',
}

export type ParentPath = {
  // Parent Id
  id: string;

  name?: string;
  type: ComponentType;
  componentName: string;
  /**
   * if having index,it means array
   */
  index?: number;

  parentPaths?: ParentPath[];
};

export type BaseComponentProps<T extends ComponentConfig = ComponentConfig> = {
  componentConfig: T;
  parentPaths: ParentPath[];
  index: number;
  parentId?: string;
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
  componentName: string;
  type: ComponentType;

  index?: number;

  parentId?: string;

  /**
   * A field name, it is using to collect data
   */
  name?: string;

  // For Array Component
  // innerComponents?: ComponentConfig[];

  components?: ComponentConfig[];

  children?: React.ReactNode;
  label?: string;
  placeholder?: string;
  visibility?: VisibilityConfig;
  validations?: ValidationConfigs;
  defaultValue?: any;
  // actions?: {
  //   click?: ClickAction;
  //   change?: ChangeAction;
  //   blur?: BlurAction;
  // };
  // css?: Interpolation<Theme>;

  // Table
};
