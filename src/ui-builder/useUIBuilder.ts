import { useRef } from 'react';
import { createUIBuilder, UIBuilderControl } from './createUIBuilder';
import { ComponentConfig } from './types';

export type UseUIBuilderReturn = {
  control: UIBuilderControl;
  getComponentInstances: UIBuilderControl['_getComponentInstances'];
  updatePartialComponentProps: UIBuilderControl['_updatePartialComponentProps'];
  setComponentProps: UIBuilderControl['_setComponentProps'];
  actionMethods: UIBuilderControl['actionMethods'];
  validationMethods: UIBuilderControl['validationMethods'];
  /**
   * Will reset everything (component instances, component configs,...)
   */
  reset: (componentConfigs: ComponentConfig[]) => void;
};

export const useUIBuilder = (props: {
  defaultComponentConfigs: ComponentConfig[];
}): UseUIBuilderReturn => {
  const uiBuilderControl = useRef<UIBuilderControl>();
  if (!uiBuilderControl.current) {
    uiBuilderControl.current = createUIBuilder({
      componentConfigs: props.defaultComponentConfigs,
    });
  }

  return {
    control: uiBuilderControl.current as UIBuilderControl,
    getComponentInstances: uiBuilderControl.current._getComponentInstances,
    updatePartialComponentProps: uiBuilderControl.current._updatePartialComponentProps,
    setComponentProps: uiBuilderControl.current._setComponentProps,
    reset: (componentConfigs: ComponentConfig[]) => {
      uiBuilderControl.current = createUIBuilder({
        ...props,
        componentConfigs,
      });
      uiBuilderControl.current._forceSubscribe();
    },
    actionMethods: uiBuilderControl.current.actionMethods,
    validationMethods: uiBuilderControl.current.validationMethods,
  };
};
