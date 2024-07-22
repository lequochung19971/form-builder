import { createContext, PropsWithChildren, useContext } from 'react';
import { UseUIBuilderReturn } from './useUIBuilder';

export const UIBuilderContext = createContext<UseUIBuilderReturn | undefined>(undefined);

export const useUIBuilderContext = () => {
  const context = useContext(UIBuilderContext);

  if (!context) {
    throw Error('Not wrapped by UIBuilderProvider');
  }

  return context;
};

export const UIBuilderProvider = ({
  children,
  ...props
}: UseUIBuilderReturn & PropsWithChildren) => (
  <UIBuilderContext.Provider value={props}>{children}</UIBuilderContext.Provider>
);
