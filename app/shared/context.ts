import type {Router} from '@quilted/quilt/navigate';
import {createOptionalContext} from '@quilted/quilt/context';

export interface AppContext {
  readonly router: Router;
}

export const AppContextReact = createOptionalContext<AppContext>();
export const useAppContext = AppContextReact.use;
