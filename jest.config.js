/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: { jsx: "react-jsx", lib: ["es2022", "dom"], paths: { "@skull-king/core": ["./skull-king-core/src"] } },
    }],
  },
  moduleNameMapper: {
    "\\.(css|scss)$": "<rootDir>/test/styleMock.js",
    "^@skull-king/core$": "<rootDir>/skull-king-core/src",
  },
};
