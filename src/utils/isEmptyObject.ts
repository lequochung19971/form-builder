import { isObject } from 'lodash';
import { EmptyObject } from 'react-hook-form';

export default (value: unknown): value is EmptyObject =>
  isObject(value) && !Object.keys(value).length;
