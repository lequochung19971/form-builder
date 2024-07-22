import React from 'react';
import { ComponentItem, usePageBuilderContext } from '../PageBuilder';
import { DropHerePlaceholder } from '../DropHerePlaceholder';
import { FormComponentProvider } from '../../ui-builder/FormComponentContext';
import { DragDropWrapper } from '../dnd/DragDropWrapper';
import { useFormComponent } from '@/ui-builder/useFormComponent';
import { BaseComponentProps } from '../types';

export type FormComponentProps = BaseComponentProps;

export const FormComponent: React.FunctionComponent<FormComponentProps> = (props) => {
  const { componentConfig, parentPaths: parentPaths, index, parentId } = props;
  const { isBuildingMode } = usePageBuilderContext();

  const { formControl } = useFormComponent({
    componentConfig,
    parentPaths: parentPaths,
  });

  if (!isBuildingMode) {
    return (
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
    );
  }

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
