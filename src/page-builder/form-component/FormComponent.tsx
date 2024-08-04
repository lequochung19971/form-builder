import { useFormComponent } from '@/ui-builder/useFormComponent';
import { cn } from '@/utils/uiUtils';
import React from 'react';
import { FormComponentProvider } from '../../ui-builder/FormComponentContext';
import { ComponentItem, usePageBuilderContext } from '../PageBuilder';
import { BaseComponentProps } from '../types';

export type FormComponentProps = BaseComponentProps;

export const FormComponent: React.FunctionComponent<FormComponentProps> = ({
  componentConfig,
  parentPaths: parentPaths,
  index,
  parentId,
}) => {
  const { isBuildingMode } = usePageBuilderContext();

  const { formControl, componentInstance, actions, mappedComponentName } = useFormComponent({
    componentConfig,
    parentPaths: parentPaths,
  });
  const {
    props: { grid = {} },
  } = componentInstance;

  const { cols = 1 } = grid;

  return (
    <FormComponentProvider {...formControl}>
      <div>
        <form
          onSubmit={formControl.handleSubmit(actions.onSubmit)}
          className={cn('grid gap-4', {
            'grid-cols-1': cols === 1,
            'grid-cols-2': cols === 2,
            'grid-cols-3': cols === 3,
            'grid-cols-4': cols === 4,
            'grid-cols-5': cols === 5,
            'grid-cols-6': cols === 6,
            'grid-cols-7': cols === 7,
            'grid-cols-8': cols === 8,
            'grid-cols-9': cols === 9,
            'grid-cols-10': cols === 10,
            'grid-cols-11': cols === 11,
            'grid-cols-12': cols === 12,
          })}>
          {componentConfig.components?.map((com, index) => (
            <div
              key={com.id}
              className={cn({
                'col-span-1': true,
                'col-span-2': com.props?.grid?.colSpan === 2,
                'col-span-3': com.props?.grid?.colSpan === 3,
                'col-span-4': com.props?.grid?.colSpan === 4,
                'col-span-5': com.props?.grid?.colSpan === 5,
                'col-span-6': com.props?.grid?.colSpan === 6,
                'col-span-7': com.props?.grid?.colSpan === 7,
                'col-span-8': com.props?.grid?.colSpan === 8,
                'col-span-9': com.props?.grid?.colSpan === 9,
                'col-span-10': com.props?.grid?.colSpan === 10,
                'col-span-11': com.props?.grid?.colSpan === 11,
                'col-span-12': com.props?.grid?.colSpan === 12,
              })}>
              <ComponentItem
                componentConfig={com}
                index={index}
                parentId={componentConfig.id}
                parentPaths={parentPaths?.concat({
                  id: componentConfig.id,
                  group: componentConfig.group,
                  componentName: componentConfig.componentName,
                })}
              />
            </div>
          ))}
        </form>
      </div>
    </FormComponentProvider>
  );
};
