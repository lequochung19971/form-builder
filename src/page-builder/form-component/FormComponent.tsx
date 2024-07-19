import React from 'react';
import { ComponentItem } from '../PageBuilder';
import { DropHerePlaceholder } from '../DropHerePlaceholder';
import { useFormComponent } from '../hooks';
import { BaseComponentProps, ComponentConfig } from '../types';
import { FormComponentProvider } from './FormComponentContext';
import { DragDropWrapper } from '../dnd/DragDropWrapper';

export type FormComponentProps = BaseComponentProps<ComponentConfig>;

export const FormComponent: React.FunctionComponent<FormComponentProps> = (props) => {
  const { componentConfig, parentPaths: parentPaths, index, parentId } = props;

  const { formControl } = useFormComponent({
    componentConfig,
    parentPaths: parentPaths,
    index,
    parentId,
  });

  return (
    <DragDropWrapper
      index={index}
      id={componentConfig.id}
      data={componentConfig}
      parentId={parentId}>
      <FormComponentProvider {...formControl}>
        <div>
          <div className="w-full flex flex-col space-y-4">
            {!componentConfig.components?.length && (
              <DropHerePlaceholder
                componentConfig={componentConfig}
                parentId={componentConfig.id}
              />
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
                  componentName: componentConfig.componentName,
                })}
              />
            ))}
          </div>
        </div>
      </FormComponentProvider>
    </DragDropWrapper>
  );
};
