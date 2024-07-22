import { useFormSubscribe } from '@/form/useFormSubscribe';
import React, { useEffect, useMemo } from 'react';
import { FieldValues, InternalFieldName, get } from 'react-hook-form';

import { useFormComponentContext } from './FormComponentContext';
import { ArrayFieldComponentInstance, ComponentProps } from './types';
import { useWatchComponentInstance } from './useWatchComponentInstance';
import {
  createMappedFieldNameForComponentInstances,
  createMappedFieldNameForValues,
} from './utils';

export const useArrayFieldComponent = (props: ComponentProps) => {
  const { componentConfig, parentPaths: parentPaths } = props;

  const { validations: validations = {} } = componentConfig;

  const form = useFormComponentContext();
  const { control } = form;

  const { mappedFieldValueName } = createMappedFieldNameForValues(
    componentConfig.fieldName!,
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

  control.register(mappedFieldValueName, {});

  React.useEffect(() => {
    const observer = (updateFields: Record<string, string>[]) => {
      setFields([...updateFields]);
    };
    const reference = componentInstance?.__control.watchFields?.(observer);
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
          componentInstance.__control.replace?.(fieldValues);
        }
      }
    },
    subject: control._subjects.array,
  });

  React.useEffect(() => {
    componentInstance.__control.updateFormState?.();
  }, [fields, control, componentInstance.__control]);

  // const validate = useMemo(
  //   () =>
  //     Object.entries(validations).reduce((result, [key, v]) => {
  //       result = {
  //         ...result,
  //         [key]: (fieldValue: unknown, formValues: Record<string, unknown>) =>
  //           v(fieldValue, formValues, componentInstance.__control),
  //       };
  //       return result;
  //     }, {}),
  //   [validations, componentInstance.__control]
  // );

  // validate &&
  //   control.register(mappedFieldValueName, {
  //     validate,
  //   });

  return {
    fields,
    mappedComponentInstanceName,
    mappedFieldValueName,
    parentPaths,
    componentInstance: componentInstance as ArrayFieldComponentInstance,
  };
};
