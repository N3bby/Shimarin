import {RequestContext} from "../domain/model/RequestContext";
import {CommandResponse, CommandResponseType} from "./CommandResponse";
import {injectable} from "inversify";

/**
 * Base class for commands
 */
@injectable()
export abstract class Command {

    /**
     * The name identifier used for logging
     * @returns {string}
     */
    abstract get log_name(): string;

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
    abstract authorize(requestContext: RequestContext): CommandResponse;

    /**
     * Executes the command
     * @param {RequestContext} requestContext
     * @returns {CommandResponse}
     */
    async abstract execute(requestContext:RequestContext): Promise<CommandResponse>;

    /**
     * Validates, authorizes and executes the request/command
     * @param {RequestContext} requestContext
     * @returns {CommandResponse}
     */
    async validateAuthorizeAndExecute(requestContext: RequestContext): Promise<CommandResponse> {

        let validationResponse: CommandResponse = this.validate(requestContext);
        if(validationResponse.type === CommandResponseType.ERROR) {
            return validationResponse;
        }

        let authorizationResponse: CommandResponse = this.authorize(requestContext);
        if(authorizationResponse.type === CommandResponseType.ERROR) {
            return authorizationResponse;
        }

        return this.execute(requestContext);

    }

}

