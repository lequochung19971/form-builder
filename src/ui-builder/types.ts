import { CreateArrayReturn } from '@/form/createFieldArray';
import { FieldValue, FieldValues, UseFormReturn, ValidateResult } from 'react-hook-form';
import { UIBuilderControl } from './createUIBuilder';

export type ComponentState = {
  componentName: string;
  type: string;
  name?: string;
  disabled?: boolean;
  hidden?: boolean;
  loading?: boolean;
  index?: number;
};

type BaseComponentInstance = {
  __state: ComponentState;
  __children?: Record<string, BaseComponentInstance> | Record<string, BaseComponentInstance>[];
  componentConfig: ComponentConfig;
  parentPaths?: ParentPath[];
  __control: ComponentControl;
};

export type ArrayFieldComponentInstance = Omit<
  BaseComponentInstance,
  '__children' | '__control'
> & {
  __children?: Record<string, BaseComponentInstance>[];
  __control: ArrayComponentControl;
};

export type FormControl = Omit<UseFormReturn, 'formState'>;
export type FormComponentInstance = Omit<BaseComponentInstance, '__children' | '__control'> & {
  __children?: Record<string, BaseComponentInstance>[];
  __control: BaseComponentControl;
  __formControl?: FormControl;
};

export type ComponentInstance = BaseComponentInstance & {
  __children?: Record<string, ComponentInstance> | Record<string, ComponentInstance>[];
} & Partial<ArrayFieldComponentInstance> &
  Partial<FormComponentInstance>;

export type PartialComponentInstance = {
  __state?: Partial<ComponentInstance['__state']>;
  __children?: Partial<ComponentInstance['__children']>;
  __control?: Partial<ComponentInstance['__control']>;
  __formControl?: Partial<ComponentInstance['__formControl']>;
  parentPaths?: Partial<ComponentInstance['parentPaths']>;
};

type BaseComponentControl = {
  getCurrent: () => ComponentInstance;
  getParents: () => ComponentInstance[];
  setComponentInstance: UIBuilderControl['_setComponentInstance'];
  getComponentInstances: UIBuilderControl['_getComponentInstances'];
  updatePartialComponentInstance: UIBuilderControl['_updatePartialComponentInstance'];

  /**
   * if parent of a component is FORM, it will return formControl
   */
  getFormControl: () => FormControl | undefined;
};

export type ArrayComponentControl = BaseComponentControl & CreateArrayReturn;
export type ComponentControl = BaseComponentControl & Partial<ArrayComponentControl>;

export type VisibilityMethodArgs = {
  control: ComponentControl;
  watches?: {
    values?: unknown[];
    states?: ComponentState[];
  };
};

export type ValidationMethod<
  TFieldValue = any,
  TFormValues extends FieldValues = FieldValues,
  TInstance extends ComponentInstance = ComponentInstance
> = (args: {
  fieldValue: TFieldValue;
  formValues: TFormValues;
  message?: string;
  params?: unknown;
  componentInstance: TInstance;
  dependentFieldValues?: any[];
}) => ValidateResult;
export type ValidationMethods = Record<`custom.${string}` | `library.${string}`, ValidationMethod>;
export type CustomValidationMethods = Record<`custom.${string}`, ValidationMethod>;

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

  fieldName?: string;
  type: ComponentType;
  componentName: string;
  /**
   * if having index,it means array
   */
  index?: number;

  parentPaths?: ParentPath[];
};

// TODO: In coming feature
export type WhenCondition = any;
type ValidationConfigMethod = {
  params?: unknown;
  message?: string;
  when?: {
    /**
     * Example:
     * * Not nested
     * `['firstName', 'lastName', ...]`
     * * Nested in object
     * `['object.user.firstName', 'object.lastName', ...]`
     * * Nested in array
     * `['array[].object.secondaryArray[].firstName', 'array[].firstName', ...]`
     */
    dependsOn: string[];
    conditions?: WhenCondition;
  };
};

export type ValidationName = `library.${string}` | `custom.${string}`;
export type ValidationConfig = Record<ValidationName, ValidationConfigMethod | boolean>;

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

export type BaseComponentConfig = {
  id: string;
  componentName: string;
  type: ComponentType;
  index?: number;
  parentId?: string;
  label?: string;
};

export type FieldComponentConfig = BaseComponentConfig & {
  fieldName: string;
};

export type ComponentConfig = BaseComponentConfig & {
  components?: ComponentConfig[];
  visibility?: VisibilityConfig;
  validations?: ValidationConfig;
  defaultValue?: any;
  // actions?: {
  //   click?: ClickAction;
  //   change?: ChangeAction;
  //   blur?: BlurAction;
  // };
  // css?: Interpolation<Theme>;
} & Partial<FieldComponentConfig>;

export type ComponentProps = {
  componentConfig: ComponentConfig;
  parentPaths: ParentPath[];
};
