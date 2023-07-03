import { GraphQLClient } from 'graphql-request'

export const client = new GraphQLClient(
    'https://p01--trademeql--cvfxljtjhsn6.code.run/v1/graphql', {
      headers: {"x-hasura-admin-secret": "secretsarenofun"}
  }
);