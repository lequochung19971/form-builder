import { FieldElement } from 'react-hook-form';

export default (element: FieldElement): element is HTMLInputElement => element.type === 'checkbox';
