import { useFormFieldComponent } from '@/ui-builder/useFormFieldComponent';
import { ComponentItem } from '../PageBuilder';
import { BaseComponentProps } from '../types';

export type ObjectComponentProps = BaseComponentProps;

export const ObjectComponent: React.FunctionComponent<ObjectComponentProps> = (props) => {
  const { componentConfig, parentPaths: parentPaths } = props;
  const { components } = componentConfig;

  useFormFieldComponent({
    componentConfig,
    parentPaths: parentPaths,
  });

  return (
    <div>
      {components?.map((com, index) => (
        <ComponentItem
          index={index}
          parentId={componentConfig.id}
          key={com.id}
          componentConfig={com}
          parentPaths={parentPaths?.concat({
            fieldName: componentConfig.fieldName,
            componentName: componentConfig.componentName,
            id: componentConfig.id,
            group: componentConfig.group,
          })}
        />
      ))}
    </div>
  );
};
