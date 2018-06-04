import {Command} from "../Command";
import {inject, injectable} from "inversify";
import {RequestContext} from "../../domain/model/RequestContext";
import {CommandResponse, CommandResponseType} from "../CommandResponse";
import {MusicPlayer} from "../../domain/wrapper/MusicPlayer";
import {ClientHandle} from "../../domain/wrapper/ClientHandle";
import {MUSIC_REQUIRED_ROLE_ID, MUSIC_REQUIRED_ROLE_TOGGLE} from "../../properties";

@injectable()
export class VolumeCommand extends Command {

    @inject(MusicPlayer.name)
    private _musicPlayer: MusicPlayer;

    @inject(ClientHandle.name)
    private _clientHandle: ClientHandle;

    getLogName(): string {
        return VolumeCommand.name;
    }

    get name(): string {
        return "volume";
    }

    get description(): string {
        return "changes the music volume";
    }

    get syntax(): string {
        return "volume";
    }

    matches(command: string): boolean {
        return command === "volume" || command === "vol";
    }

    validate(requestContext: RequestContext): CommandResponse {
        if(requestContext.args.length !== 1) {
            return new CommandResponse(CommandResponseType.ERROR, "you must give a new volume value (0-200)");
        } else {
            try {
                let volume = parseFloat(requestContext.args[0]);
                if(volume < 0 || volume > 200) {
                    return new CommandResponse(CommandResponseType.ERROR, "volume must be between 0 and 200 (inclusive)");
                }
                return new CommandResponse(CommandResponseType.SUCCESS);
            } catch (e) {
                return new CommandResponse(CommandResponseType.ERROR, `'${requestContext.args[0]}' is not a valid volume value`);
            }
        }
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
        this._musicPlayer.volume = parseFloat(requestContext.args[0])/100;
        return new CommandResponse(CommandResponseType.SUCCESS);
    }

}
