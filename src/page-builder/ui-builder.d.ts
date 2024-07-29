import {
  EventActionConfigs as OriginalEventActionConfigs,
  ActionConfigs as OriginalActionConfigs,
  ValidationConfig as OriginalValidationConfig,
  LifecycleActionConfigs as OriginalLifecycleActionConfigs,
  EffectActionConfigs as OriginalEffectActionConfigs,
  EffectActionConfig,
} from '@/ui-builder/types';

declare module '@/ui-builder/types' {
  export interface EventActionConfigs extends OriginalEventActionConfigs {
    custom?: ActionConfigs;
  }
  export interface ActionConfigs extends OriginalActionConfigs {
    doSomething?: boolean;
  }

  export interface LifecycleActionConfigs extends OriginalLifecycleActionConfigs {
    testAction?: any;
  }
  export interface ValidationConfig extends OriginalValidationConfig {
    validateSomething?: any;
  }
  export interface EffectActionConfigs extends OriginalEffectActionConfigs {
    load?: EffectActionConfig;
  }
}
export * from '@/ui-builder/types';
