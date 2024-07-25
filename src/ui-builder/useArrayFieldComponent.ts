import { useFormSubscribe } from '@/form/useFormSubscribe';
import React, { useEffect, useMemo } from 'react';
import { FieldValues, InternalFieldName, get } from 'react-hook-form';

import { ArrayFieldComponentInstance, ComponentProps } from './types';
import { useUIBuilderContext } from './UIBuilderContext';
import { useWatchComponentInstance } from './useWatchComponentInstance';
import {
  createMappedComponentName,
  createMappedFieldName,
  generateValidationMethods,
} from './utils';

export const useArrayFieldComponent = (props: ComponentProps) => {
  const { componentConfig, parentPaths: parentPaths } = props;

  const { validations: validations = {} } = componentConfig;

  const { formMethods, validationMethods } = useUIBuilderContext();

  if (!formMethods) {
    throw Error('Must be wrapped by form component');
  }

  const { control } = formMethods;

  const { mappedFieldName: mappedFieldValueName } = createMappedFieldName(
    componentConfig.fieldName!,
    parentPaths
  );

  const { mappedComponentName: mappedComponentInstanceName } = createMappedComponentName(
    componentConfig.componentName,
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
      generateValidationMethods({
        componentInstance,
        formMethods,
        parentPaths,
        validations,
        validationMethods,
      }),
    [componentInstance, formMethods, parentPaths, validationMethods, validations]
  );

  validate &&
    control.register(mappedFieldValueName, {
      validate,
    });

  const [fields, setFields] = React.useState(
    control._getFieldArray(mappedFieldValueName) as Record<string, string>[]
  );

  const _fieldsRef = React.useRef(fields);
  const _name = React.useRef(mappedFieldValueName);

  _name.current = mappedFieldValueName;
  _fieldsRef.current = fields;
  control._names.array.add(mappedFieldValueName);

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

  return {
    fields,
    mappedComponentInstanceName,
    mappedFieldValueName,
    parentPaths,
    componentInstance: componentInstance as ArrayFieldComponentInstance,
  };
};
