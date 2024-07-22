import { isObject } from 'lodash';

export default (value: unknown): value is object =>
  isObject(value) && Object.values(value).some((val) => val);
