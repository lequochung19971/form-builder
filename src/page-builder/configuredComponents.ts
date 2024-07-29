import ButtonComponent, { ButtonComponentProps } from './ui-component/ButtonComponent';
import { ContainerComponent, ContainerComponentProps } from './ui-component/ContainerComponent';
import { InputComponent, InputComponentProps } from './ui-component/InputComponent';
import { v4 as uuidV4 } from 'uuid';
import { TabsComponent, TabsComponentProps } from './ui-component/TabsComponent';
import { ArrayComponent } from './form-component/ArrayComponent';
import { InputFieldComponent } from './form-component/InputFieldComponent';
import { FormComponent } from './form-component/FormComponent';
import { ComponentConfig, ParentPath } from '@/ui-builder/types';
import { ObjectComponent } from './form-component/ObjectComponent';
import TextComponent from './ui-component/TextComponent';
import { ComponentType } from './types';

export const configuredComponents = {
  [ComponentType.INPUT]: InputComponent,
  [ComponentType.CONTAINER]: ContainerComponent,
  [ComponentType.ARRAY_CONTAINER]: ArrayComponent,
  [ComponentType.BUTTON]: ButtonComponent,
  [ComponentType.TABS]: TabsComponent,
  [ComponentType.INPUT_FIELD]: InputFieldComponent,
  [ComponentType.FORM]: FormComponent,
  [ComponentType.OBJECT_CONTAINER]: ObjectComponent,
  [ComponentType.TEXT]: TextComponent,
};

export type AllComponentProps = Partial<
  Omit<
    InputComponentProps & ContainerComponentProps & ButtonComponentProps & TabsComponentProps,
    'componentConfig'
  >
> & {
  componentConfig: ComponentConfig;
  parentPaths: ParentPath[];
};

export const getDefaultComponentConfig = (type: ComponentType): ComponentConfig | undefined => {
  switch (type) {
    case ComponentType.INPUT:
    case ComponentType.TEXT:
    case ComponentType.BUTTON: {
      return {
        id: `${type}-${uuidV4()}`,
        componentName: '',
        group: 'ui',
        type,
      };
    }

    case ComponentType.INPUT_FIELD: {
      return {
        id: `${type}-${uuidV4()}`,
        componentName: '',
        fieldName: '',
        group: 'form-field',
        type,
      };
    }

    case ComponentType.TABS: {
      return {
        id: `${type}-${uuidV4()}`,
        componentName: '',
        type,
        group: 'ui',
        components: [
          {
            id: uuidV4(),
            componentName: 'tab',
            type: ComponentType.TAB,
            group: 'ui',
            components: [],
          },
        ],
      };
    }

    case ComponentType.ARRAY_CONTAINER: {
      return {
        id: `${type}-${uuidV4()}`,
        componentName: '',
        fieldName: '',
        group: 'form-array-field',
        type,
      };
    }

    case ComponentType.FORM: {
      return {
        id: `${type}-${uuidV4()}`,
        group: 'form',
        componentName: '',
        type,
      };
    }

    default: {
      return;
    }
  }
};
