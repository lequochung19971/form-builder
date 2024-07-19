import { compact, unset } from 'lodash';
import get from '../utils/get';

export default <T>(ref: T, name: string) => !compact(get(ref, name)).length && unset(ref, name);
