import {Command} from "../../Command";
import {inject, injectable} from "inversify";
import {RequestContext} from "../../../domain/model/RequestContext";
import {CommandResponse, CommandResponseType} from "../../CommandResponse";
import {MusicPlayer} from "../../../domain/wrapper/MusicPlayer";
import {ClientHandle} from "../../../domain/wrapper/ClientHandle";
import {container} from "../../../inversify/inversify.config";
import {CommandHandlerService} from "../../../domain/service/CommandHandlerService";

@injectable()
export class HoeCommand extends Command {

    @inject(MusicPlayer.name)
    private _musicPlayer: MusicPlayer;

    @inject(ClientHandle.name)
    private _clientHandle: ClientHandle;

    private _ytHoeUrl: string = "https://www.youtube.com/watch?v=b1FinfVUp38";

    getLogName(): string {
        return HoeCommand.name;
    }

    get name(): string {
        return "hoe";
    }

    get description(): string {
        return "plays 'your mom's a hoe' meme";
    }

    get syntax(): string {
        return "hoe";
    }

    matches(command: string): boolean {
        return command === "hoe";
    }

    validate(requestContext: RequestContext): CommandResponse {
        return new CommandResponse(CommandResponseType.SUCCESS);
    }

    async authorize(requestContext: RequestContext): Promise<CommandResponse> {
        return new CommandResponse(CommandResponseType.SUCCESS);
    }

    async execute(requestContext: RequestContext): Promise<CommandResponse> {
        let playCommand: RequestContext = new RequestContext(requestContext.user, "play", [this._ytHoeUrl], new Date());

        //Bad hack to prevent circular dependencies (maybe fixable using lazyInject?)
        let commandHandlerService: CommandHandlerService = container.get(CommandHandlerService.name);
        commandHandlerService.handleCommand(playCommand);

        return new CommandResponse(CommandResponseType.SUCCESS);
    }

}
