import { CreateArrayReturn } from '@/form/createFieldArray';
import { FieldValues, UseFormReturn, ValidateResult } from 'react-hook-form';
import { UIBuilderControl } from './createUIBuilder';
import { AppendRow, PassRowIdToComponent, SetVisibilityConfig } from './actionMethods';

export interface BaseComponentProps extends Record<string, any> {
  label?: string;
  visibility?: ComponentVisibilityProps;
  validations?: ValidationMethods;
  defaultValue?: any;
  actions?: EventActionMethods;
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

type BaseComponentInstance = {
  state: ComponentState;
  __children?: Record<string, BaseComponentInstance> | Record<string, BaseComponentInstance>[];
  props: BaseComponentProps;
  readonly componentConfig: ComponentConfig;
  readonly parentPaths?: ParentPath[];
  readonly __control: ComponentControl;
  readonly __lifecycle?: LifecycleActionMethods;
};

export type ArrayFieldComponentInstance = Omit<
  BaseComponentInstance,
  '__children' | '__control'
> & {
  __children?: Record<string, BaseComponentInstance>[];
  readonly __control: ArrayComponentControl;
};

export type FormControl = Omit<UseFormReturn, 'formState'>;
export type FormComponentInstance = Omit<BaseComponentInstance, '__children' | '__control'> & {
  __children?: Record<string, BaseComponentInstance>[];
  readonly __control: BaseComponentControl;
  readonly __formControl: FormControl;
};

export type ComponentInstance = BaseComponentInstance & {
  __children?: Record<string, ComponentInstance> | Record<string, ComponentInstance>[];
} & Partial<ArrayFieldComponentInstance> &
  Partial<FormComponentInstance>;

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
export type WhenCondition = any;
export type ValidationConfigMethod<TParams = any> = {
  params?: TParams;
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

export type ValidationMethodCreation<
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

export type ValidationMethod<
  TFieldValue = any,
  TFormValues extends FieldValues = FieldValues,
  TInstance extends ComponentInstance = ComponentInstance
> = ((args: {
  fieldValue: TFieldValue;
  formValues: TFormValues;
  message?: string;
  params?: unknown;
  componentInstance: TInstance;
  dependentFieldValues?: any[];
}) => ValidateResult) & {
  __config: ValidationConfigMethod | boolean;
};

export interface ValidationConfig {
  required?: ValidationConfigMethod | boolean;
  maxLength?: ValidationConfigMethod;
  minLength?: ValidationConfigMethod;
}
export interface ValidationMethods extends Partial<Record<string, ValidationMethod>> {}
export interface ValidationMethodCreations
  extends Partial<Record<string, ValidationMethodCreation>> {}

// ======== VALIDATION ========

// export type WatchConfig = string[] | string;
// export type Watch = {
//   values?: WatchConfig;
//   states?: WatchConfig;
// };

export type LifecycleActionMethodCreation<
  TParams = any,
  TProps = any,
  TState = any,
  TFieldValues = any[],
  TInstance extends ComponentInstance = ComponentInstance
> = (args: {
  params?: TParams;
  dependencies?: {
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

export interface LifecycleActionConfig {
  params?: any;
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
  test?: LifecycleActionConfig;
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

// ======== ACTIONS ========
export type ActionMethodCreation<
  TConfig = any,
  TProps extends BaseComponentProps = BaseComponentProps,
  TState extends ComponentState = ComponentState,
  TEvent extends React.SyntheticEvent = React.SyntheticEvent,
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
  TEvent extends React.SyntheticEvent = React.SyntheticEvent,
  TInstance extends ComponentInstance = ComponentInstance
> = (args: { event: TEvent; componentInstance: TInstance; props?: TProps }) => void;

export type ActionMethods = Partial<Record<string, ActionMethod>>;
export interface ActionConfigs {
  setVisibility?: SetVisibilityConfig;
  passRowIdToComponent?: PassRowIdToComponent;
  appendRow?: AppendRow;
  prependRow?: AppendRow;
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

export type VisibilityConfig = {
  disabled?: boolean;
  hide?: boolean;
  loading?: boolean;
};

export interface BaseComponentPropsConfigs extends Record<string, any> {
  label?: string;
  visibility?: VisibilityConfig;
  validations?: ValidationConfig;
  defaultValue?: any;
  actions?: EventActionConfigs;
}

export interface BaseComponentConfig<TCType = any> {
  id: string;
  componentName: string;
  type?: TCType;
  group: ComponentGroup;
  index?: number;
  parentId?: string;
  lifecycle?: LifecycleConfigs;
  effect?: EffectActionConfigs;
}

export type FieldComponentConfig<TCType = any> = BaseComponentConfig<TCType> & {
  fieldName: string;
};

export type ComponentConfig<TCType = any> = BaseComponentConfig<TCType> & {
  components?: ComponentConfig<TCType>[];
  props?: BaseComponentPropsConfigs;
  // css?: Interpolation<Theme>;
} & Partial<FieldComponentConfig<TCType>>;

export type ComponentProps = {
  componentConfig: ComponentConfig;
  parentPaths: ParentPath[];
};

// {

//   effect: {
//     test: {
//       params: any;
//       dependencies: {
//         props: [],
//         states: [],
//       }
//     },
//     test: {
//       params: any;
//       dependencies: {
//         props: [],
//         states: [],
//       }
//     }
//   }
// }
