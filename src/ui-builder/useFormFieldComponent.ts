import { useController } from 'react-hook-form';

import { useCallback, useMemo } from 'react';
import { ComponentProps, ValidationConfig } from './types';
import { useUIBuilderContext } from './UIBuilderContext';
import { useWatchComponentInstance } from './useWatchComponentInstance';
import {
  compareFieldNames,
  createMappedFieldNameForComponentInstances,
  createMappedFieldNameForValues,
  generateActions,
  generateValidationMethods,
} from './utils';

export const useFormFieldComponent = (props: ComponentProps) => {
  const { componentConfig, parentPaths: parentPaths } = props;

  const { validations = {} as ValidationConfig, actions = {} } = componentConfig;
  const { formMethods, control, validationMethods, actionMethods } = useUIBuilderContext();

  if (!formMethods) {
    throw Error('Must be wrapped by form component');
  }

  const { mappedFieldName: mappedFieldName } = createMappedFieldNameForValues(
    componentConfig.fieldName!,
    parentPaths
  );

  const { mappedComponentName: mappedComponentName } = createMappedFieldNameForComponentInstances(
    componentConfig.fieldName!,
    parentPaths
  );

  const componentInstance = useWatchComponentInstance({
    componentName: mappedComponentName,
  });

  if (!componentInstance) {
    throw new Error(`There is no componentInstance: ${mappedComponentName}`);
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

  const controller = useController({
    control: formMethods.control,
    name: mappedFieldName,
    rules: {
      validate,
    },
  });

  const { field: originalField, fieldState } = controller;

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

  const componentActionMethods = useMemo(
    () =>
      generateActions({
        actionMethods,
        actionsConfigs: actions,
        componentInstance,
      }),
    [actionMethods, actions, componentInstance]
  );

  return {
    mappedComponentName,
    mappedFieldName,
    field,
    fieldState,
    componentInstance,
    parentPaths,
    actions: componentActionMethods,
  };
};
