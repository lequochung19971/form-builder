import { get, isString } from 'lodash';
import { DeepPartial, FieldValues, Names } from 'react-hook-form';

export default <T>(
  names: string | string[] | undefined,
  _names: Names,
  formValues?: FieldValues,
  isGlobal?: boolean,
  defaultValue?: DeepPartial<T> | unknown
) => {
  if (isString(names)) {
    isGlobal && _names.watch.add(names);
    return get(formValues, names, defaultValue);
  }

  if (Array.isArray(names)) {
    return names.map(
      (fieldName) => (isGlobal && _names.watch.add(fieldName), get(formValues, fieldName))
    );
  }

  isGlobal && (_names.watchAll = true);

  return formValues;
};
