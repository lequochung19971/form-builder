import { FieldError, Ref, ValidateResult } from 'react-hook-form';
import isMessage from '../utils/isMessage';
import { isBoolean } from 'lodash';

export default function getValidateError(
  result: ValidateResult,
  ref: Ref,
  type = 'validate'
): FieldError | void {
  if (
    isMessage(result) ||
    (Array.isArray(result) && result.every(isMessage)) ||
    (isBoolean(result) && !result)
  ) {
    return {
      type,
      message: isMessage(result) ? result : '',
      ref,
    };
  }
}
