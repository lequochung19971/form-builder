import { useRef } from 'react';

export const useRefContinuousUpdate = <T>(value?: T) => {
  const ref = useRef(value as T);
  ref.current = value as T;
  return ref;
};
