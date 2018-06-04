import {Command} from "../Command";
import {inject, injectable} from "inversify";
import {RequestContext} from "../../domain/model/RequestContext";
import {CommandResponse, CommandResponseType} from "../CommandResponse";
import {ManagedMessageService} from "../../domain/service/ManagedMessageService";
import {MusicPlayer} from "../../domain/wrapper/MusicPlayer";
import {ClientHandle} from "../../domain/wrapper/ClientHandle";

@injectable()
export class SkipCommand extends Command {

    @inject(ManagedMessageService.name)
    private _managedMessageService: ManagedMessageService;

    @inject(MusicPlayer.name)
    private _musicPlayer: MusicPlayer;

    @inject(ClientHandle.name)
    private _clientHandle: ClientHandle;

    getLogName(): string {
        return SkipCommand.name;
    }

    get name(): string {
        return "skip";
    }

    get description(): string {
        return "skips the currently playing song";
    }

    get syntax(): string {
        return "skip";
    }

    matches(command: string): boolean {
        return command === "skip";
    }

    validate(requestContext: RequestContext): CommandResponse {
        return new CommandResponse(CommandResponseType.SUCCESS);
    }

    authorize(requestContext: RequestContext): CommandResponse {
        return new CommandResponse(CommandResponseType.SUCCESS);
    }

    async execute(requestContext: RequestContext): Promise<CommandResponse> {
        this._musicPlayer.next();
        return new CommandResponse(CommandResponseType.SUCCESS, "skipped current song");
    }

}
