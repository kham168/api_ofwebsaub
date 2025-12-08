import chalk from "chalk";

/**
 * Log info level messages with timestamp and blue styling
 * @param {any} args - The message or object to log
 */
export const loggingInfo = (args) => {
  const timestamp = new Date().toLocaleString();
  const prefix = chalk.blue(`${timestamp}\t${chalk.bgBlue("[INFO]")}\t`);

  if (typeof args === "string") {
    console.log(prefix, chalk.blueBright(args));
  } else {
    const serialized =
      args !== null && args !== undefined
        ? JSON.stringify(args, null, 2)
        : String(args);
    console.log(prefix, chalk.blueBright(serialized));
  }
};

/**
 * Log warning level messages with timestamp and yellow styling
 * @param {any} args - The message or object to log
 */
export const loggingWarning = (args) => {
  const timestamp = new Date().toLocaleString();
  const prefix = chalk.yellow(`${timestamp}\t${chalk.bgYellow("[WARNING]")}\t`);

  if (typeof args === "string") {
    console.log(prefix, chalk.yellowBright(args));
  } else {
    const serialized =
      args !== null && args !== undefined
        ? JSON.stringify(args, null, 2)
        : String(args);
    console.log(prefix, chalk.yellowBright(serialized));
  }
};

/**
 * Log error level messages with timestamp and red styling
 * @param {any} args - The message or object to log
 */
export const loggingError = (args) => {
  const timestamp = new Date().toLocaleString();
  const prefix = chalk.red(`${timestamp}\t${chalk.bgRed("[ERROR]")}\t`);

  if (typeof args === "string") {
    console.log(prefix, chalk.redBright(args));
  } else {
    const serialized =
      args !== null && args !== undefined
        ? JSON.stringify(args, null, 2)
        : String(args);
    console.log(prefix, chalk.redBright(serialized));
  }
};
