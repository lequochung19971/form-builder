import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import React from 'react';
import { InputComponentProperties } from './InputComponentProperties';
import { TabsComponentProperties } from './TabsComponentProperties';
import { BaseComponentProperties } from './types';
import { ArrayComponentProperties } from './ArrayComponentProperties';
import { ComponentType } from '@/ui-builder/types';

type ComponentPropertiesDialogProps = BaseComponentProperties & {
  open?: boolean;
  onClose?: () => void;
};
export const ComponentPropertiesDialog: React.FunctionComponent<ComponentPropertiesDialogProps> = ({
  componentConfig,
  onSubmit,
  open,
  onClose,
}) => {
  const dialogContent = () => {
    switch (componentConfig?.type) {
      case ComponentType.INPUT:
      case ComponentType.FORM:
        return <InputComponentProperties componentConfig={componentConfig} onSubmit={onSubmit} />;

      case ComponentType.TABS:
        return <TabsComponentProperties componentConfig={componentConfig} onSubmit={onSubmit} />;

      case ComponentType.ARRAY_CONTAINER:
        return <ArrayComponentProperties componentConfig={componentConfig} onSubmit={onSubmit} />;

      case ComponentType.INPUT_FIELD:
        return <ArrayComponentProperties componentConfig={componentConfig} onSubmit={onSubmit} />;
      default:
        return;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="w-[600px]">
        <DialogHeader>
          <DialogTitle>Component Properties</DialogTitle>
        </DialogHeader>
        <div className="flex py-4">{dialogContent()}</div>
      </DialogContent>
    </Dialog>
  );
};
