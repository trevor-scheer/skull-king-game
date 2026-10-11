import type { CodegenConfig } from '@graphql-codegen/cli';
import schema from '../skull-king-server/src/typeDefs';
const config: CodegenConfig = {
  overwrite: true,
  schema,
  documents: ['src/**/*.{tsx,graphql}', '!src/types/graphqlTypes.ts'],
  generates: { 'src/types/graphqlTypes.ts': { plugins: ['typescript', 'typescript-operations', 'typescript-react-apollo'] } },
};
export default config;
