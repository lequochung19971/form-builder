import { useController } from 'react-hook-form';

import { useFormComponentContext } from './FormComponentContext';
import { ComponentProps, ValidationConfig } from './types';
import { useWatchComponentInstance } from './useWatchComponentInstance';
import {
  createMappedFieldNameForComponentInstances,
  createMappedFieldNameForValues,
} from './utils';
import { useMemo } from 'react';
import validationMethods from './validationMethods';

export const useFormFieldComponent = (props: ComponentProps) => {
  const { componentConfig, parentPaths: parentPaths } = props;

  const { validation = {} as ValidationConfig } = componentConfig;
  const form = useFormComponentContext();
  const { control, getValues } = form;

  const { mappedFieldValueName: mappedFieldName } = createMappedFieldNameForValues(
    componentConfig.fieldName!,
    parentPaths
  );

  const { mappedComponentInstanceName: mappedComponentName } =
    createMappedFieldNameForComponentInstances(componentConfig.fieldName!, parentPaths);

  const componentInstance = useWatchComponentInstance({
    componentName: mappedComponentName,
  });

  if (!componentInstance) {
    throw new Error(`There is no componentInstance: ${mappedComponentName}`);
  }

  // const validate = useMemo(
  //   () =>
  //     Object.entries(validation.methods).reduce((result, [methodName, methodConfig]) => {
  //       const validator = validationMethods[methodName as keyof typeof validationMethods];
  //       if (validator) {
  //         result = {
  //           ...result,
  //           [methodName]: (fieldValue: unknown, formValues: Record<string, unknown>) => {
  //             const dependentFieldValues = validation.dependsOn?.length
  //               ? getValues(validation.dependsOn)
  //               : undefined;

  //             return validator({
  //               fieldValue,
  //               formValues,
  //               componentInstance,
  //               dependentFieldValues,
  //               ...(typeof methodConfig === 'boolean' ? {} : methodConfig),
  //             });
  //           },
  //         };
  //       }

  //       return result;
  //     }, {}),
  //   [validation.methods, validation.dependsOn, componentInstance, getValues]
  // );

  const controller = useController({
    control,
    name: mappedFieldName,
    rules: {
      // validate,
    },
  });

  const { field, fieldState } = controller;

  return {
    mappedComponentName,
    mappedFieldName,
    field,
    fieldState,
    componentInstance,
    parentPaths,
  };
};
