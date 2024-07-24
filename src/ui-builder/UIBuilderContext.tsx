import { createContext, PropsWithChildren, useContext, useMemo, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormComponentContext } from './FormComponentContext';
import {
  ActionMethods,
  CustomActionMethods,
  CustomValidationMethods,
  ValidationMethods,
} from './types';
import { UseUIBuilderReturn } from './useUIBuilder';
import builtInValidationMethods from './validationMethods';
import builtInActionMethods from './actionMethods';

type UIBuilderContext = UseUIBuilderReturn & {
  formMethods?: UseFormReturn;
  validationMethods: ValidationMethods;
  actionMethods: ActionMethods;
};

export const UIBuilderContext = createContext<UIBuilderContext | undefined>(undefined);

export const useUIBuilderContext = () => {
  const context = useContext(UIBuilderContext);
  const formMethods = useContext(FormComponentContext);
  if (!context) {
    throw Error('Not wrapped by UIBuilderProvider');
  }

  return useMemo(
    () => ({
      ...context,
      formMethods,
    }),
    [context, formMethods]
  );
};

type UIBuilderProviderProps = Omit<UIBuilderContext, 'validationMethods' | 'actionMethods'> &
  PropsWithChildren & {
    /**
     * A custom validation method must be include `custom` prefix
     * Example:
     * - `custom.testValidator`
     * - `custom.users.uniqueUserName`
     */
    customValidationMethods?: CustomValidationMethods;

    /**
     * A custom validation method must be include `custom` prefix
     * Example:
     * - `custom.test`
     * - `custom.users.showUser`
     */
    customActionMethods?: CustomActionMethods;
  };

export const UIBuilderProvider = ({
  children,
  customValidationMethods = {},
  customActionMethods = {},
  ...props
}: UIBuilderProviderProps) => {
  const validationMethodsRef = useRef({
    ...builtInValidationMethods,
    ...customValidationMethods,
  });

  const actionMethodsRef = useRef({
    ...builtInActionMethods,
    ...customActionMethods,
  });

  return (
    <UIBuilderContext.Provider
      value={useMemo(
        () => ({
          ...props,
          validationMethods: validationMethodsRef.current,
          actionMethods: actionMethodsRef.current,
        }),
        [props]
      )}>
      {children}
    </UIBuilderContext.Provider>
  );
};
