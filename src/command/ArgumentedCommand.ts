import {Command} from "./Command";
import {injectable} from "inversify";
import {CommandResponse, CommandResponseType} from "./CommandResponse";
import {RequestContext} from "../domain/model/RequestContext";
import {CommandArgument} from "./CommandArgument";
import {ArgumentParser} from "./ArgumentParser";

//TODO Test
@injectable()
export abstract class ArgumentedCommand extends Command {

    validate(requestContext: RequestContext): CommandResponse {
        return this._executeWithArguments(requestContext, this.validateArgumented) as CommandResponse;
    }

    abstract validateArgumented(requestContext: RequestContext, args: CommandArgument[], body: string): CommandResponse;

    authorize(requestContext: RequestContext): CommandResponse {
        return this._executeWithArguments(requestContext, this.authorizeArgumented) as CommandResponse;
    }

    abstract authorizeArgumented(requestContext: RequestContext, args: CommandArgument[], body: string): CommandResponse;

    async execute(requestContext: RequestContext): Promise<CommandResponse> {
        //Apparently you can await on a non-promise value: https://github.com/Microsoft/TypeScript/issues/8310
        return await this._executeWithArguments(requestContext, this.executeArgumented);
    }

    abstract async executeArgumented(requestContext: RequestContext, args: CommandArgument[], body: string): Promise<CommandResponse>;

    private _executeWithArguments(requestContext: RequestContext, func: (requestContext: RequestContext, args: CommandArgument[], body: string) => CommandResponse | Promise<CommandResponse>): CommandResponse | Promise<CommandResponse> {
        let params: { args: CommandArgument[]; body: string };
        try {
            params = ArgumentParser.getCommandArguments(requestContext.args);
        } catch (e) {
            return new CommandResponse(CommandResponseType.ERROR, "command format is invalid");
        }
        return func(requestContext, params.args, params.body);
    }

}

