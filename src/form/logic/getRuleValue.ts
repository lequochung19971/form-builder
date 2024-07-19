import { isObject, isRegExp, isUndefined } from 'lodash';
import { ValidationRule, ValidationValue, ValidationValueMessage } from 'react-hook-form';

export default <T extends ValidationValue>(rule?: ValidationRule<T> | ValidationValueMessage<T>) =>
  isUndefined(rule)
    ? rule
    : isRegExp(rule)
    ? rule.source
    : isObject(rule)
    ? isRegExp(rule.value)
      ? rule.value.source
      : rule.value
    : rule;
