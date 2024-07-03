import '@quilted/quilt/globals';
import {RequestRouter} from '@quilted/quilt/request-router';
import {Router} from '@quilted/quilt/navigate';
import {renderToResponse} from '@quilted/quilt/server';
import {BrowserAssets} from 'quilt:module/assets';

import type {AppContext} from '~/shared/context.ts';
import {ProtobufCache} from '~/shared/protobuf.ts';

import {App} from './App.tsx';

const router = new RequestRouter();
const assets = new BrowserAssets();

// For all GET requests, render our React application.
router.get(async (request) => {
  const context = {
    router: new Router(request.url),
    protobuf: new ProtobufCache(),
  } satisfies AppContext;

  const response = await renderToResponse(<App context={context} />, {
    request,
    assets,
  });

  return response;
});

export default router;
