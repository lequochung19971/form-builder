import React from 'react';
import {
  FieldValues,
  FieldArrayPath,
  UseFieldArrayProps,
  UseFieldArrayReturn,
  Control,
  InternalFieldName,
  FieldArrayWithId,
} from 'react-hook-form';
import { createFieldArray } from './createFieldArray';
import { get } from 'lodash';
import { useFormSubscribe } from '../../hooks/useFormSubscribe';
import { v4 as uuidV4 } from 'uuid';

export function useFieldArray<
  TFieldValues extends FieldValues = FieldValues,
  TFieldArrayName extends FieldArrayPath<TFieldValues> = FieldArrayPath<TFieldValues>,
  TKeyName extends string = 'id'
>(
  props: UseFieldArrayProps<TFieldValues, TFieldArrayName, TKeyName>
): UseFieldArrayReturn<TFieldValues, TFieldArrayName, TKeyName> {
  const control = props.control as Control<TFieldValues>;
  const fieldArrayRef = React.useRef(createFieldArray(props));
  const [fields, setFields] = React.useState(fieldArrayRef.current.fields);

  React.useEffect(() => {
    const observer = (
      updateFields: FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>[]
    ) => {
      setFields(updateFields);
    };
    fieldArrayRef.current.watchFields(observer);
  }, []);

  useFormSubscribe({
    next: ({
      values,
      name: fieldArrayName,
    }: {
      values?: FieldValues;
      name?: InternalFieldName;
    }) => {
      if (fieldArrayName === props.name || !fieldArrayName) {
        const fieldValues = get(values, props.name);
        if (Array.isArray(fieldValues)) {
          fieldArrayRef.current.ids = fieldValues.map(() => uuidV4());
          fieldArrayRef.current.fields = fieldValues.map((field, index) => ({
            ...field,
            [props.keyName ?? 'id']: fieldArrayRef.current.ids[index] || uuidV4(),
          })) as FieldArrayWithId<TFieldValues, TFieldArrayName, TKeyName>[];
          setFields(fieldArrayRef.current.fields);
        }
      }
    },
    subject: control._subjects.array,
  });

  React.useEffect(() => {
    fieldArrayRef.current.updateFormState();
  }, [fields, props.name, control]);

  const methods = React.useMemo<
    UseFieldArrayReturn<TFieldValues, TFieldArrayName, TKeyName>
  >(() => {
    const fieldArray = fieldArrayRef.current;
    return {
      append: (...args) => {
        fieldArray.append(...args);
        // setFields(fieldArray.fields);
      },
      prepend: (...args) => {
        fieldArray.prepend(...args);
        // setFields(fieldArray.fields);
      },
      remove: (...args) => {
        fieldArray.remove(...args);
        // setFields(fieldArray.fields);
      },
      insert: (...args) => {
        fieldArray.insert(...args);
        // setFields(fieldArray.fields);
      },
      swap: (...args) => {
        fieldArray.swap(...args);
        // setFields(fieldArray.fields);
      },
      move: (...args) => {
        fieldArray.move(...args);
        // setFields(fieldArray.fields);
      },
      update: (...args) => {
        fieldArray.update(...args);
        // setFields(fieldArray.fields);
      },
      replace: (...args) => {
        fieldArray.replace(...args);
        // setFields(fieldArray.fields);
      },
      _fields: fields,
    };
  }, [fields]);

  return methods;
}
