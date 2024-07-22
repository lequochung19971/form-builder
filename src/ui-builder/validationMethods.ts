import { ValidationMethod } from './types';

export const required: ValidationMethod = ({
  fieldValue,
  message = 'This field is required',
  params,
}) => {
  return fieldValue ? message : false;
};

const validationMethods = {
  required,
};
export default validationMethods;
