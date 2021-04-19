import { createLogger, format, transports } from "winston";

import dayjs from "dayjs";

const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const timezoned = () => dayjs().tz(process.env.TIMEZONE).format("YYYY-MM-DD HH:mm:ss");

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({
      format: timezoned,
    }),
    format.simple()
  ),
  transports: [new transports.Console()],
});

export default logger;
