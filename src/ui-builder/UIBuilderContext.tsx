import { createContext, PropsWithChildren, useContext, useMemo, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormComponentContext } from './FormComponentContext';
import { CustomValidationMethods, ValidationMethods } from './types';
import { UseUIBuilderReturn } from './useUIBuilder';
import validationMethods from './validationMethods';

type UIBuilderContext = UseUIBuilderReturn & {
  formMethods?: UseFormReturn;
  validationMethods: ValidationMethods;
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

type UIBuilderProviderProps = Omit<UIBuilderContext, 'validationMethods'> &
  PropsWithChildren & {
    customValidationMethods?: CustomValidationMethods;
  };

export const UIBuilderProvider = ({
  children,
  customValidationMethods = {},
  ...props
}: UIBuilderProviderProps) => {
  const validationMethodsRef = useRef({
    ...validationMethods,
    ...customValidationMethods,
  });

  return (
    <UIBuilderContext.Provider
      value={useMemo(
        () => ({
          ...props,
          validationMethods: validationMethodsRef.current,
        }),
        [props]
      )}>
      {children}
    </UIBuilderContext.Provider>
  );
};
