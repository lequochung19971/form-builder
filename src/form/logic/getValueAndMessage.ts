import { isObject, isRegExp } from 'lodash';
import { ValidationRule } from 'react-hook-form';

export default (validationData?: ValidationRule) =>
  isObject(validationData) && !isRegExp(validationData)
    ? validationData
    : {
        value: validationData,
        message: '',
      };
