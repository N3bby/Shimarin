import {Command} from "../../Command";
import {CommandResponse, CommandResponseType} from "../../CommandResponse";
import {RequestContext} from "../../../domain/model/RequestContext";
import {ClientHandle} from "../../../domain/wrapper/ClientHandle";
import {CommandHandlerService} from "../../../domain/service/CommandHandlerService";
import {inject, injectable} from "inversify";
import {container} from "../../../inversify/inversify.config";
import {MusicPlayer} from "../../../domain/wrapper/MusicPlayer";

@injectable()
export class SoundCommand extends Command {

    @inject(MusicPlayer.name)
    private _musicPlayer: MusicPlayer;

    @inject(ClientHandle.name)
    private _clientHandle: ClientHandle;

    private _sounds: Map<string, string> = new Map<string, string>();

    constructor() {
        super();
        this._sounds.set("hoe", "https://www.youtube.com/watch?v=b1FinfVUp38");
        this._sounds.set("poggers", "https://www.youtube.com/watch?v=XbSM3tC0Lsc");
        this._sounds.set("hyo", "https://www.youtube.com/watch?v=-XzlCWn57Jw");
    }

    getLogName(): string {
        return SoundCommand.name;
    }

    get name(): string {
        return "sound"
    }

    get description(): string {
        return "plays a sound, possible sounds are: " + Array.from(this._sounds.keys()).reduce((k1, k2) => k1 + ", " + k2, "");
    }

    get syntax(): string {
        return "<sound>";
    }

    matches(command: string): boolean {
        return Array.from(this._sounds.keys()).find(sound => command === sound) !== undefined;
    }

    validate(requestContext: RequestContext): CommandResponse {
        if(!this._sounds.get(requestContext.command)) {
            return new CommandResponse(CommandResponseType.ERROR, `sound '${requestContext.command}' not found`);
        }
        return new CommandResponse(CommandResponseType.SUCCESS);
    }

    async authorize(requestContext: RequestContext): Promise<CommandResponse> {
        return new CommandResponse(CommandResponseType.SUCCESS);
    }

    async execute(requestContext: RequestContext): Promise<CommandResponse> {
        let soundLink = this._sounds.get(requestContext.command);
        let playCommand: RequestContext = new RequestContext(requestContext.user, "play", [soundLink], new Date());

        //Bad hack to prevent circular dependencies (maybe fixable using lazyInject?)
        let commandHandlerService: CommandHandlerService = container.get(CommandHandlerService.name);
        commandHandlerService.handleCommand(playCommand);

        return new CommandResponse(CommandResponseType.SUCCESS);
    }

}