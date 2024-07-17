import { ComponentConfig, ComponentType, ParentPath } from './types';
import ButtonComponent, { ButtonComponentProps } from './ui/ButtonComponent';
import { ContainerComponent, ContainerComponentProps } from './ui/ContainerComponent';
import { InputComponent, InputComponentProps } from './ui/InputComponent';
import { v4 as uuidV4 } from 'uuid';
import { TabsComponent, TabsComponentProps } from './ui/TabsComponent';
import { ArrayComponent } from './form/ArrayComponent';
import { InputFieldComponent } from './form/InputFieldComponent';
import { FormComponent } from './form/FormComponent';

export const configuredComponents = {
  [ComponentType.INPUT]: InputComponent,
  [ComponentType.CONTAINER]: ContainerComponent,
  [ComponentType.ARRAY_CONTAINER]: ArrayComponent,
  [ComponentType.BUTTON]: ButtonComponent,
  [ComponentType.TABS]: TabsComponent,
  [ComponentType.INPUT_FIELD]: InputFieldComponent,
  [ComponentType.FORM]: FormComponent,
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
    case ComponentType.INPUT_FIELD: {
      return {
        id: `${type}-${uuidV4()}`,
        componentName: '',
        type,
      };
    }

    case ComponentType.TABS: {
      return {
        id: `${type}-${uuidV4()}`,
        componentName: '',
        type,
        components: [
          {
            id: uuidV4(),
            componentName: 'tab',
            type: ComponentType.TAB,
            components: [],
          },
        ],
      };
    }

    case ComponentType.ARRAY_CONTAINER: {
      return {
        id: `${type}-${uuidV4()}`,
        componentName: '',
        name: '',
        type,
      };
    }

    case ComponentType.FORM: {
      return {
        id: `${type}-${uuidV4()}`,
        componentName: '',
        type,
      };
    }

    default: {
      return;
    }
  }
};
