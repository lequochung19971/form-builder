import { Primitive } from 'react-hook-form';
import isNullOrUndefined from './isNullOrUndefined';
import isObjectType from './isObjectType';

const isPrimitive = (value: unknown): value is Primitive =>
  isNullOrUndefined(value) || !isObjectType(value);
export default isPrimitive;
