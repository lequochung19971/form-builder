import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUIComponent } from '@/ui-builder/useUIComponent';
import React, { useMemo } from 'react';
import { ComponentItem } from '../PageBuilder';
import { BaseComponentProps } from '../types';

export type DialogComponentProps = BaseComponentProps;

export const DialogComponent: React.FunctionComponent<DialogComponentProps> = (props) => {
  const { componentConfig, parentPaths: parentPaths } = props;

  const { componentInstance, actions, mappedComponentName } = useUIComponent({
    componentConfig,
    parentPaths: parentPaths,
  });
  const { open, title } = componentInstance.props;

  const mappedParentPaths = useMemo(
    () =>
      parentPaths?.concat({
        id: componentConfig.id,
        group: componentConfig.group,
        componentName: componentConfig.componentName,
      }),
    [componentConfig.componentName, componentConfig.group, componentConfig.id, parentPaths]
  );

  const handleOnOpenChange = (open: boolean) => {
    !open && actions.onClose?.();
    componentInstance.__control.updatePartialComponentProps(mappedComponentName, {
      open: false,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOnOpenChange}>
      <DialogContent className="w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="w-full">
          {componentConfig?.components?.map((com, index) => (
            <ComponentItem
              key={`${com.id}-${index}`}
              componentConfig={com}
              parentId={componentConfig.id}
              parentPaths={mappedParentPaths}
              index={index}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
