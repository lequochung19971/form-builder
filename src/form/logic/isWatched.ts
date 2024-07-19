import { InternalFieldName, Names } from 'react-hook-form';

export default (name: InternalFieldName, _names: Names, isBlurEvent?: boolean) =>
  !isBlurEvent &&
  (_names.watchAll ||
    _names.watch.has(name) ||
    [..._names.watch].some(
      (watchName) => name.startsWith(watchName) && /^\.\w+/.test(name.slice(watchName.length))
    ));
