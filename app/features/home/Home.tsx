import styles from './Home.module.css';

import {useProtobufFetch} from '~/shared/protobuf.ts';

import {HomeResponse} from '../../proto/home_pb.ts';

export default function Home() {
  const message = useProtobufFetch(
    async () => {
      console.log('FETCHED');
      return new HomeResponse({greeting: 'Hello, world!'});
    },
    {key: '/', type: HomeResponse},
  );

  console.log(message.value);

  return <div className={styles.Home}>Hello world!</div>;
}
