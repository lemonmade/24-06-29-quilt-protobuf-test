import {
  useAsyncAction,
  AsyncAction,
  AsyncActionCache,
  AsyncActionCacheCreateOptions,
  AsyncActionCacheEntrySerialization,
} from '@quilted/quilt/async';

import {useAppContext} from './context.ts';
import type {Message} from '@bufbuild/protobuf';

declare module './context.ts' {
  export interface AppContext {
    readonly protobuf: ProtobufCache;
  }
}

export const useProtobufCache = () => useAppContext().protobuf;

export function useProtobufFetch<T extends Message<any>>(
  fetch: () => PromiseLike<T>,
  {
    type,
    key,
    tags,
  }: AsyncActionCacheCreateOptions & {
    type: typeof Message<T & {toBinary(): Uint8Array}> & {
      fromBinary(bytes: Uint8Array): T;
    };
  },
) {
  const protobuf = useProtobufCache();

  const action = protobuf.create(fetch, {
    key,
    tags,
    fromBytes: (bytes) => type.fromBinary(bytes),
    toBytes: (value) => value.toBinary(),
  });

  return useAsyncAction(action);
}

export class ProtobufCache {
  #cache = new AsyncActionCache();

  create<T>(
    fetch: () => PromiseLike<T>,
    {
      fromBytes,
      toBytes,
      key,
      tags,
    }: AsyncActionCacheCreateOptions & {
      fromBytes: (bytes: Uint8Array) => NoInfer<T>;
      toBytes: (value: NoInfer<T>) => Uint8Array;
    },
  ) {
    return this.#cache.create(
      (cached) => {
        let action: AsyncAction<T>;

        if (cached) {
          action = new AsyncAction<T>(fetch, {
            cached: cached.value
              ? {...cached, value: fromBytes(cached.value)}
              : cached,
          });
        } else {
          action = new AsyncAction<T>(fetch);
        }

        Object.assign(action, {toBytes});

        return action;
      },
      {key, tags},
    );
  }

  restore(entries: Iterable<AsyncActionCacheEntrySerialization<any>>) {
    const encoder = new TextEncoder();

    this.#cache.restore(
      [...entries].map(
        ([key, entry]) =>
          [
            key,
            entry.value
              ? {...entry, value: encoder.encode(entry.value)}
              : entry,
          ] as const,
      ),
    );
  }

  serialize(): readonly AsyncActionCacheEntrySerialization<any>[] {
    const decoder = new TextDecoder();

    const entries: AsyncActionCacheEntrySerialization<any>[] = [];

    for (const entry of this.#cache.values()) {
      const latest = entry.latest?.serialize();

      if (latest == null) continue;

      entries.push([
        entry.id,
        {
          ...latest,
          value: latest.value
            ? decoder.decode((entry as any).toBytes(entry.value))
            : undefined,
        } as typeof latest,
      ]);
    }

    return entries;
  }
}
