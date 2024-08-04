import { ComponentName } from '@/ui-builder/types';
import { useUIBuilderContext } from './UIBuilderContext';
import { useComponentSubscribe } from './useComponentSubscribe';
import { useRefContinuousUpdate } from '@/hooks/useRefContinuousUpdate';

export const useComponentChannel = <T = any>(
  componentName: ComponentName,
  callback: (value?: T) => void
) => {
  const _memorizedCallback = useRefContinuousUpdate(callback);
  const { control } = useUIBuilderContext();

  useComponentSubscribe({
    next: ({ componentName: signalName, value }) => {
      if (signalName === componentName) {
        _memorizedCallback.current(value);
      }
    },
    subject: control.subjects.components,
  });
};
