import { checkSchema } from "express-validator";

export default checkSchema({
  email: {
    notEmpty: {
      errorMessage: "Email is required",
    },
    trim: true,
    isEmail: true,
  },
  firstName: {
    notEmpty: {
      errorMessage: "firstName is required",
    },
    trim: true,
    isString: {
      errorMessage: "firstName must be a string",
    },
  },
  lastName: {
    notEmpty: {
      errorMessage: "lastName is required",
    },
    trim: true,
    isString: {
      errorMessage: "lastName must be a string",
    },
  },
  password: {
    notEmpty: {
      errorMessage: "password is required",
    },
    isString: {
      errorMessage: "password must be a string",
    },
    isLength: {
      options: { min: 8 },
      errorMessage: "password must be at least 8 characters long",
    },
  },
  tenantId: {
    isNumeric: {
      errorMessage: "tenantId should be a number",
    },
    notEmpty: {
      errorMessage: "tenantId is required",
    },
  },
});
