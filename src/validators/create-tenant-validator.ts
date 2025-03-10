import { checkSchema } from "express-validator";

export default checkSchema({
  name: {
    trim: true,
    notEmpty: {
      errorMessage: "tenant name is required",
    },
    isString: {
      errorMessage: "tenant name must be a string",
    },
  },
  address: {
    trim: true,
    notEmpty: {
      errorMessage: "tenant address is required",
    },
    isString: {
      errorMessage: "tenant address must be a string",
    },
  },
});
