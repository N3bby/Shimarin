import "reflect-metadata";
import {Container} from "inversify";
import {MessageHandlerService} from "../domain/service/MessageHandlerService";
import {ManagedMessageService} from "../domain/service/ManagedMessageService";
import {ClientHandle} from "../domain/wrapper/ClientHandle";
import {CommandOutputService} from "../domain/service/CommandOutputService";
import {Command} from "../command/Command";
import {PingCommand} from "../command/text/PingCommand";
import {CommandHandlerService} from "../domain/service/CommandHandlerService";
import {PlayCommand} from "../command/music/PlayCommand";
import {MusicPlayer} from "../domain/wrapper/MusicPlayer";

const container = new Container({defaultScope: "Singleton"});

container.bind<ClientHandle>(ClientHandle.name).to(ClientHandle);
container.bind<CommandOutputService>(CommandOutputService.name).to(CommandOutputService);
container.bind<CommandHandlerService>(CommandHandlerService.name).to(CommandHandlerService);
container.bind<MessageHandlerService>(MessageHandlerService.name).to(MessageHandlerService);
container.bind<ManagedMessageService>(ManagedMessageService.name).to(ManagedMessageService);
container.bind<MusicPlayer>(MusicPlayer.name).to(MusicPlayer);

//Commands
container.bind<Command>(Command.name).to(PingCommand);
container.bind<PingCommand>(PingCommand.name).to(PingCommand);

container.bind<Command>(Command.name).to(PlayCommand);
container.bind<PlayCommand>(PlayCommand.name).to(PlayCommand);

export {container};