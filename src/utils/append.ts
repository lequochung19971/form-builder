import convertToArrayPayload from './convertToArrayPayload';

export const appendAt = <T>(data: T[], value: T | T[]): T[] => [
  ...data,
  ...convertToArrayPayload(value),
];
