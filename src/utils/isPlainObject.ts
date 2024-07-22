import { isObject } from 'lodash';

export default (tempObject: object) => {
  const prototypeCopy = tempObject.constructor && tempObject.constructor.prototype;

  return (
    isObject(prototypeCopy) && Object.prototype.hasOwnProperty.call(prototypeCopy, 'isPrototypeOf')
  );
};
