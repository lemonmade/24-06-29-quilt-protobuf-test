import styles from './Home.module.css';

import {useProtobufMethod} from '~/shared/protobuf.ts';

import {HomeService} from '../../proto/home_connect.ts';

export default function Home() {
  const message = useProtobufMethod(HomeService, 'query');

  return <div className={styles.Home}>{message.value?.greeting}</div>;
}
