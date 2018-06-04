import {Command} from "../Command";
import {inject, injectable} from "inversify";
import {RequestContext} from "../../domain/model/RequestContext";
import {CommandResponse, CommandResponseType} from "../CommandResponse";
import {MusicPlayer} from "../../domain/wrapper/MusicPlayer";
import {ClientHandle} from "../../domain/wrapper/ClientHandle";
import {MUSIC_REQUIRED_ROLE_ID, MUSIC_REQUIRED_ROLE_TOGGLE} from "../../properties";

@injectable()
export class StopCommand extends Command {

    @inject(MusicPlayer.name)
    private _musicPlayer: MusicPlayer;

    @inject(ClientHandle.name)
    private _clientHandle: ClientHandle;

    getLogName(): string {
        return StopCommand.name;
    }

    get name(): string {
        return "stop";
    }

    get description(): string {
        return "stops the currently playing song and clears the queue";
    }

    get syntax(): string {
        return "stop";
    }

    matches(command: string): boolean {
        return command === "stop";
    }

    validate(requestContext: RequestContext): CommandResponse {
        return new CommandResponse(CommandResponseType.SUCCESS);
    }

    async authorize(requestContext: RequestContext): Promise<CommandResponse> {
        if(MUSIC_REQUIRED_ROLE_TOGGLE) {
            if(await this._clientHandle.userHasRole(requestContext.user, MUSIC_REQUIRED_ROLE_ID)) {
                return new CommandResponse(CommandResponseType.SUCCESS);
            } else {
                return new CommandResponse(CommandResponseType.ERROR, "you're not allowed to use this command");
            }
        } else {
            return new CommandResponse(CommandResponseType.SUCCESS);
        }
    }

    async execute(requestContext: RequestContext): Promise<CommandResponse> {
        this._musicPlayer.stop();
        return new CommandResponse(CommandResponseType.SUCCESS, "stopped music");
    }

}
