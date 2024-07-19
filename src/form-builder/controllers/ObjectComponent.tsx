import { useMemo } from 'react';
import { ComponentItem, useComponent } from '../FormBuilder';
import { BaseComponentProps, ComponentConfig } from '../types';

export type ObjectComponentProps = BaseComponentProps<ComponentConfig>;

export const ObjectComponent: React.FunctionComponent<ObjectComponentProps> = (props) => {
  const { componentConfig, parentPaths: parentPaths } = props;
  const { components } = componentConfig;

  const { component } = useComponent({
    componentConfig,
    parentPaths: parentPaths,
  });

  const mappedParentPaths = useMemo(
    () =>
      parentPaths?.concat({
        name: componentConfig.name,
      }),
    [componentConfig.name, parentPaths]
  );

  return (
    <div css={componentConfig.css}>
      {components?.map((com, index) => (
        <ComponentItem
          key={`${com.id}-${index}`}
          componentConfig={com}
          parentPaths={mappedParentPaths}
        />
      ))}
    </div>
  );
};
