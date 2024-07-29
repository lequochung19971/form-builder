import { ValidationMethodCreation } from './types';

export const required: ValidationMethodCreation = ({
  fieldValue,
  message = 'This field is required',
  params,
  dependentFieldValues,
  componentInstance,
}) => {
  console.log(dependentFieldValues, componentInstance.componentConfig, params);
  return fieldValue ? message : false;
};

export const maxLength: ValidationMethodCreation<number> = ({
  fieldValue,
  message = 'This field is required',
  params,
  dependentFieldValues,
  componentInstance,
}) => {
  console.log(dependentFieldValues, componentInstance.componentConfig, params);
  return fieldValue ? message : false;
};

export const minLength: ValidationMethodCreation<number> = ({
  fieldValue,
  message = 'This field is required',
  params,
  dependentFieldValues,
  componentInstance,
}) => {
  console.log(dependentFieldValues, componentInstance.componentConfig, params);
  return fieldValue ? message : false;
};

const builtInValidationMethods = {
  required,
  maxLength,
  minLength,
} as const;

export default builtInValidationMethods;
