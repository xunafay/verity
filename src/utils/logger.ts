export enum Level {
    DEBUG = 100,
    INFO = 200,
    NOTICE = 300,
    WARNING = 400,
    ERROR = 500,
    CRITICAL = 600,
    ALERT = 700,
    EMERGENCY = 800,
  }

  export class Logger {
    static log(level: Level, message: string, actor: string) {
      console.log(`t:${Game.time} [${Level[level]}] [${actor}] ${message}`);
    }

    static debug(message: string, actor: string) {
      Logger.log(Level.DEBUG, message, actor);
    }

    static info(message: string, actor: string) {
      Logger.log(Level.INFO, message, actor);
    }

    static notice(message: string, actor: string) {
      Logger.log(Level.NOTICE, message, actor);
    }

    static warning(message: string, actor: string) {
      Logger.log(Level.WARNING, message, actor);
    }

    static error(message: string, actor: string) {
      Logger.log(Level.ERROR, message, actor);
    }

    static critical(message: string, actor: string) {
      Logger.log(Level.CRITICAL, message, actor);
    }

    static alert(message: string, actor: string) {
      Logger.log(Level.ALERT, message, actor);
    }

    static emergency(message: string, actor: string) {
      Logger.log(Level.EMERGENCY, message, actor);
    }
  }
