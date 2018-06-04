import {Command} from "../Command";
import {inject, injectable} from "inversify";
import {RequestContext} from "../../domain/model/RequestContext";
import {CommandResponse, CommandResponseType} from "../CommandResponse";
import {ManagedMessageService} from "../../domain/service/ManagedMessageService";
import {MusicPlayer} from "../../domain/wrapper/MusicPlayer";
import {ClientHandle} from "../../domain/wrapper/ClientHandle";

@injectable()
export class StopCommand extends Command {

    @inject(ManagedMessageService.name)
    private _managedMessageService: ManagedMessageService;

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

    authorize(requestContext: RequestContext): CommandResponse {
        return new CommandResponse(CommandResponseType.SUCCESS);
    }

    async execute(requestContext: RequestContext): Promise<CommandResponse> {
        this._musicPlayer.stop();
        return new CommandResponse(CommandResponseType.SUCCESS, "stopped music");
    }

}
