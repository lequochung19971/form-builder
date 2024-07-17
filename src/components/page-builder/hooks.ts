import { useSubscribe } from '@/hooks/useSubscribe';
import { get } from 'lodash';
import React, {
  useMemo,
  useRef,
  useEffect,
  createContext,
  useContext,
  PropsWithChildren,
} from 'react';
import {
  useFormContext,
  FieldValues,
  InternalFieldName,
  useController,
  UseFormReturn,
  FormState,
} from 'react-hook-form';
import { ComponentItemProps, useFormBuilderContext } from './PageBuilder';
import {
  createMappedFieldNameForValues,
  createMappedFieldNameForComponentInstances,
} from './createAppBuilder';
import { ComponentInstance } from './types';
import shouldRenderFormState from '@/logic/shouldRenderFormState';
import getProxyFormState from '@/logic/getProxyFormState';
import { useFormComponentContext } from './form/FormComponentContext';

export const useArrayFieldComponent = (props: ComponentItemProps) => {
  const { componentConfig, parentPaths: parentPaths } = props;

  const { validations: validations = {} } = componentConfig;

  const form = useFormComponentContext();
  const { control } = form;

  const { componentInstances } = useFormBuilderContext();
  const { mappedFieldValueName } = createMappedFieldNameForValues(
    componentConfig.name!,
    parentPaths
  );

  const { mappedComponentInstanceName } = createMappedFieldNameForComponentInstances(
    componentConfig.componentName,
    parentPaths
  );

  const componentInstance = useMemo(
    () => get(componentInstances, mappedComponentInstanceName),
    [componentInstances, mappedComponentInstanceName]
  );

  const [fields, setFields] = React.useState(
    control._getFieldArray(mappedFieldValueName) as Record<string, string>[]
  );

  const _fieldsRef = React.useRef(fields);
  const _name = React.useRef(mappedFieldValueName);

  _name.current = mappedFieldValueName;
  _fieldsRef.current = fields;
  control._names.array.add(mappedFieldValueName);

  // props.rules &&
  //   (control as Control<TFieldValues>).register(
  //     name as FieldPath<TFieldValues>,
  //     props.rules as RegisterOptions<TFieldValues>,
  //   );

  const observer = (updateFields: Record<string, string>[]) => {
    setFields([...updateFields]);
  };
  const observerRef = useRef(observer);
  observerRef.current = observer;

  React.useEffect(() => {
    const reference = componentInstance.__control.watchFields?.((...args) =>
      observerRef.current(...args)
    );
    return () => {
      reference?.unwatch();
    };
  }, [componentInstance]);

  useEffect(() => {
    return () => {
      console.log('unmount', mappedComponentInstanceName);
    };
  }, [mappedComponentInstanceName]);

  useSubscribe({
    next: ({
      values,
      name: fieldArrayName,
    }: {
      values?: FieldValues;
      name?: InternalFieldName;
    }) => {
      if (fieldArrayName === mappedFieldValueName || !fieldArrayName) {
        const fieldValues = get(values, mappedFieldValueName);
        if (Array.isArray(fieldValues)) {
          // const newFields = fieldValues.map((field, index) => ({
          //   ...field,
          //   ['id']: uuidV4(),
          // }));
          // setFields(newFields);
          componentInstance.__control.setInnerComponentInstances?.(fieldValues);
        }
      }
    },
    subject: control._subjects.array,
  });

  React.useEffect(() => {
    componentInstance.__control.updateFormState?.();
  }, [fields, control, componentInstance.__control]);

  const validate = useMemo(
    () =>
      Object.entries(validations).reduce((result, [key, v]) => {
        result = {
          ...result,
          [key]: (fieldValue: unknown, formValues: Record<string, unknown>) =>
            v(fieldValue, formValues, componentInstance.__control),
        };
        return result;
      }, {}),
    [validations, componentInstance.__control]
  );

  validate &&
    control.register(mappedFieldValueName, {
      validate,
    });

  return {
    fields,
    mappedComponentInstanceName,
    mappedFieldValueName,
    parentPaths: parentPaths,
    componentInstance: componentInstance,
    components: componentInstance.__children as Record<string, ComponentInstance>[],
  };
};

export const useFormFieldComponent = (props: ComponentItemProps) => {
  const { componentConfig, parentPaths: parentPaths } = props;

  const { validations: validations = {} } = componentConfig;

  const form = useFormComponentContext();
  const { control } = form;

  const { componentInstances: componentInstances } = useFormBuilderContext();

  const { mappedFieldValueName } = createMappedFieldNameForValues(
    componentConfig.name!,
    parentPaths
  );

  const { mappedComponentInstanceName } = createMappedFieldNameForComponentInstances(
    componentConfig.name!,
    parentPaths
  );

  const componentInstance = useMemo(
    () => get(componentInstances, mappedComponentInstanceName),
    [componentInstances, mappedComponentInstanceName]
  );

  if (!componentInstance) {
    throw new Error(`There is no componentInstance: ${mappedComponentInstanceName}`);
  }

  const validate = useMemo(
    () =>
      Object.entries(validations).reduce((result, [key, v]) => {
        result = {
          ...result,
          [key]: (fieldValue: unknown, formValues: Record<string, unknown>) =>
            v(fieldValue, formValues, componentInstance.__control),
        };
        return result;
      }, {}),
    [validations, componentInstance.__control]
  );

  const controller = useController({
    control,
    name: mappedFieldValueName,
    rules: {
      validate,
    },
  });

  const { field, fieldState } = controller;
  // const memorizedFieldState = useDeepCompareMemoize(fieldState);

  // const disabledWatches = useMemo(() => {
  //   const valuesWatchConfig =
  //     typeof componentConfig.visibility?.disabled !== 'boolean'
  //       ? componentConfig.visibility?.disabled?.watch?.values ?? []
  //       : [];
  //   const componentStatesWatchConfig =
  //     typeof componentConfig.visibility?.disabled !== 'boolean'
  //       ? componentConfig.visibility?.disabled?.watch?.states ?? []
  //       : [];

  //   const valuesWatchKeys = (() => {
  //     const watchKeys: string[] | string = valuesWatchConfig;
  //     // if (typeof valuesWatchConfig === 'function') {
  //     //   watchKeys = valuesWatchConfig({
  //     //     index,
  //     //     parentName,
  //     //   });
  //     // } else {
  //     //   watchKeys = valuesWatchConfig;
  //     // }

  //     if (typeof watchKeys === 'string') return [watchKeys];

  //     return watchKeys;
  //   })();

  //   const statesWatchKeys = (() => {
  //     const watchKeys: string[] | string = componentStatesWatchConfig;
  //     // if (typeof componentStatesWatchConfig === 'function') {
  //     //   watchKeys = componentStatesWatchConfig({
  //     //     index,
  //     //     parentName,
  //     //   });
  //     // } else {
  //     //   watchKeys = componentStatesWatchConfig;
  //     // }

  //     if (typeof watchKeys === 'string') return [watchKeys];

  //     return watchKeys;
  //   })();

  //   return {
  //     valuesWatchKeys: valuesWatchKeys,
  //     statesWatchKeys: statesWatchKeys,
  //   };
  // }, [componentConfig.visibility?.disabled]);

  // const valuesWatchKeys = useMemo(
  //   () => Array.from(new Set(disabledWatches.valuesWatchKeys)),
  //   [disabledWatches.valuesWatchKeys]
  // );

  // const statesWatchKeys = useMemo(
  //   () => Array.from(new Set(disabledWatches.statesWatchKeys)),
  //   [disabledWatches.statesWatchKeys]
  // );

  // const statesWatches = useWatchComponentStates({
  //   componentInstances: componentInstances,
  //   keys: statesWatchKeys,
  // });

  // const valuesWatches = useWatch({
  //   control,
  //   name: valuesWatchKeys,
  // });

  // // Visibility
  // const disabledResult = useMemo(
  //   () =>
  //     typeof componentConfig.visibility?.disabled !== 'boolean'
  //       ? componentConfig.visibility?.disabled?.method({
  //           control: componentInstance.__control,
  //           watches: {
  //             states: statesWatches,
  //             values: valuesWatches,
  //           },
  //         })
  //       : componentConfig.visibility?.disabled,
  //   [
  //     componentConfig.visibility?.disabled,
  //     componentInstance.__control,
  //     statesWatches,
  //     valuesWatches,
  //   ]
  // );

  // useEffect(() => {
  //   if (typeof disabledResult !== 'boolean') return;

  //   const neededComponentState = {
  //     ...(memorizedFieldState ?? {}),
  //     disabled: disabledResult,
  //   };

  //   componentInstance.__control.setComponentInstance(mappedComponentInstanceName, {
  //     __state: neededComponentState,
  //   });
  // }, [
  //   disabledResult,
  //   mappedComponentInstanceName,
  //   componentConfig.type,
  //   memorizedFieldState,
  //   componentInstance.__control,
  // ]);

  return {
    mappedComponentName: mappedComponentInstanceName,
    mappedFieldName: mappedFieldValueName,
    field,
    fieldState,
    componentInstance: componentInstance,
    parentPaths: parentPaths,
  };
};

export const useUIComponent = (props: ComponentItemProps) => {
  const { componentConfig, parentPaths: parentPaths } = props;

  const { componentInstances: componentInstances } = useFormBuilderContext();

  const { mappedComponentInstanceName } = createMappedFieldNameForComponentInstances(
    componentConfig.componentName,
    parentPaths
  );

  const componentInstance = useMemo(
    () => get(componentInstances, mappedComponentInstanceName),
    [componentInstances, mappedComponentInstanceName]
  );

  if (!componentInstance) {
    throw new Error(`There is no componentInstance: ${mappedComponentInstanceName}`);
  }

  // const disabledWatches = useMemo(() => {
  //   const componentStatesWatchConfig =
  //     typeof componentConfig.visibility?.disabled !== 'boolean'
  //       ? componentConfig.visibility?.disabled?.watch?.states ?? []
  //       : [];

  //   const statesWatchKeys = (() => {
  //     const watchKeys: string[] | string = componentStatesWatchConfig;
  //     // if (typeof componentStatesWatchConfig === 'function') {
  //     //   watchKeys = componentStatesWatchConfig({
  //     //     index,
  //     //     parentName,
  //     //   });
  //     // } else {
  //     //   watchKeys = componentStatesWatchConfig;
  //     // }

  //     if (typeof watchKeys === 'string') return [watchKeys];

  //     return watchKeys;
  //   })();

  //   return {
  //     statesWatchKeys: statesWatchKeys,
  //   };
  // }, [componentConfig.visibility?.disabled]);

  // const statesWatchKeys = useMemo(
  //   () => Array.from(new Set(disabledWatches.statesWatchKeys)),
  //   [disabledWatches.statesWatchKeys]
  // );

  // const statesWatches = useWatchComponentStates({
  //   componentInstances: componentInstances,
  //   keys: statesWatchKeys,
  // });

  // // Visibility
  // const disabledResult = useMemo(
  //   () =>
  //     typeof componentConfig.visibility?.disabled !== 'boolean'
  //       ? componentConfig.visibility?.disabled?.method({
  //           control: componentInstance.__control,
  //           watches: {
  //             states: statesWatches,
  //           },
  //         })
  //       : componentConfig.visibility?.disabled,
  //   [componentConfig.visibility?.disabled, componentInstance.__control, statesWatches]
  // );

  // useEffect(() => {
  //   if (typeof disabledResult !== 'boolean') return;

  //   const neededComponentState = {
  //     disabled: disabledResult,
  //   };

  //   componentInstance.__control.setComponentInstance(mappedComponentInstanceName, {
  //     __state: neededComponentState,
  //   });
  // }, [
  //   disabledResult,
  //   mappedComponentInstanceName,
  //   componentConfig.type,
  //   componentInstance.__control,
  // ]);

  return {
    mappedComponentName: mappedComponentInstanceName,
    componentInstance: componentInstance,
    parentPaths: parentPaths,
    index: props.index,
  };
};

export const useFormComponent = (props: ComponentItemProps) => {
  const { componentConfig, parentPaths: parentPaths } = props;

  const { componentInstances: componentInstances } = useFormBuilderContext();

  const { mappedComponentInstanceName } = createMappedFieldNameForComponentInstances(
    componentConfig.componentName,
    parentPaths
  );

  const componentInstance = useMemo(
    () => get(componentInstances, mappedComponentInstanceName),
    [componentInstances, mappedComponentInstanceName]
  );

  if (!componentInstance) {
    throw new Error(`There is no componentInstance: ${mappedComponentInstanceName}`);
  }

  const _formControl = React.useRef<UseFormReturn | undefined>();
  _formControl.current = componentInstance.__formControl as UseFormReturn;
  const control = _formControl.current.control;

  const [formState, updateFormState] = React.useState<FormState<FieldValues>>(control._formState);

  useSubscribe({
    subject: control._subjects.state,
    next: (value: Partial<FormState<FieldValues>> & { name?: InternalFieldName }) => {
      if (shouldRenderFormState(value, control._proxyFormState, control._updateFormState, true)) {
        updateFormState({ ...control._formState });
      }
    },
  });

  // React.useEffect(() => control._disableForm(props.disabled), [control, props.disabled]);

  React.useEffect(() => {
    if (control._proxyFormState.isDirty) {
      const isDirty = control._getDirty();
      if (isDirty !== formState.isDirty) {
        control._subjects.state.next({
          isDirty,
        });
      }
    }
  }, [control, formState.isDirty]);

  // React.useEffect(() => {
  //   if (props.values && !deepEqual(props.values, _values.current)) {
  //     control._reset(props.values, control._options.resetOptions);
  //     _values.current = props.values;
  //     updateFormState((state) => ({ ...state }));
  //   } else {
  //     control._resetDefaultValues();
  //   }
  // }, [props.values, control]);

  // React.useEffect(() => {
  //   if (props.errors) {
  //     control._setErrors(props.errors);
  //   }
  // }, [props.errors, control]);

  React.useEffect(() => {
    if (!control._state.mount) {
      control._updateValid();
      control._state.mount = true;
    }

    if (control._state.watch) {
      control._state.watch = false;
      control._subjects.state.next({ ...control._formState });
    }

    control._removeUnmounted();
  });

  // React.useEffect(() => {
  //   props.shouldUnregister &&
  //     control._subjects.values.next({
  //       values: control._getWatch(),
  //     });
  // }, [props.shouldUnregister, control]);

  _formControl.current.formState = getProxyFormState(formState, control);

  return {
    mappedComponentName: mappedComponentInstanceName,
    componentInstance: componentInstance,
    parentPaths: parentPaths,
    index: props.index,
    formState,
    formControl: _formControl.current,
  };
};
