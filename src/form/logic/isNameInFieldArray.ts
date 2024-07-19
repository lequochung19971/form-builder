import { InternalFieldName } from 'react-hook-form';

import getNodeParentName from './getNodeParentName';

export default (names: Set<InternalFieldName>, name: InternalFieldName) =>
  names.has(getNodeParentName(name));
