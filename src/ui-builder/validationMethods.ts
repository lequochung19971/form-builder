import { ValidationMethod } from './types';

export const required: ValidationMethod = ({
  fieldValue,
  message = 'This field is required',
  params,
  dependentFieldValues,
  componentInstance,
}) => {
  console.log(dependentFieldValues, componentInstance.componentConfig, params);
  return fieldValue ? message : false;
};

const validationMethods = {
  'library.required': required,
} as const;

export default validationMethods;
