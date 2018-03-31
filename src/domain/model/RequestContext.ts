import {Message, User} from "discord.js";

/**
 * Context object with information about a user request
 */
export class RequestContext {

    private _user: User;
    private _command: string;
    private _args: string[];
    private _timestamp: Date;

    constructor(user: User, command: string, args: string[], timestamp: Date) {
        this._user = user;
        this._command = command;
        this._args = args;
        this._timestamp = timestamp;
    }

    /**
     * The user that did the request
     * @returns {"discord.js".User}
     */
    get user(): User {
        return this._user;
    }

    /**
     * The command that was requested
     * @returns {string}
     */
    get command(): string {
        return this._command;
    }

    /**
     * Arguments for the requested command
     * @returns {string[]}
     */
    get args(): string[] {
        return this._args;
    }

    /**
     * When the request was made
     * @returns {Date}
     */
    get timestamp(): Date {
        return this._timestamp;
    }

}