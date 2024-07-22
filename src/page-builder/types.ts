import { ComponentConfig, ParentPath } from '@/ui-builder/types';

export type BaseComponentProps<T extends ComponentConfig = ComponentConfig> = {
  componentConfig: T;
  parentPaths: ParentPath[];
  index: number;
  parentId?: string;
};
