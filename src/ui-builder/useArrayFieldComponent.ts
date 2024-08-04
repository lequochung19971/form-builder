import { useFormSubscribe } from '@/form/useFormSubscribe';
import React, { useMemo } from 'react';
import { FieldValues, InternalFieldName, get } from 'react-hook-form';

import { ArrayFieldComponentInstance, ComponentProps } from './types';
import { useUIBuilderContext } from './UIBuilderContext';
import { useBaseComponent } from './useBaseComponent';
import { createMappedFieldName, generateValidationMethods } from './utils';
import { useFormFieldLifecycle } from './useFormFieldLifecycle';
import { useFormFieldComputed } from './useFormFieldComputed';

export const useArrayFieldComponent = (props: ComponentProps) => {
  const { componentConfig } = props;
  const { actions, componentInstance, mappedComponentName, _memorizedMeta } =
    useBaseComponent(props);

  const { formMethods } = useUIBuilderContext();

  if (!formMethods) {
    throw Error('`form-array-field` component must be wrapped by `form` component group');
  }

  const { control } = formMethods;

  const { mappedFieldName } = createMappedFieldName(
    componentConfig.fieldName!,
    componentInstance.parentPaths
  );

  const computedResults = useFormFieldComputed({
    componentInstance,
    formMethods,
    _memorizedMeta,
  });

  useFormFieldLifecycle({
    componentInstance,
    formMethods,
    _memorizedMeta,
  });

  const validate = useMemo(
    () =>
      generateValidationMethods({
        componentInstance,
        formMethods,
        parentPaths: componentInstance.parentPaths ?? [],
        validationMethods: componentInstance.props.validations ?? {},
      }),
    [componentInstance, formMethods]
  );

  validate &&
    control.register(mappedFieldName, {
      validate,
    });

  const [fields, setFields] = React.useState(
    control._getFieldArray(mappedFieldName) as Record<string, string>[]
  );

  const _fieldsRef = React.useRef(fields);
  const _name = React.useRef(mappedFieldName);

  _name.current = mappedFieldName;
  _fieldsRef.current = fields;
  control._names.array.add(mappedFieldName);

  React.useEffect(() => {
    const observer = (updateFields: Record<string, string>[]) => {
      setFields([...updateFields]);
    };
    const reference = componentInstance?.__control.watchFields?.(observer);
    return () => {
      reference?.unwatch();
    };
  }, [componentInstance]);

  useFormSubscribe({
    next: ({
      values,
      name: fieldArrayName,
    }: {
      values?: FieldValues;
      name?: InternalFieldName;
    }) => {
      if (fieldArrayName === mappedFieldName || !fieldArrayName) {
        const fieldValues = get(values, mappedFieldName);
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
    mappedComponentName,
    mappedFieldValueName: mappedFieldName,
    componentInstance: componentInstance as ArrayFieldComponentInstance,
    actions,
    computed: computedResults,
  };
};
