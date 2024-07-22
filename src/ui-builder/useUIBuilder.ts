import { useRef } from 'react';
import { createUIBuilder, UIBuilderControl } from './createUIBuilder';
import { ComponentConfig } from './types';

export type UseUIBuilderReturn = {
  control: UIBuilderControl;
  setComponentInstance: UIBuilderControl['_setComponentInstance'];
  getComponentInstances: UIBuilderControl['_getComponentInstances'];
  reset: (componentConfigs: ComponentConfig[]) => void;
};

export const useUIBuilder = (props: {
  componentConfigs: ComponentConfig[];
}): UseUIBuilderReturn => {
  const uiBuilderControl = useRef<UIBuilderControl>();
  if (!uiBuilderControl.current) {
    uiBuilderControl.current = createUIBuilder(props);
  }

  return {
    control: uiBuilderControl.current as UIBuilderControl,
    setComponentInstance: uiBuilderControl.current._setComponentInstance,
    getComponentInstances: uiBuilderControl.current._getComponentInstances,
    reset: (componentConfigs: ComponentConfig[]) => {
      uiBuilderControl.current = createUIBuilder({
        ...props,
        componentConfigs,
      });
      uiBuilderControl.current._forceSubscribe();
    },
  };
};
