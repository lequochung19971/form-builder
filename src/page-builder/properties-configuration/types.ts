import { ComponentConfig } from '../types';

export type BaseComponentProperties = {
  componentConfig: Partial<ComponentConfig>;
  onSubmit?: (values: Partial<ComponentConfig>) => void;
};
