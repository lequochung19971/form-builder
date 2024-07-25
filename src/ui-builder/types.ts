import { CreateArrayReturn } from '@/form/createFieldArray';
import { FieldValues, UseFormReturn, ValidateResult } from 'react-hook-form';
import { UIBuilderControl } from './createUIBuilder';

export type ComponentState = {
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

export type ParentPath = {
  // Parent Id
  id: string;

  fieldName?: string;
  group: ComponentGroup;
  componentName: string;
  /**
   * if having index,it means array
   */
  index?: number;

  parentPaths?: ParentPath[];
};

export type ComponentGroup = 'ui' | 'form' | 'form-field' | 'form-array-field';

// VALIDATION
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
export type ValidationMethods = Record<string, ValidationMethod>;
export type CustomValidationMethodName = `custom.${string}`;
export type CustomValidationMethods = Record<CustomValidationMethodName, ValidationMethod>;
export type ValidationConfig = Record<string, ValidationConfigMethod | boolean>;

export type WatchConfig = string[] | string;
export type Watch = {
  values?: WatchConfig;
  states?: WatchConfig;
};

// ACTIONS
export type ActionMethod<
  TEvent extends React.SyntheticEvent = React.SyntheticEvent,
  TInstance extends ComponentInstance = ComponentInstance,
  TConfig extends ActionConfigs = ActionConfigs
> = (args: { event: TEvent; componentInstance: TInstance; config?: TConfig }) => void;

type BuiltInActionConfigs = {
  showComponent: {
    targetComponentName: string;
  };
};

export type ActionMethods = Record<string, ActionMethod>;
export type CustomMethodName = `custom.${string}`;
export type CustomActionMethods = Record<CustomMethodName, ActionMethod>;
type CustomActionConfigs = Record<CustomMethodName, any>;
export type ActionConfigs = (BuiltInActionConfigs & CustomActionConfigs) | boolean;
export type ComponentActions = {
  click?: ActionConfigs;
  change?: ActionConfigs;
  blur?: ActionConfigs;
  focus?: ActionConfigs;
  // Will expand based on demands
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

export enum ComponentType {}

export interface BaseComponentConfig {
  id: string;
  componentName: string;
  type?: ComponentType | any;
  group: ComponentGroup;
  index?: number;
  parentId?: string;
  label?: string;
}

export type FieldComponentConfig = BaseComponentConfig & {
  fieldName: string;
};

export type ComponentConfig = BaseComponentConfig & {
  components?: ComponentConfig[];
  visibility?: VisibilityConfig;
  validations?: ValidationConfig;
  defaultValue?: any;
  actions?: ComponentActions;
  // css?: Interpolation<Theme>;
} & Partial<FieldComponentConfig>;

export type ComponentProps = {
  componentConfig: ComponentConfig;
  parentPaths: ParentPath[];
};
