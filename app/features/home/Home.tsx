import styles from './Home.module.css';

import {useProtobufService} from '~/shared/protobuf.ts';

import {HomeService} from '../../proto/home_connect.ts';

export default function Home() {
  const message = useProtobufService(HomeService, 'query');

  return <div className={styles.Home}>{message.value?.greeting}</div>;
}
