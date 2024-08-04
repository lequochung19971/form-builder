import React, { createContext, PropsWithChildren } from 'react';
import { UseFormReturn } from 'react-hook-form';

export const FormComponentContext = createContext<UseFormReturn | null>(null);
export const FormComponentProvider: React.FunctionComponent<UseFormReturn & PropsWithChildren> = ({
  children,
  ...props
}) => {
  return <FormComponentContext.Provider value={props}>{children}</FormComponentContext.Provider>;
};
