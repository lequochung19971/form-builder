import { FieldValues } from 'react-hook-form';
import isKey from './isKey';
import isObject from './isObject';
import stringToPath from './stringToPath';

export default (object: FieldValues, path: string, value?: unknown) => {
  let index = -1;
  const tempPath = isKey(path) ? [path] : stringToPath(path);
  const length = tempPath.length;
  const lastIndex = length - 1;

  while (++index < length) {
    const key = tempPath[index];
    let newValue = value;

    if (index !== lastIndex) {
      const objValue = object[key];
      newValue =
        isObject(objValue) || Array.isArray(objValue)
          ? objValue
          : !isNaN(+tempPath[index + 1])
          ? []
          : {};
    }

    if (key === '__proto__') {
      return;
    }

    object[key] = newValue;
    object = object[key];
  }
  return object;
};
