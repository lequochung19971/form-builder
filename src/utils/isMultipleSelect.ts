import { FieldElement } from 'react-hook-form';

export default (element: FieldElement): element is HTMLSelectElement =>
  element.type === `select-multiple`;
