import publicIp from "public-ip";
import cron from "node-cron";
import logger from "./logger";
import checkAndUpdate from "./checkDomainRecords"

require('dotenv-safe').config();

publicIp.v4().then((ourIp) => {
  // Do one run first and then run cronjob
  logger.info(`Started with IP ${ourIp}. Running once and then every ${process.env.CHECK_MINUTES} minutes`);
  checkAndUpdate();

  // Run every hour at X minutes.
  cron.schedule(`0 */${process.env.CHECK_MINUTES} * * * *`, () => {
    checkAndUpdate();
  });
});
