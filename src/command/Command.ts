import {RequestContext} from "../domain/model/RequestContext";
import {CommandResponse, CommandResponseType} from "./CommandResponse";
import {injectable} from "inversify";
import {createLogger, Logger} from "../logging/Logging";

/**
 * Base class for commands
 */
@injectable()
export abstract class Command {

    protected _logger: Logger;

    // noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
    constructor() {
        this._logger = createLogger(this.getLogName());
    }

    /**
     * The name identifier used for logging
     * @returns {string}
     */
    abstract getLogName(): string;

    /**
     * The name of the command
     * @returns {string}
     */
    abstract get name(): string;

    /**
     * The description of the command
     * @returns {string}
     */
    abstract get description(): string;

    /**
     * Example syntax of the command
     * @returns {string}
     */
    abstract get syntax(): string;

    /**
     * Checks whether this command matches the given command string
     * @param {string} command
     * @returns {boolean}
     */
    abstract matches(command: string): boolean;

    /**
     * Validates parameters of the request
     * @param {RequestContext} requestContext
     * @returns {boolean}
     */
    abstract validate(requestContext: RequestContext): CommandResponse;

    /**
     * Authorizes the request
     * @param {RequestContext} requestContext
     * @returns {boolean}
     */
    abstract async authorize(requestContext: RequestContext): Promise<CommandResponse>;

    /**
     * Executes the command
     * @param {RequestContext} requestContext
     * @returns {CommandResponse}
     */
    abstract async execute(requestContext: RequestContext): Promise<CommandResponse>;

    /**
     * Validates, authorizes and executes the request/command
     * @param {RequestContext} requestContext
     * @returns {CommandResponse}
     */
    async validateAuthorizeAndExecute(requestContext: RequestContext): Promise<CommandResponse> {

        try {

            let validationResponse: CommandResponse = this.validate(requestContext);
            if (validationResponse.type !== CommandResponseType.SUCCESS) {
                return validationResponse;
            }

            let authorizationResponse: CommandResponse = await this.authorize(requestContext);
            if (authorizationResponse.type !== CommandResponseType.SUCCESS) {
                return authorizationResponse;
            }

            return this.execute(requestContext);

        } catch (e) {
            this._logger.error(`on command '${e}'`);
            return new CommandResponse(CommandResponseType.ERROR, "something went wrong while executing your command");
        }

    }

}

