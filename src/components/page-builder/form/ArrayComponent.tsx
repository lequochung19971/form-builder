import { ComponentConfig, BaseComponentProps } from '../types';
import { ComponentItem, useFormBuilderContext } from '../PageBuilder';
import React from 'react';
import { DragDropWrapper } from '../dnd/DragDropWrapper';
import { DropHerePlaceholder } from '../DropHerePlaceholder';
import { useArrayFieldComponent } from '../hooks';

export type ArrayComponentProps = BaseComponentProps<ComponentConfig>;

export const ArrayComponent: React.FunctionComponent<ArrayComponentProps> = (props) => {
  const { componentConfig, parentPaths: parentPaths, index, parentId } = props;
  const { isBuildingMode } = useFormBuilderContext();

  const { fields } = useArrayFieldComponent({
    componentConfig,
    parentPaths: parentPaths,
    index,
  });

  if (isBuildingMode) {
    return (
      <DragDropWrapper
        index={index}
        id={componentConfig.id}
        data={componentConfig}
        parentId={parentId}>
        <div className="w-full flex flex-col space-y-4">
          {!componentConfig.components?.length && (
            <DropHerePlaceholder componentConfig={componentConfig} parentId={componentConfig.id} />
          )}
          {componentConfig.components?.map((com, index) => (
            <ComponentItem
              key={com.id}
              componentConfig={com}
              index={index}
              parentId={componentConfig.id}
              parentPaths={parentPaths?.concat({
                id: componentConfig.id,
                type: componentConfig.type,
                name: componentConfig.name,
                componentName: componentConfig.componentName,
                index: 0,
              })}
            />
          ))}
        </div>
      </DragDropWrapper>
    );
  }

  return (
    <div className="w-full flex flex-col space-y-4">
      {fields?.map((field, idx) => (
        <React.Fragment key={field.id}>
          {componentConfig.components?.map((com, index) => (
            <ComponentItem
              key={`component-${field.id}-${com.id}`}
              componentConfig={com}
              index={index}
              parentId={componentConfig.id}
              parentPaths={parentPaths?.concat({
                id: componentConfig.id,
                type: componentConfig.type,
                name: componentConfig.name,
                componentName: componentConfig.componentName,
                index: idx,
              })}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};
