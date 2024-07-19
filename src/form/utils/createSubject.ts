import { Noop } from 'react-hook-form';

export type Observer<T> = {
  next: (value: T) => void;
};

export type Subscription = {
  unsubscribe: Noop;
};

export type Subject<T> = {
  readonly observers: Observer<T>[];
  subscribe: (value: Observer<T>) => Subscription;
  unsubscribe: Noop;
} & Observer<T>;

const createSubject = <T>(): Subject<T> => {
  let _observers: Observer<T>[] = [];

  const next = (value: T) => {
    for (const observer of _observers) {
      observer.next && observer.next(value);
    }
  };

  const subscribe = (observer: Observer<T>): Subscription => {
    _observers.push(observer);
    return {
      unsubscribe: () => {
        _observers = _observers.filter((o) => o !== observer);
      },
    };
  };

  const unsubscribe = () => {
    _observers = [];
  };

  return {
    get observers() {
      return _observers;
    },
    next,
    subscribe,
    unsubscribe,
  };
};
export default createSubject;
