import type {Router} from '@quilted/quilt/navigate';
import {createOptionalContext} from '@quilted/quilt/context';

import type {ProtobufCache} from './protobuf.ts';

export interface AppContext {
  readonly router: Router;
  readonly protobuf: ProtobufCache;
}

export const AppContextReact = createOptionalContext<AppContext>();
export const useAppContext = AppContextReact.use;
