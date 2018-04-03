import "reflect-metadata";
import {Container, decorate, injectable} from "inversify";
import {MessageHandlerService} from "../domain/service/MessageHandlerService";
import {ManagedMessageService} from "../domain/service/ManagedMessageService";
import {ClientHandle} from "../domain/wrapper/ClientHandle";
import {CommandOutputService} from "../domain/service/CommandOutputService";
import {Command} from "../command/Command";
import {PingCommand} from "../command/text/PingCommand";
import {CommandHandlerService} from "../domain/service/CommandHandlerService";
import {PlayCommand} from "../command/music/PlayCommand";
import {MusicPlayer} from "../domain/wrapper/MusicPlayer";
import {ManagedMessage} from "../domain/message/ManagedMessage";
import {MainManagedMessage} from "../domain/message/main/MainManagedMessage";
import {SongSelectionManagedMessage} from "../domain/message/song_selection/SongSelectionMessage";
import * as events from "events";

const container = new Container({defaultScope: "Singleton"});

//Decorate third party classes
decorate(injectable(), events.EventEmitter);

//Services and wrappers
container.bind<ClientHandle>(ClientHandle.name).to(ClientHandle);
container.bind<CommandOutputService>(CommandOutputService.name).to(CommandOutputService);
container.bind<CommandHandlerService>(CommandHandlerService.name).to(CommandHandlerService);
container.bind<MessageHandlerService>(MessageHandlerService.name).to(MessageHandlerService);
container.bind<ManagedMessageService>(ManagedMessageService.name).to(ManagedMessageService);
container.bind<MusicPlayer>(MusicPlayer.name).to(MusicPlayer);

//Managed Messages
container.bind<ManagedMessage>(ManagedMessage.name).to(MainManagedMessage);
container.bind<MainManagedMessage>(MainManagedMessage.name).to(MainManagedMessage);

container.bind<ManagedMessage>(ManagedMessage.name).to(SongSelectionManagedMessage).inTransientScope();
container.bind<SongSelectionManagedMessage>(SongSelectionManagedMessage.name).to(SongSelectionManagedMessage).inTransientScope();

//Commands
container.bind<Command>(Command.name).to(PingCommand);
container.bind<PingCommand>(PingCommand.name).to(PingCommand);

container.bind<Command>(Command.name).to(PlayCommand);
container.bind<PlayCommand>(PlayCommand.name).to(PlayCommand);

export {container};