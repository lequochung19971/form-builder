import getProxyFormState from '@/form/logic/getProxyFormState';
import shouldRenderFormState from '@/form/logic/shouldRenderFormState';
import { useComponentSubscribe } from '@/hooks/useComponentSubscribe';
import { useFormSubscribe } from '@/hooks/useFormSubscribe';
import { cloneDeep, get } from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FieldValues,
  FormState,
  InternalFieldName,
  useController,
  UseFormReturn,
} from 'react-hook-form';
import { ComponentItemProps, usePageBuilderContext } from './PageBuilder';
import {
  ComponentInstancesNextArgs,
  createMappedFieldNameForComponentInstances,
  createMappedFieldNameForValues,
  PageBuilderControl,
} from './createPageBuilder';
import { useFormComponentContext } from './form-component/FormComponentContext';
import { ComponentInstance } from './types';
import { shouldSubscribeByComponentName } from './utils';

const generateWatch = (
  componentInstances: Record<string, ComponentInstance>,
  componentName: string | string[]
) => {
  if (Array.isArray(componentName)) {
    return componentName.reduce((result, componentName) => {
      return result.concat(get(componentInstances, componentName));
    }, [] as ComponentInstance[]);
  } else {
    return get(componentInstances, componentName);
  }
};

type UseWatchComponent<T extends string[] | string> = {
  componentName: T;
  control?: PageBuilderControl;
};
export const useWatchComponentInstance = <
  T extends string[] | string,
  R = T extends string[] ? ComponentInstance[] : ComponentInstance
>(
  props: UseWatchComponent<T>
) => {
  const { pageBuilderMethods } = usePageBuilderContext();
  const { componentName, control = pageBuilderMethods.control } = props;
  const _componentName = useRef(componentName);
  const [value, setValue] = useState<R>(
    generateWatch(control.componentInstances, _componentName.current) as R
  );

  useComponentSubscribe({
    next: ({
      componentInstances,
      componentName: signalName,
      subscribeAll,
    }: ComponentInstancesNextArgs) => {
      if (
        subscribeAll ||
        shouldSubscribeByComponentName({
          componentName: props.componentName,
          signalName,
        })
      ) {
        setValue(cloneDeep(generateWatch(componentInstances, _componentName.current) as R));
      }
    },
    subject: control.subjects.instances,
  });
  return value;
};

export const useArrayFieldComponent = (props: ComponentItemProps) => {
  const { componentConfig, parentPaths: parentPaths } = props;

  const { validations: validations = {} } = componentConfig;

  const form = useFormComponentContext();
  const { control } = form;

  const { mappedFieldValueName } = createMappedFieldNameForValues(
    componentConfig.name!,
    parentPaths
  );

  const { mappedComponentInstanceName } = createMappedFieldNameForComponentInstances(
    componentConfig.componentName,
    parentPaths
  );

  const componentInstance = useWatchComponentInstance({
    componentName: mappedComponentInstanceName,
  });

  if (!componentInstance) {
    throw new Error(`There is no componentInstance: ${mappedComponentInstanceName}`);
  }

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
  //     props.rules as RegisterOptions<TFieldValues>
  //   );

  const observer = (updateFields: Record<string, string>[]) => {
    setFields([...updateFields]);
  };
  const observerRef = useRef(observer);
  observerRef.current = observer;

  React.useEffect(() => {
    const reference = componentInstance?.__control.watchFields?.((...args) =>
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

  useFormSubscribe({
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
          componentInstance.__control.set?.(fieldValues);
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

  const { mappedFieldValueName } = createMappedFieldNameForValues(
    componentConfig.name!,
    parentPaths
  );

  const { mappedComponentInstanceName } = createMappedFieldNameForComponentInstances(
    componentConfig.name!,
    parentPaths
  );

  const componentInstance = useWatchComponentInstance({
    componentName: mappedComponentInstanceName,
  });

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

  const { mappedComponentInstanceName } = createMappedFieldNameForComponentInstances(
    componentConfig.componentName,
    parentPaths
  );

  const componentInstance = useWatchComponentInstance({
    componentName: mappedComponentInstanceName,
  });

  if (!componentInstance) {
    throw new Error(`There is no componentInstance: ${mappedComponentInstanceName}`);
  }

  return {
    mappedComponentName: mappedComponentInstanceName,
    componentInstance: componentInstance,
    parentPaths: parentPaths,
    index: props.index,
  };
};

export const useFormComponent = (props: ComponentItemProps) => {
  const { componentConfig, parentPaths: parentPaths } = props;

  const { mappedComponentInstanceName } = createMappedFieldNameForComponentInstances(
    componentConfig.componentName,
    parentPaths
  );

  const componentInstance = useWatchComponentInstance({
    componentName: mappedComponentInstanceName,
  });

  if (!componentInstance) {
    throw new Error(`There is no componentInstance: ${mappedComponentInstanceName}`);
  }

  const _formControl = React.useRef<UseFormReturn | undefined>();
  _formControl.current = componentInstance.__formControl as UseFormReturn;
  const formControl = _formControl.current.control;
  console.log(_formControl.current.watch());

  const [formState, updateFormState] = React.useState<FormState<FieldValues>>(
    formControl._formState
  );

  useFormSubscribe({
    subject: formControl._subjects.state,
    next: (value: Partial<FormState<FieldValues>> & { name?: InternalFieldName }) => {
      if (
        shouldRenderFormState(
          value,
          formControl._proxyFormState,
          formControl._updateFormState,
          true
        )
      ) {
        updateFormState({ ...formControl._formState });
      }
    },
  });

  React.useEffect(() => {
    if (formControl._proxyFormState.isDirty) {
      const isDirty = formControl._getDirty();
      if (isDirty !== formState.isDirty) {
        formControl._subjects.state.next({
          isDirty,
        });
      }
    }
  }, [formControl, formState.isDirty]);

  // React.useEffect(() => control._disableForm(props.disabled), [control, props.disabled]);

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
    if (!formControl._state.mount) {
      formControl._updateValid();
      formControl._state.mount = true;
    }

    if (formControl._state.watch) {
      formControl._state.watch = false;
      formControl._subjects.state.next({ ...formControl._formState });
    }

    formControl._removeUnmounted();
  });

  // React.useEffect(() => {
  //   props.shouldUnregister &&
  //     control._subjects.values.next({
  //       values: control._getWatch(),
  //     });
  // }, [props.shouldUnregister, control]);

  _formControl.current.formState = getProxyFormState(formState, formControl);

  return {
    mappedComponentName: mappedComponentInstanceName,
    componentInstance: componentInstance,
    parentPaths: parentPaths,
    index: props.index,
    formState,
    formControl: _formControl.current,
  };
};
