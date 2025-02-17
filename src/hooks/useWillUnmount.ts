import { useEffect } from 'react';

export function useWillUnmount(callback: () => void): void {
  // run only once
  useEffect(() => {
    return callback;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
