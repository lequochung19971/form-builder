import { ActionMethod } from './types';

const showComponent: ActionMethod = ({ componentInstance, config }) => {
  console.log('componentInstance', componentInstance, config);
};

const builtInActionMethods = {
  showComponent,
} as const;

export default builtInActionMethods;
