import { Subject } from '@/form/utils/createSubject';
import React from 'react';

type Props<T> = {
  disabled?: boolean;
  subject: Subject<T>;
  next: (value: T) => void;
};

export function useFormSubscribe<T>(props: Props<T>) {
  const _props = React.useRef(props);
  _props.current = props;

  React.useEffect(() => {
    const subscription =
      !props.disabled &&
      _props.current.subject &&
      _props.current.subject.subscribe({
        next: _props.current.next,
      });

    return () => {
      subscription && subscription.unsubscribe();
    };
  }, [props.disabled]);
}
