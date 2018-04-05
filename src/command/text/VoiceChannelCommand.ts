import {Command} from "../Command";
import {RequestContext} from "../../domain/model/RequestContext";
import {CommandResponse, CommandResponseType} from "../CommandResponse";
import {ClientHandle} from "../../domain/wrapper/ClientHandle";
import {inject, injectable} from "inversify";
import {VoiceChannel} from "discord.js";

@injectable()
export class VoiceChannelCommand extends Command{

    @inject(ClientHandle.name)
    private _clientHandle: ClientHandle;

    get log_name(): string {
        return VoiceChannelCommand.name;
    }

    get name(): string {
        return "voiceChannel";
    }

    get description(): string {
        return "Returns the name of the voice channel the user is in";
    }

    get syntax(): string {
        return "voiceChannel";
    }

    matches(command: string): boolean {
        return command === "voiceChannel";
    }

    authorize(requestContext: RequestContext): CommandResponse {
        return new CommandResponse(CommandResponseType.SUCCESS);
    }

    validate(requestContext: RequestContext): CommandResponse {
        return new CommandResponse(CommandResponseType.SUCCESS);
    }

    async execute(requestContext: RequestContext): Promise<CommandResponse> {

        let voiceChannel: VoiceChannel = this._clientHandle.getUserVoiceChannel(requestContext.user);

        if(voiceChannel === null) {
            return new CommandResponse(CommandResponseType.ERROR, "you are not in a voice channel currently");
        } else {
            return new CommandResponse(CommandResponseType.SUCCESS, "you are in " + voiceChannel.name);
        }

    }
}