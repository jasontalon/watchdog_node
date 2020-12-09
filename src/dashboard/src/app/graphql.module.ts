import { NgModule } from '@angular/core';
import { APOLLO_OPTIONS } from 'apollo-angular';
import { InMemoryCache } from '@apollo/client/core';
import { HttpLinkModule, HttpLink } from 'apollo-angular-link-http';

import { ApolloLink, split } from 'apollo-link';
import { WebSocketLink } from 'apollo-link-ws';
import { setContext } from 'apollo-link-context';
import { HttpClientModule } from '@angular/common/http';
import { getMainDefinition } from 'apollo-utilities';


const uri = 'http://localhost:7988/v1/graphql'; // <-- add the URL of the GraphQL server here
const wsUri = 'ws://localhost:7988/v1/graphql';
export function createApollo(httpLink: HttpLink) {
  const basic = setContext((operation, context) => ({
    headers: {
      'content-type': 'application/json',
      'X-HASURA-ADMIN-SECRET': 'p@55w0rd!',
    },
  }));

  const http = httpLink.create({ uri })
  // Create a WebSocket link:
  const ws = new WebSocketLink({
    uri : wsUri,
    options: {
      reconnect: true,
      connectionParams: {
        headers: {
          'content-type': 'application/json',
          'X-HASURA-ADMIN-SECRET': 'p@55w0rd!',
        },
      }

    },
  });

  const linkz = split(
    // split based on operation type
    ({ query }) => {
      const { kind, operation } = (getMainDefinition(query) as any);
      console.log('ahaha', kind, operation);
      return kind === 'OperationDefinition' && operation === 'subscription';
    },
    ws,
    http
  );
  const link = ApolloLink.from([basic, linkz]);

  return {
    link,
    cache: new InMemoryCache(),
  };
}

@NgModule({
  exports: [HttpClientModule, HttpLinkModule],

  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApollo,
      deps: [HttpLink],
    },
  ],
})
export class GraphQLModule {}
