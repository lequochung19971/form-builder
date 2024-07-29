import { createContext, PropsWithChildren, useContext, useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormComponentContext } from './FormComponentContext';
import { UseUIBuilderReturn } from './useUIBuilder';

type UIBuilderContext = UseUIBuilderReturn & {
  formMethods?: UseFormReturn;
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

type UIBuilderProviderProps = UIBuilderContext & PropsWithChildren;

export const UIBuilderProvider = ({ children, ...props }: UIBuilderProviderProps) => {
  return (
    <UIBuilderContext.Provider value={useMemo(() => props, [props])}>
      {children}
    </UIBuilderContext.Provider>
  );
};
