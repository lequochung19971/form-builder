import { ValidationRule } from 'react-hook-form';
import isObject from '../utils/isObject';
import isRegex from '../utils/isRegex';

export default (validationData?: ValidationRule) =>
  isObject(validationData) && !isRegex(validationData)
    ? validationData
    : {
        value: validationData,
        message: '',
      };
