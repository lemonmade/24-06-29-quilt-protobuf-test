import type {RenderableProps} from 'preact';
import {Suspense} from 'preact/compat';
import {Link} from '@quilted/quilt/navigate';

import styles from './Frame.module.css';

export function Frame({children}: RenderableProps<{}>) {
  return (
    <div className={styles.Frame}>
      <div>
        <Link to="/">Home</Link>
        <Link to="/product">Product</Link>
      </div>
      <Suspense fallback={null}>{children}</Suspense>
    </div>
  );
}
