import React, { createContext, PropsWithChildren, useContext } from 'react';
import { UseFormReturn } from 'react-hook-form';

export const FormComponentContext = createContext<UseFormReturn | null>(null);
export const useFormComponentContext = () => {
  const context = useContext(FormComponentContext);

  if (!context) {
    throw Error('There is no FormComponentContext');
  }

  return context;
};
export const FormComponentProvider: React.FunctionComponent<UseFormReturn & PropsWithChildren> = ({
  children,
  ...props
}) => {
  return <FormComponentContext.Provider value={props}>{children}</FormComponentContext.Provider>;
};
