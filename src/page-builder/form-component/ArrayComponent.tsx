import { ComponentItem, usePageBuilderContext } from '../PageBuilder';
import React from 'react';
import { DragDropWrapper } from '../dnd/DragDropWrapper';
import { DropHerePlaceholder } from '../DropHerePlaceholder';
import { useArrayFieldComponent } from '@/ui-builder/useArrayFieldComponent';
import { BaseComponentProps } from '../types';
import { Button } from '@/components/ui/button';

export type ArrayComponentProps = BaseComponentProps;

export const ArrayComponent: React.FunctionComponent<ArrayComponentProps> = (props) => {
  const { componentConfig, parentPaths: parentPaths, index, parentId } = props;
  const { isBuildingMode } = usePageBuilderContext();

  const { fields, componentInstance } = useArrayFieldComponent({
    componentConfig,
    parentPaths: parentPaths,
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
                group: componentConfig.group,
                fieldName: componentConfig.fieldName,
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
      {fields?.map((field, fieldIndex) => (
        <React.Fragment key={`${field.id}-${fieldIndex}`}>
          {componentConfig.components?.map((com) => (
            <ComponentItem
              key={`${field.id}-${com.id}`}
              componentConfig={com}
              index={index}
              parentId={componentConfig.id}
              parentPaths={parentPaths?.concat({
                id: componentConfig.id,
                group: componentConfig.group,
                fieldName: componentConfig.fieldName,
                componentName: componentConfig.componentName,
                index: fieldIndex,
              })}
            />
          ))}
          <div className="space-x-2">
            <Button onClick={() => componentInstance.__control.remove(fieldIndex)}>Delete</Button>
            <Button onClick={() => componentInstance.__control.logPrivateVars()}>Log</Button>
          </div>
        </React.Fragment>
      ))}
      <div className="flex flex-row space-x-1">
        <Button
          onClick={() =>
            componentInstance.__control.append({
              firstName: `Append-${Math.floor(Math.random() * 1000)}`,
            })
          }>
          Append
        </Button>
        <Button
          onClick={() =>
            componentInstance.__control.prepend({
              firstName: `Prepend-${Math.floor(Math.random() * 1000)}`,
            })
          }>
          Prepend
        </Button>
        <Button onClick={() => componentInstance.__control.swap(1, 3)}>Swap</Button>
        <Button onClick={() => componentInstance.__control.move(1, 3)}>Move</Button>
        <Button
          onClick={() =>
            componentInstance.__control.insert(1, {
              firstName: `insert-${Math.floor(Math.random() * 1000)}`,
            })
          }>
          Insert
        </Button>
        <Button
          onClick={() =>
            componentInstance.__control.update(1, {
              firstName: `update-${Math.floor(Math.random() * 1000)}`,
            })
          }>
          Update
        </Button>
      </div>
    </div>
  );
};
