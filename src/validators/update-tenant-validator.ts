import { checkSchema } from "express-validator";

export default checkSchema({
  name: {
    trim: true,
    isString: {
      errorMessage: "tenant name must be a string",
    },
  },
  address: {
    trim: true,
    isString: {
      errorMessage: "tenant address must be a string",
    },
  },
});
