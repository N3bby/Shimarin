
/**
 * Response object for command execution steps
 */
export class CommandResponse {

    private _type: CommandResponseType;
    private _message: string;

    constructor(type: CommandResponseType, message?: string) {
        this._type = type;
        this._message = message;
    }

    /**
     * Response type (succeeded, failed, etc.)
     * @returns {CommandResponseType}
     */
    get type(): CommandResponseType {
        return this._type;
    }

    /**
     * Response message
     * @returns {string}
     */
    get message(): string {
        return this._message;
    }

}

export enum CommandResponseType {

    /**
     * Command step executed successfully
     */
    SUCCESS,

    /**
     * Error during execution of command step
     */
    ERROR

}