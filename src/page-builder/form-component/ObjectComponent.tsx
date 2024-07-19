import { useMemo } from 'react';
import { ComponentItem } from '../PageBuilder';
import { BaseComponentProps, ComponentConfig } from '../types';
import { useFormComponent } from '../hooks';

export type ObjectComponentProps = BaseComponentProps<ComponentConfig>;

export const ObjectComponent: React.FunctionComponent<ObjectComponentProps> = (props) => {
  const { componentConfig, parentPaths: parentPaths, index, parentId } = props;
  const { components } = componentConfig;

  useFormComponent({
    componentConfig,
    parentPaths: parentPaths,
    index,
  });

  const mappedParentPaths = useMemo(
    () =>
      parentPaths?.concat({
        name: componentConfig.name,
        componentName: componentConfig.componentName,
        id: componentConfig.id,
        type: componentConfig.type,
      }),
    [
      componentConfig.componentName,
      componentConfig.id,
      componentConfig.name,
      componentConfig.type,
      parentPaths,
    ]
  );

  return (
    <div>
      {components?.map((com, index) => (
        <ComponentItem
          index={index}
          parentId={componentConfig.id}
          key={`${com.id}-${index}`}
          componentConfig={com}
          parentPaths={mappedParentPaths}
        />
      ))}
    </div>
  );
};
