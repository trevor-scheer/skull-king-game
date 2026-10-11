/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: { paths: { "@skull-king/core": ["./skull-king-core/src"] } },
    }],
  },
  moduleNameMapper: {
    "^@skull-king/core$": "<rootDir>/skull-king-core/src",
  },
};
