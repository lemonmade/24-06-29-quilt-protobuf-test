import '@quilted/quilt/globals';
import {RequestRouter} from '@quilted/quilt/request-router';
import {Router} from '@quilted/quilt/navigate';
import {renderToResponse} from '@quilted/quilt/server';
import {BrowserAssets} from 'quilt:module/assets';

import {createConnectRouter, createPromiseClient} from '@connectrpc/connect';
import {createConnectTransport} from '@connectrpc/connect-web';
import {
  universalServerRequestFromFetch,
  universalServerResponseToFetch,
  type UniversalHandler,
} from '@connectrpc/connect/protocol';
import {HomeService} from './proto/home_connect.ts';

import type {AppContext} from '~/shared/context.ts';
import {ProtobufCache, ProtobufFetch} from '~/shared/protobuf.ts';

import {App} from './App.tsx';

const router = new RequestRouter();
const assets = new BrowserAssets();

const protobufRouter = createConnectRouter();
protobufRouter.service(HomeService, {
  async query(_request) {
    return {
      greeting: 'Hello, world!',
    };
  },
});

const protobufPaths = new Map<string, UniversalHandler>();
for (const protobufHandlers of protobufRouter.handlers) {
  protobufPaths.set(protobufHandlers.requestPath, protobufHandlers);
}

router.any(
  '/api',
  async (request) => {
    const handler = protobufPaths.get(request.URL.pathname.slice(4));

    if (handler == null) return null;

    const protobufResponse = await handler({
      ...universalServerRequestFromFetch(request, {}),
    });

    return universalServerResponseToFetch(protobufResponse);
  },
  {exact: false},
);

// For all GET requests, render our React application.
router.get(async (request) => {
  const protobufTransport = createConnectTransport({
    baseUrl: new URL('/api', request.url).href,
    useBinaryFormat: true,
  });

  const protobufFetch: ProtobufFetch = async function fetch(
    service,
    method,
    {input},
  ) {
    const client = createPromiseClient(service, protobufTransport);
    const response = await client[method](input ?? ({} as any));
    return response as any;
  };

  const context = {
    router: new Router(request.url),
    protobuf: {
      fetch: protobufFetch,
      cache: new ProtobufCache({fetch: protobufFetch}),
    },
  } satisfies AppContext;

  const response = await renderToResponse(<App context={context} />, {
    request,
    assets,
  });

  return response;
});

export default router;
