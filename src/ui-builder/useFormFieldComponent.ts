import { useController } from 'react-hook-form';

import { useCallback, useMemo } from 'react';
import { ComponentProps } from './types';
import { useUIBuilderContext } from './UIBuilderContext';
import { useBaseComponent } from './useBaseComponent';
import { useFormFieldComputed } from './useFormFieldComputed';
import { compareFieldNames, createMappedFieldName, generateValidationMethods } from './utils';
import { useFormFieldLifecycle } from './useFormFieldLifecycle';

export const useFormFieldComponent = (props: ComponentProps) => {
  const { componentConfig } = props;
  const { actions, componentInstance, mappedComponentName } = useBaseComponent(props);

  const { formMethods, control } = useUIBuilderContext();

  if (!formMethods) {
    throw Error('`form-field` component must be wrapped by `form` component group');
  }

  const { mappedFieldName } = createMappedFieldName(
    componentConfig.fieldName!,
    componentInstance.parentPaths
  );

  if (!componentInstance) {
    throw new Error(`There is no componentInstance: ${mappedComponentName}`);
  }

  const computedResults = useFormFieldComputed({
    componentInstance,
    formMethods,
  });

  useFormFieldLifecycle({
    componentInstance,
    formMethods,
  });

  const validate = useMemo(
    () =>
      generateValidationMethods({
        componentInstance,
        formMethods,
        parentPaths: componentInstance.parentPaths ?? [],
        validationMethods: componentInstance.validations ?? {},
      }),
    [componentInstance, formMethods]
  );

  const controller = useController({
    control: formMethods.control,
    name: mappedFieldName,
    rules: {
      validate,
    },
  });

  const { field: originalField, fieldState } = controller;

  /**
   * Trigger dependent fields, when one field depends on another field, it will trigger that field changes.
   */
  const triggerDeps = useCallback(() => {
    const dependencies = control.validationDependencies.find((d) =>
      compareFieldNames(d.fieldName, mappedFieldName)
    );
    if (dependencies?.deps.length) {
      formMethods.trigger(dependencies?.deps);
    }
  }, [control.validationDependencies, formMethods, mappedFieldName]);

  const field = useMemo(
    () => ({
      ...originalField,
      onBlur: () => {
        originalField.onBlur();
        triggerDeps();
      },
      onChange: (...event: any[]) => {
        originalField.onChange(...event);
        triggerDeps();
      },
    }),
    [originalField, triggerDeps]
  );

  return {
    mappedComponentName,
    mappedFieldName,
    field,
    fieldState,
    componentInstance,
    actions,
    computed: computedResults,
  };
};
