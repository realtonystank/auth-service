/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: "node",
  transform: {
    //eslint-disable-next-line no-useless-escape
    "^.+\.tsx?$": ["ts-jest", {}],
  },
};
