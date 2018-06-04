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
import {VoiceChannelCommand} from "../command/text/VoiceChannelCommand";
import {DefaultMusicPlayer} from "../domain/wrapper/DefaultMusicPlayer";
import {SkipCommand} from "../command/music/SkipCommand";
import {StopCommand} from "../command/music/StopCommand";
import {VolumeCommand} from "../command/music/VolumeCommand";

const container = new Container({defaultScope: "Singleton"});

//Decorate third party classes
decorate(injectable(), events.EventEmitter);

//Services and wrappers
container.bind<ClientHandle>(ClientHandle.name).to(ClientHandle);
container.bind<CommandOutputService>(CommandOutputService.name).to(CommandOutputService);
container.bind<CommandHandlerService>(CommandHandlerService.name).to(CommandHandlerService);
container.bind<MessageHandlerService>(MessageHandlerService.name).to(MessageHandlerService);
container.bind<ManagedMessageService>(ManagedMessageService.name).to(ManagedMessageService);
container.bind<MusicPlayer>(MusicPlayer.name).to(DefaultMusicPlayer);

//Managed Messages
container.bind<ManagedMessage>(ManagedMessage.name).to(MainManagedMessage).onActivation(() => {
    //Binds this ManagedMessage to the actual Singleton instance of MainManagedMessage
    return container.get<MainManagedMessage>(MainManagedMessage.name);
});
container.bind<MainManagedMessage>(MainManagedMessage.name).to(MainManagedMessage);

container.bind<ManagedMessage>(ManagedMessage.name).to(SongSelectionManagedMessage).inTransientScope();
container.bind<SongSelectionManagedMessage>(SongSelectionManagedMessage.name).to(SongSelectionManagedMessage).inTransientScope();

//Commands
container.bind<Command>(Command.name).to(PingCommand);
container.bind<Command>(Command.name).to(PlayCommand);
container.bind<Command>(Command.name).to(SkipCommand);
container.bind<Command>(Command.name).to(StopCommand);
container.bind<Command>(Command.name).to(VolumeCommand);
container.bind<Command>(Command.name).to(VoiceChannelCommand);

export {container};