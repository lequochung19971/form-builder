import { CreateArrayReturn } from '@/form/createFieldArray';
import { FieldValues, UseFormReturn, ValidateResult } from 'react-hook-form';
import { UIBuilderControl } from './createUIBuilder';
import {
  AppendRow,
  CallApiConfig,
  PassRowIdToComponent,
  SetPropsConfig,
  SetPropsConfigArrayItemData,
} from './actionMethods';
import { FormLoadDataSourceConfig } from './lifecycleActionMethods';

export interface BaseComponentProps extends Record<string, any> {
  label?: string;
  defaultValue?: any;
  disabled?: boolean;
  hidden?: boolean;
  loading?: boolean;
  readOnly?: boolean;
  // for dialog, popover, drawer, ...
  open?: boolean;
}

export type ComponentVisibilityProps = {
  disabled?: boolean;
  hidden?: boolean;
  loading?: boolean;
  readOnly?: boolean;
  // for dialog, popover, drawer, ...
  open?: boolean;
};

export interface ComponentState extends Partial<Record<string, any>> {}

export type BaseComponentInstance = {
  state: ComponentState;
  __children?: Record<string, BaseComponentInstance> | Record<string, BaseComponentInstance>[];
  props: BaseComponentProps;
  readonly componentConfig: ComponentConfig;
  readonly parentPaths?: ParentPath[];
  readonly __control: ComponentControl;
  readonly lifecycle?: LifecycleActionMethods;
  readonly actions?: EventActionMethods;
  readonly computed?: ComputedMethods;
};

export type ArrayFieldComponentInstance = Omit<
  BaseComponentInstance,
  '__children' | '__control'
> & {
  __children?: Record<string, BaseComponentInstance>[];
  readonly __control: ArrayComponentControl;
};

export type FormFieldComponentInstance = Omit<BaseComponentInstance, '__children'> & {
  __children?: Record<string, BaseComponentInstance>;
  validations?: ValidationMethods;
};

export type FormControl = Omit<UseFormReturn, 'formState'>;
export type FormComponentInstance = Omit<BaseComponentInstance, '__children' | '__control'> & {
  __children?: Record<string, BaseComponentInstance>[];
  readonly __control: BaseComponentControl;
  readonly __formControl: FormControl;
};

export type ComponentInstance = BaseComponentInstance &
  Omit<Partial<ArrayFieldComponentInstance>, '__children'> &
  Omit<Partial<FormComponentInstance>, '__children'> &
  Omit<Partial<FormFieldComponentInstance>, '__children'>;

export type PartialComponentInstance = {
  state?: Partial<ComponentInstance['state']>;
  __children?: Partial<ComponentInstance['__children']>;
  props?: Partial<ComponentInstance['props']>;
  readonly __control?: Partial<ComponentInstance['__control']>;
  readonly __formControl?: Partial<ComponentInstance['__formControl']>;
  readonly parentPaths?: Partial<ComponentInstance['parentPaths']>;
};

type BaseComponentControl = {
  getCurrent: () => ComponentInstance;
  getParentComponents: () => ComponentInstance[];
  getParentFormFieldComponents: () => ComponentInstance[];
  getComponentInstances: UIBuilderControl['_getComponentInstances'];

  updatePartialComponentProps: UIBuilderControl['_updatePartialComponentProps'];
  setComponentProps: UIBuilderControl['_setComponentProps'];

  updatePartialComponentState: (state: Partial<ComponentState>) => void;
  setComponentState: (state: ComponentState) => void;
  /**
   * if parent of a component group is `form`, it will return formControl
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

// ======== VALIDATION ========
// TODO: In coming feature
export type WhenConditionMethodCreation<
  TParams = any,
  TFieldValue = any,
  TFormValues extends FieldValues = FieldValues,
  TInstance extends ComponentInstance = ComponentInstance
> = (args: {
  fieldValue: TFieldValue;
  formValues: TFormValues;
  message?: string;
  params?: TParams;
  componentInstance: TInstance;
  dependentFieldValues?: any[];
}) => boolean;
export interface WhenConditionConfigs {
  [MethodName: string]: any;
}

export type ValidationConfig = {
  params?: any;
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
    conditions?: WhenConditionConfigs;
  };
};
export type ValidationMethodCreation<
  TParams = any,
  TFieldValue = any,
  TFormValues extends FieldValues = FieldValues,
  TInstance extends ComponentInstance = ComponentInstance
> = (args: {
  fieldValue: TFieldValue;
  formValues: TFormValues;
  message?: string;
  params?: TParams;
  componentInstance: TInstance;
  dependentFieldValues?: any[];
}) => ValidateResult;

export type ValidationMethod<
  TParams = any,
  TFieldValue = any,
  TFormValues extends FieldValues = FieldValues,
  TInstance extends ComponentInstance = ComponentInstance
> = ValidationMethodCreation<TParams, TFieldValue, TFormValues, TInstance> & {
  __config: ValidationConfig | boolean;
};
export interface ValidationConfigs {
  required?: ValidationConfig | boolean;
  maxLength?: ValidationConfig;
  minLength?: ValidationConfig;
}
export interface ValidationMethods extends Partial<Record<string, ValidationMethod>> {}
export interface ValidationMethodCreations
  extends Partial<Record<string, ValidationMethodCreation>> {}
// ======== VALIDATION ========

type DependencyValues<TProps = any, TState = any, TFieldValues = any[]> = {
  props?: {
    previous?: TProps;
    new?: TProps;
  };
  state?: {
    previous?: TState;
    new?: TState;
  };
  /**
   * Field value of field components in form.
   */
  fields?: {
    previous?: TFieldValues;
    new?: TFieldValues;
  };
};

// ======== LIFECYCLE ========
export type LifecycleActionMethodCreation<
  TParams = any,
  TProps = any,
  TState = any,
  TFieldValues = any[],
  TInstance extends ComponentInstance = ComponentInstance
> = (args: {
  params?: TParams;
  dependencies?: DependencyValues<TProps, TState, TFieldValues>;
  componentInstance: TInstance;
}) => void;

export type LifecycleActionMethodCreations = Partial<Record<string, LifecycleActionMethodCreation>>;

export type LifecycleActionMethod<
  TParams = any,
  TProps = any,
  TState = any,
  TFieldValues = any[],
  TInstance extends ComponentInstance = ComponentInstance
> = LifecycleActionMethodCreation<TParams, TProps, TState, TFieldValues, TInstance> & {
  __config: LifecycleActionConfig;
};
export type LifecycleActionMethods = {
  /**
   * Did mount
   */
  mount?: Partial<Record<string, LifecycleActionMethod>>;

  /**
   * Did update
   */
  update?: Partial<Record<string, LifecycleActionMethod>>;

  /**
   * Did mount and did update
   */
  mountAndUpdate?: Partial<Record<string, LifecycleActionMethod>>;

  /**
   * Will unmount
   */
  unmount?: Partial<Record<string, LifecycleActionMethod>>;
};

export interface LifecycleActionConfig<TParams extends Record<string, any> = Record<string, any>> {
  params?: TParams;
  /**
   * Use for `update` and `mountAndUpdate` lifecycle. They will be triggered depends on `dependencies` config
   * if dependencies is empty array `[]` or `undefined`, it just trigger at `didMount`.
   */
  dependencies?: {
    props?: string[];
    state?: string[];

    /**
     * Watch field value of field components in form.
     */
    fields?: string[];
  };
}
export interface LifecycleActionConfigs {
  'form.loadDataSource'?: LifecycleActionConfig<FormLoadDataSourceConfig>;
}

export type LifecycleName = keyof LifecycleConfigs;
export type LifecycleConfigs = {
  // Did mount
  mount?: LifecycleActionConfigs;

  // Did update
  update?: LifecycleActionConfigs;

  // Did mount and did update
  mountAndUpdate?: LifecycleActionConfigs;

  // Did unmount
  unmount?: LifecycleActionConfigs;
};
// ======== LIFECYCLE ========

// ======== ACTIONS ========
export type ActionMethodCreation<
  TConfig = any,
  TProps extends BaseComponentProps = BaseComponentProps,
  TState extends ComponentState = ComponentState,
  TEvent = any,
  TInstance extends ComponentInstance = ComponentInstance
> = (args: {
  config: TConfig;
  props?: TProps;
  state?: TState;
  event?: TEvent;
  componentInstance: TInstance;
}) => void;
export interface ActionMethodCreations extends Partial<Record<string, ActionMethodCreation>> {}

export type ActionMethod<
  TProps extends BaseComponentProps = BaseComponentProps,
  TEvent = any,
  TInstance extends ComponentInstance = ComponentInstance
> = (args: { event?: TEvent; componentInstance: TInstance; props?: TProps }) => void;

export type ActionMethods = Partial<Record<string, ActionMethod>>;
export interface ActionConfigs {
  setProps?: SetPropsConfig;
  passRowIdToComponent?: PassRowIdToComponent;
  appendRow?: AppendRow;
  prependRow?: AppendRow;
  callApi?: CallApiConfig;
  setPropsFromArrayItemData?: SetPropsConfigArrayItemData;
  updateUser?: boolean;
}
export interface EventActionConfigs {
  onClick?: ActionConfigs;
  onChange?: ActionConfigs;
  onBlur?: ActionConfigs;
  onFocus?: ActionConfigs;

  // For form
  onSubmit?: ActionConfigs;

  // For dialog
  onClose?: ActionConfigs;
  // ...Will expand based on demands
}

/**
 * `click, submit, focus, blur` ...
 */
type EventName = keyof EventActionConfigs;
export interface EventActionMethods extends Partial<Record<EventName, ActionMethods>> {}
// ======== ACTIONS ========

// ======== COMPUTED ========
export type ComputedMethodCreation<
  TParams = any,
  TProps = any,
  TState = any,
  TFieldValues = any[],
  TReturn = any,
  TInstance extends ComponentInstance = ComponentInstance
> = (args: {
  params?: TParams;
  dependencies?: DependencyValues<TProps, TState, TFieldValues>;
  componentInstance: TInstance;
}) => TReturn;

export type ComputedMethodCreations = Partial<Record<string, ComputedMethodCreation>>;

export type ComputedMethod<
  TParams = any,
  TProps = any,
  TState = any,
  TFieldValues = any[],
  TReturn = any,
  TInstance extends ComponentInstance = ComponentInstance
> = ComputedMethodCreation<TParams, TProps, TState, TFieldValues, TReturn, TInstance> & {
  __config: ComputedConfig;
};

export type ComputedMethods = Partial<{
  [K: string]: ComputedMethod;
}>;

export type ComputedConfig = {
  params?: any;
  dependencies?: {
    props?: string[];
    state?: string[];

    /**
     * Watch field value of field components in form.
     */
    fields?: string[];
  };
};

export interface ComputedConfigs {
  [K: string]: ComputedConfig;
}

export type VisibilityConfig = {
  disabled?: boolean;
  hide?: boolean;
  loading?: boolean;
};

export interface BaseComponentPropsConfigs extends Record<string, any> {
  label?: string;
  defaultValue?: any;
  grid?: {
    cols?: number;
    colSpan?: number;
  };
}

export interface BaseComponentConfig<
  TCType = any,
  TProps extends BaseComponentPropsConfigs = BaseComponentPropsConfigs,
  TState = any
> {
  id: string;
  componentName: string;
  type?: TCType;
  group: ComponentGroup;
  parentId?: string;
  index?: number;
  lifecycle?: LifecycleConfigs;
  actions?: EventActionConfigs;
  props?: TProps;
  state?: TState;
  computed?: ComputedConfigs;
}

export type FieldComponentConfig<TCType = any> = BaseComponentConfig<TCType> & {
  fieldName: string;
  validations?: ValidationConfigs;
};

export type ComponentConfig<TCType = any> = BaseComponentConfig<TCType> & {
  components?: ComponentConfig<TCType>[];
} & Partial<FieldComponentConfig<TCType>>;

export type ComponentMeta = Partial<Record<string, any>>;
export type ComponentProps = {
  componentConfig: ComponentConfig;
  parentPaths: ParentPath[];

  // TODO: Some meta/custom information (Incoming feature)
  meta?: ComponentMeta;
};
