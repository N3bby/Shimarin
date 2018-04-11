import {Command} from "./Command";
import {injectable} from "inversify";
import {CommandResponse, CommandResponseType} from "./CommandResponse";
import {RequestContext} from "../domain/model/RequestContext";
import {CommandArgument} from "./CommandArgument";

//TODO Test
@injectable()
export abstract class ArgumentedCommand extends Command {

    validate(requestContext: RequestContext): CommandResponse {
        return this._executeWithArguments(requestContext, this.validateArgumented) as CommandResponse;
    }

    abstract validateArgumented(requestContext: RequestContext, args: CommandArgument[]): CommandResponse;

    authorize(requestContext: RequestContext): CommandResponse {
        return this._executeWithArguments(requestContext, this.authorizeArgumented) as CommandResponse;
    }

    abstract authorizeArgumented(requestContext: RequestContext, args: CommandArgument[]): CommandResponse;

    async execute(requestContext: RequestContext): Promise<CommandResponse> {
        //Apparently you can await on a non-promise value: https://github.com/Microsoft/TypeScript/issues/8310
        return await this._executeWithArguments(requestContext, this.executeArgumented);
    }

    abstract async executeArgumented(requestContext: RequestContext, args: CommandArgument[]): Promise<CommandResponse>;

    private _executeWithArguments(requestContext: RequestContext, func: (requestContext: RequestContext, args: CommandArgument[]) => CommandResponse | Promise<CommandResponse>): CommandResponse | Promise<CommandResponse> {
        let args: CommandArgument[];
        try {
            args = this._parseArguments(requestContext);
        } catch (e) {
            return new CommandResponse(CommandResponseType.ERROR, "command format is invalid");
        }
        return func(requestContext, args);
    }

    //TODO Refactor this into multiple methods and write tests
    // noinspection JSMethodCanBeStatic
    private _parseArguments(requestContext: RequestContext): CommandArgument[] {

        //Concat strings -> used ""
        let concatArgs = [];
        let currentString = undefined;
        for (let i = 0; i < requestContext.args.length; i++) {
            if (requestContext.args[i].startsWith("\"")) {
                if (currentString === undefined) currentString = "";
                currentString += requestContext.args[i].substr(1);

            } else if (requestContext.args[i].endsWith("\"")) {
                if (currentString === undefined) throw new Error("invalid command argument string detected");
                currentString += requestContext.args[i].substr(0, requestContext.args[i].length - 1);
                //Push string and set currentString to undefined
                concatArgs.push(currentString);
                currentString = undefined;
            } else {
                concatArgs.push(requestContext.args[i]);
            }
        }

        let result: CommandArgument[] = [];

        for (let i = 0; i < concatArgs.length; i++) {
            if (concatArgs[i].startsWith("-")) {
                if (i + 1 < concatArgs.length && !concatArgs[i + 1].startsWith("-")) {
                    result.push(new CommandArgument(concatArgs[i].substr(1), concatArgs[i + 1]));
                } else {
                    result.push(new CommandArgument(concatArgs[i].substr(1), undefined));
                }
            }
        }

        return result;

    }

}