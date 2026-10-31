import { ValueTransformer } from 'typeorm';

// MySQL and PostgreSQL return DECIMAL columns as strings; this converts them to numbers.
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) =>
    value === null || value === undefined ? value : Number(value),
};
