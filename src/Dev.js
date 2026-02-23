import config from './config.json';
import { initDev } from '@profitlich/template-toolkit/dev';
import { FormieFillIn } from './dev/formie-fill-in/FormieFillIn.js';

initDev(config);
new FormieFillIn();