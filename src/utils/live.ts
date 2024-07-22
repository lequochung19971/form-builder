import { Ref } from 'react-hook-form';

import isHTMLElement from './isHTMLElement';

export default (ref: Ref) => isHTMLElement(ref) && ref.isConnected;
