import httpClient from '@/httpClient';
import { LifecycleActionMethodCreation } from '@/ui-builder/types';
import { get, set } from 'lodash';

export type FormLoadDataSourceConfig = {
  method: 'POST' | 'GET';
  url: string;
  params?: {
    /**
     * Example:
     * {
     *    "targetKey": "sourceKey"
     * }
     */
    props?: Record<string, string>;
  };
  loadSuccess?: {
    resetToPath?: string;
  };
};

const mapVariableInString = (
  str: string,
  data: Record<string, any>,
  config: Record<string, string>
) => {
  let result = str;
  for (const [targetKey, sourceKey] of Object.entries(config)) {
    // Replace occurrences of the variable in the string
    const regex = new RegExp(`\\$\\{${targetKey}\\}`, 'g');
    result = result.replace(regex, get(data, sourceKey));
  }
  return result;
};

const formLoadDataSource: LifecycleActionMethodCreation<FormLoadDataSourceConfig> = async ({
  params: config,
  dependencies,
  componentInstance,
}) => {
  try {
    const url = mapVariableInString(
      config?.url ?? '',
      componentInstance.props,
      config?.params?.props ?? {}
    );
    const data = await httpClient({
      method: config?.method,
      url: url,
    });
    console.log(data);

    componentInstance.__formControl?.reset(
      config?.loadSuccess?.resetToPath
        ? set({}, config?.loadSuccess?.resetToPath, data.data)
        : data.data
    );
  } catch (error) {
    console.log(error);
  }
};

const builtInLifecycleActionMethods = {
  'form.loadDataSource': formLoadDataSource,
} as const;

export default builtInLifecycleActionMethods;
