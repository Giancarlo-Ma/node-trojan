import { program } from 'commander';

import { Config } from './core/config';
import { info } from './core/logger';
import { Service } from './core/service';
import { getVersion } from './core/version';

info(`Welcome to trojan ${getVersion()}`);

program
  .option('-c, --config <filename>', 'specify config file', 'config.json')
  .parse();

const options = program.opts();

let restart: boolean;
const config = new Config();
(async () => {
  do {
    restart = false;
    await config.load(options.config);
    const service = new Service(config);
    service.run();
  } while (restart);
})();

// import { connect } from 'tls';

// const socket = connect(
//   {
//     host: 'www.hangshu.ml',
//     port: 1080,
//     rejectUnauthorized: false,
//     checkServerIdentity: () => {
//       return null;
//     },
//   },
//   () => {
//     if (socket.authorized) {
//       console.log('Connection authorized by a Certificate Authority.');
//     } else {
//       console.log('Connection not authorized: ' + socket.authorizationError);
//     }
//     process.stdin.pipe(socket);
//     process.stdin.resume();
//   },
// );

// socket.on('data', (data) => {
//   console.log(data.toString());
// });
