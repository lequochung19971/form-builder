import { EffectCallback, useEffect } from 'react';

export const useDidMount = (effect: EffectCallback) => {
  useEffect(effect, []);
};
