import {Command} from "../Command";
import {RequestContext} from "../../domain/model/RequestContext";
import {CommandResponse, CommandResponseType} from "../CommandResponse";
import {injectable} from "inversify";

@injectable()
export class PingCommand extends Command {

    getLogName(): string {
        return PingCommand.name;
    }

    get name(): string {
        return "ping";
    }

    get description(): string {
        return "pongs!"
    }

    get syntax(): string {
        return "ping";
    }

    matches(command: string): boolean {
        return command === "ping";
    }

    validate(requestContext: RequestContext): CommandResponse {
        return new CommandResponse(CommandResponseType.SUCCESS);
    }

    authorize(requestContext: RequestContext): CommandResponse {
        return new CommandResponse(CommandResponseType.SUCCESS);
    }

    async execute(requestContext: RequestContext): Promise<CommandResponse> {
        return new CommandResponse(CommandResponseType.SUCCESS, "pong");
    }

}