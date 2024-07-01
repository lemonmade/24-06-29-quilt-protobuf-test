import {AsyncComponent} from '@quilted/quilt/async';

export const Product = AsyncComponent.from(
  () => import('./product/Product.tsx'),
);
