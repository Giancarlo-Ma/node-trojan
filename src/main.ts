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
