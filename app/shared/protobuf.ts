import {
  useAsyncAction,
  AsyncAction,
  AsyncActionCache,
  AsyncActionCacheEntry,
  AsyncActionRunCache,
  AsyncActionCacheCreateOptions,
  AsyncActionCacheEntrySerialization,
} from '@quilted/quilt/async';
import {type ReadonlySignal} from '@quilted/quilt/signals';
import type {ServiceType} from '@bufbuild/protobuf';

import {useAppContext} from './context.ts';

declare module './context.ts' {
  export interface AppContext {
    readonly protobuf: {
      readonly fetch: ProtobufFetch;
      readonly cache: ProtobufCache;
    };
  }
}

export interface ProtobufFetch {
  <Service extends ServiceType, Method extends keyof Service['methods']>(
    service: Service,
    method: Method,
    options: {
      readonly input?:
        | InstanceType<Service['methods'][Method]['I']>
        | ReadonlySignal<InstanceType<Service['methods'][Method]['I']>>;
    },
  ): Promise<InstanceType<Service['methods'][Method]['O']>>;
}

export function useProtobufService<
  Service extends ServiceType,
  Method extends string & keyof Service['methods'],
>(
  service: Service,
  method: Method,
  {
    key,
    tags,
    input,
  }: AsyncActionCacheCreateOptions & {
    readonly input?: InstanceType<Service['methods'][Method]['I']>;
  } = {},
) {
  const {cache, fetch} = useAppContext().protobuf;

  const action = cache.create<Service, Method>(service, method, {
    key,
    tags,
    fetch,
  });

  return useAsyncAction(action, {input});
}

export class ProtobufServiceMethod<
  Service extends ServiceType,
  Method extends string & keyof Service['methods'],
> extends AsyncAction<
  InstanceType<Service['methods'][Method]['O']>,
  InstanceType<Service['methods'][Method]['I']>
> {
  readonly service: ServiceType;
  readonly method: string;

  constructor(
    service: ServiceType,
    method: string,
    {
      fetch,
      cached,
    }: NoInfer<{
      /**
       * The function used to run the protobuf method.
       */
      fetch?: ProtobufFetch;

      /**
       * An optional cached result to use for this query.
       */
      cached?: AsyncActionRunCache<
        InstanceType<Service['methods'][Method]['O']>,
        InstanceType<Service['methods'][Method]['I']>
      >;
    }>,
  ) {
    super((input) => fetch!(service, method, {input: input as any}) as any, {
      cached: cached && {
        ...cached,
        value:
          cached.value && cached.value instanceof Uint8Array
            ? (service.methods[method]?.O.fromBinary(cached.value) as any)
            : cached.value,
        input:
          cached.input && cached.input instanceof Uint8Array
            ? (service.methods[method]?.I.fromBinary(cached.input) as any)
            : cached.input,
      },
    });
    this.service = service;
    this.method = method;
  }

  serialize() {
    const serialized = super.serialize();
    if (serialized == null) return serialized;

    return {
      ...serialized,
      input: serialized.input?.toBinary(),
      value: serialized.value?.toBinary(),
    } as any as AsyncActionRunCache<
      InstanceType<Service['methods'][Method]['O']>,
      InstanceType<Service['methods'][Method]['I']>
    >;
  }
}

export class ProtobufCache {
  readonly #fetch?: ProtobufFetch;
  readonly #cache: AsyncActionCache;

  constructor({
    fetch,
    initial,
  }: {
    fetch?: ProtobufFetch;
    initial?: Iterable<AsyncActionCacheEntrySerialization<any>>;
  } = {}) {
    this.#fetch = fetch;
    this.#cache = new AsyncActionCache(initial);
  }

  run = <
    Service extends ServiceType,
    Method extends string & keyof Service['methods'],
  >(
    service: Service,
    method: Method,
    {
      key = `${service.typeName}/${method as string}`,
      tags,
      input,
      force,
      signal,
      fetch: explicitFetch,
    }: AsyncActionCacheCreateOptions & {
      readonly fetch?: ProtobufFetch;
      readonly input?: InstanceType<Service['methods'][Method]['I']>;
      readonly signal?: AbortSignal;
      readonly force?: boolean;
    } = {},
  ) => {
    const entry = this.#cache.create(
      (cached) =>
        new ProtobufServiceMethod<Service, Method>(service, method, {
          cached,
          fetch: explicitFetch ?? this.#fetch,
        }),
      {key, tags},
    );

    return entry.run(input, {signal, force});
  };

  fetch = this.run;

  create = <
    Service extends ServiceType,
    Method extends string & keyof Service['methods'],
  >(
    service: Service,
    method: Method,
    {
      key = `${service.typeName}/${method as string}`,
      tags,
      fetch: explicitFetch,
      cached: explicitCached,
    }: NoInfer<
      {
        readonly fetch?: ProtobufFetch;
        readonly cached?: AsyncActionRunCache<
          InstanceType<Service['methods'][Method]['O']>,
          InstanceType<Service['methods'][Method]['I']>
        >;
      } & AsyncActionCacheCreateOptions
    > = {},
  ): AsyncActionCacheEntry<ProtobufServiceMethod<Service, Method>> => {
    const entry = this.#cache.create(
      (cached) =>
        new ProtobufServiceMethod<Service, Method>(service, method, {
          cached: explicitCached ?? cached,
          fetch: explicitFetch ?? this.#fetch,
        }),
      {key, tags},
    );

    return entry;
  };

  clear() {
    this.#cache.clear();
  }

  *keys() {
    yield* this.#cache.keys();
  }

  *values() {
    yield* this.#cache.values();
  }

  *entries() {
    yield* this.#cache.entries();
  }

  restore(entries: Iterable<AsyncActionCacheEntrySerialization<any>>) {
    this.#cache.restore(entries);
  }

  serialize(): readonly AsyncActionCacheEntrySerialization<any>[] {
    return this.#cache.serialize();
  }
}
