import httpClient from '@/httpClient';
import { ComponentVisibilityProps, ActionMethodCreation, FormComponentInstance } from './types';
import { createMappedFieldName, resolveArrayIndexesForComponentName } from './utils';
import { get, set } from 'lodash';

export type SetPropsConfig = {
  props: Record<string, any>;
  // Target componentName
  target: string;
};
const setProps: ActionMethodCreation<SetPropsConfig> = ({ componentInstance, config }) => {
  componentInstance.__control.updatePartialComponentProps(config.target, config.props);
};

export type SetPropsConfigArrayItemData = {
  source?: {
    [TargetPropKey: string]: string;
  };
  // Target componentName
  target: string;
};
const setPropsFromArrayItemData: ActionMethodCreation<SetPropsConfigArrayItemData> = ({
  componentInstance,
  config,
}) => {
  const { mappedParentFieldName } = createMappedFieldName(
    componentInstance.componentConfig.fieldName!,
    componentInstance.parentPaths
  );
  const currentArrayItem = componentInstance.__control
    .getFormControl()
    ?.getValues(mappedParentFieldName);

  const result = Object.entries(config.source ?? {}).reduce((res, [targetPropKey, sourceKey]) => {
    set(res, targetPropKey, get(currentArrayItem, sourceKey));
    return res;
  }, {});
  componentInstance.__control.updatePartialComponentProps(config.target, result);
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

export type CallApiConfig = {
  method: 'POST' | 'GET' | 'PUT';
  url: string;
  params?: {};
  body?: any;
  resetForm?: boolean;
  triggerRefetch?: {
    target: string;
  };
};
const callApi: ActionMethodCreation<CallApiConfig> = async ({
  componentInstance,
  config,
  event,
}) => {
  console.log('Call API', config);
  await httpClient({
    method: config.method,
    url: config.url,
    data: event,
  });

  if (config.resetForm) {
    componentInstance.__formControl?.reset();
  }
};
const updateUser: ActionMethodCreation<boolean> = async ({
  componentInstance,
  config,
  event: formValues,
}) => {
  console.log('Call API', config);
  await httpClient({
    method: 'PUT',
    url: `/users/${formValues.id}`,
    data: formValues,
  });

  componentInstance.__control.setComponentProps('tabs.__children.tab2.__children.form', {
    refetchEvent: {},
  });
  componentInstance.__control.setComponentProps('tabs.__children.tab2.__children.dialogForm', {
    open: false,
  });
};

const builtInActionMethods = {
  setProps,
  passRowIdToComponent,
  appendRow,
  callApi,
  setPropsFromArrayItemData,
  updateUser,
} as const;

export default builtInActionMethods;
