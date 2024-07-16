import '@quilted/quilt/globals';
import {hydrate} from 'preact';
import {Router} from '@quilted/quilt/navigate';
import {Browser, BrowserContext} from '@quilted/quilt/browser';

import {createPromiseClient} from '@connectrpc/connect';
import {createConnectTransport} from '@connectrpc/connect-web';

import type {AppContext} from '~/shared/context.ts';
import {ProtobufCache, type ProtobufFetch} from '~/shared/protobuf.ts';

import {App} from './App.tsx';

const element = document.querySelector('#app')!;
const browser = new Browser();

const protobufTransport = createConnectTransport({
  baseUrl: new URL('/api', window.location.origin).href,
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
  router: new Router(browser.request.url),
  protobuf: {
    fetch: protobufFetch,
    cache: new ProtobufCache({fetch: protobufFetch}),
  },
} satisfies AppContext;

// Makes key parts of the app available in the browser console
Object.assign(globalThis, {app: context});

hydrate(
  <BrowserContext browser={browser}>
    <App context={context} />
  </BrowserContext>,
  element,
);
