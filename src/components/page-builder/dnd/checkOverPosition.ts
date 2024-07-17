import { ClientRect } from '@dnd-kit/core';

export const checkOverPosition = (activeRect: ClientRect, overRect: ClientRect) => {
  if (!activeRect || !overRect) return;

  const activePoint = activeRect.top;
  const overMidPoint = overRect.top + overRect.height / 2;

  if (activePoint < overMidPoint) {
    return 'above';
  } else if (activePoint > overMidPoint) {
    return 'below';
  }
};
