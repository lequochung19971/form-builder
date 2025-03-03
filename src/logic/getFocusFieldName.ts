import { FieldArrayMethodProps, InternalFieldName } from 'react-hook-form';
import isUndefined from '../utils/isUndefined';

export default (
  name: InternalFieldName,
  index: number,
  options: FieldArrayMethodProps = {}
): string =>
  options.shouldFocus || isUndefined(options.shouldFocus)
    ? options.focusName ||
      `${name}.${isUndefined(options.focusIndex) ? index : options.focusIndex}.`
    : '';
