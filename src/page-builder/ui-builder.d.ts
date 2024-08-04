import {
  EventActionConfigs as OriginalEventActionConfigs,
  ActionConfigs as OriginalActionConfigs,
  ValidationConfigs as OriginalValidationConfigs,
  LifecycleActionConfigs as OriginalLifecycleActionConfigs,
  ComputedConfigs as OriginalComputedConfigs,
} from '@/ui-builder/types';

declare module '@/ui-builder/types' {
  export interface ActionConfigs extends OriginalActionConfigs {}
  export interface EventActionConfigs extends OriginalEventActionConfigs {
    custom?: ActionConfigs;
  }

  export interface LifecycleActionConfigs extends OriginalLifecycleActionConfigs {
    testAction?: any;
  }
  export interface ValidationConfigs extends OriginalValidationConfigs {
    validateSomething?: any;
  }

  export interface ComputedConfigs extends OriginalComputedConfigs {}
}
export * from '@/ui-builder/types';
