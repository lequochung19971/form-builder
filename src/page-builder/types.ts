import { ComponentConfig, ParentPath } from '@/ui-builder/types';

// export enum ComponentType {
//   /**
//    * UI components
//    */
//   INPUT = 'input',
//   BUTTON = 'button',
//   CONTAINER = 'container',
//   PAGE = 'page',
//   FORM = 'form',
//   DIALOG = 'dialog',
//   TABS = 'tabs',
//   TAB = 'tab',
//   COLUMN = 'column',
//   TEXT = 'text',

//   /**
//    * Data components
//    * Components are used inside Form component and used to collected data
//    */
//   INPUT_FIELD = 'inputField',
//   OBJECT_CONTAINER = 'objectContainer',
//   ARRAY_CONTAINER = 'arrayContainer',
//   SUBMIT_BUTTON = 'submitButton',
//   DATA_TABLE = 'dataTable',
// }

export type BaseComponentProps<T extends ComponentConfig = ComponentConfig> = {
  componentConfig: T;
  parentPaths: ParentPath[];
  index: number;
  parentId?: string;
};
