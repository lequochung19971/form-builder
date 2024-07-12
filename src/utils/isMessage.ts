import { Message } from 'react-hook-form';
import isString from '../utils/isString';

export default (value: unknown): value is Message => isString(value);
