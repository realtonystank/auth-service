import { checkSchema } from "express-validator";

export default checkSchema(
  {
    currentPage: {
      customSanitizer: {
        options: (value) => {
          const parsedValue = Number(value);
          return Number.isNaN(parsedValue) ? 1 : parsedValue;
        },
      },
    },
    perPage: {
      customSanitizer: {
        options: (value) => {
          const parsedValue = Number(value);
          return Number.isNaN(parsedValue) ? 6 : parsedValue;
        },
      },
    },
    q: {
      trim: true,
      customSanitizer: {
        options: (value: unknown) => {
          return value ? value : "";
        },
      },
    },
    role: {
      customSanitizer: {
        options: (value: unknown) => {
          return value ? value : "";
        },
      },
    },
  },
  ["query"],
);
