import { checkSchema } from "express-validator";

export default checkSchema({
  email: {
    notEmpty: {
      errorMessage: "Email is required",
    },
    trim: true,
    isEmail: {
      errorMessage: "Not a valid email",
    },
  },
  password: {
    notEmpty: {
      errorMessage: "password is required",
    },
    isString: {
      errorMessage: "password must be a string",
    },
    trim: true,
  },
});
