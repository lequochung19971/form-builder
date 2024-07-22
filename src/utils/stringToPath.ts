import { compact } from 'lodash';

export default (input: string): string[] => compact(input.replace(/["|']|\]/g, '').split(/\.|\[/));
