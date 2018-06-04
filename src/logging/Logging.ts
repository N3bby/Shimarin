import moment = require("moment");
import {LOG_LEVEL} from "../properties";

export class Logger {

    private _componentName: string;

    constructor(componentName: string) {
        this._componentName = componentName;
    }

    log(logLevel: LogLevel, message: string, color: string) {
        if(logLevel < LOG_LEVEL) return;
        let localTimeStr: string = moment().local().format("YYYY-MM-DD HH:mm:ss,SSS");
        let logLevelStr: string = LogLevel[logLevel];
        console.log(`${color}${localTimeStr} ${logLevelStr} [${this._componentName}] ${message}\x1b[0m`)
    }

    debug(message: string) {
        this.log(LogLevel.DEBUG, message,"\x1b[2m");
    }

    info(message: string) {
        this.log(LogLevel.INFO, message, "");
    }

    warn(message: string) {
        this.log(LogLevel.WARN, message, "\x1b[33m");
    }

    error(message: string) {
        this.log(LogLevel.ERROR, message, "\x1b[31m" );
    }

}

export enum LogLevel {
    DEBUG,
    INFO,
    WARN,
    ERROR
}

export const createLogger = (componentName: string) => new Logger(componentName);
