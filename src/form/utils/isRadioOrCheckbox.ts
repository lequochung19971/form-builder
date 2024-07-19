import { FieldElement } from 'react-hook-form';

import isCheckBoxInput from './isCheckBoxInput';
import isRadioInput from './isRadioInput';

export default (ref: FieldElement): ref is HTMLInputElement =>
  isRadioInput(ref) || isCheckBoxInput(ref);
