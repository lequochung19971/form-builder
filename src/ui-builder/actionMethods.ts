import { ComponentVisibilityProps, ActionMethodCreation } from './types';
import { resolveArrayIndexesForComponentName } from './utils';

export type SetVisibilityConfig = {
  visibility: ComponentVisibilityProps;
  // Target componentName
  target: string;
};
const setVisibility: ActionMethodCreation<SetVisibilityConfig> = ({
  componentInstance,
  config,
}) => {
  componentInstance.__control.updatePartialComponentProps(config.target, {
    visibility: {
      ...config.visibility,
    },
  });
};

export type PassRowIdToComponent = {
  // Target componentName
  target: string;
  propKey: 'id';
};
const passRowIdToComponent: ActionMethodCreation<PassRowIdToComponent> = ({
  componentInstance,
  config,
}) => {
  console.log(componentInstance, config);
};

export type AppendRow = {
  value: object;

  // form-array-field componentName
  target: string;
};

const appendRow: ActionMethodCreation<AppendRow> = ({ componentInstance, config }) => {
  const parentFieldArray = componentInstance.__control.getComponentInstances(
    resolveArrayIndexesForComponentName(componentInstance.parentPaths ?? [], config.target)
  );

  if (parentFieldArray?.componentConfig.group !== 'form-array-field') {
    console.error('`appendRow` action is just used in a `form-array-field` component group');
    return;
  }

  parentFieldArray.__control.append(config.value);
};

const builtInActionMethods = {
  setVisibility,
  passRowIdToComponent,
  appendRow,
} as const;

export default builtInActionMethods;
