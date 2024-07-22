import { isString } from 'lodash';
import { Message } from 'react-hook-form';

const isMessage = (value: unknown): value is Message => isString(value);
export default isMessage;
