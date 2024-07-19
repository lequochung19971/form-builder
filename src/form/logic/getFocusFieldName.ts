import { isUndefined } from 'lodash';
import { FieldArrayMethodProps, InternalFieldName } from 'react-hook-form';

export default (
  name: InternalFieldName,
  index: number,
  options: FieldArrayMethodProps = {}
): string =>
  options.shouldFocus || isUndefined(options.shouldFocus)
    ? options.focusName ||
      `${name}.${isUndefined(options.focusIndex) ? index : options.focusIndex}.`
    : '';
