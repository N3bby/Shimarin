import {container} from "./inversify/inversify.config";
import {MessageHandlerService} from "./domain/service/MessageHandlerService";
import {ManagedMessageService} from "./domain/service/ManagedMessageService";
import {ClientHandle} from "./domain/wrapper/ClientHandle";
import {createLogger} from "./logging/Logging";
import {YoutubeSearchApiWrapper} from "./domain/wrapper/YoutubeSearchApiWrapper";
import {MainManagedMessage} from "./domain/message/main/MainManagedMessage";
import {SongSelectionManagedMessage} from "./domain/message/song_selection/SongSelectionMessage";

let logger = createLogger("App");

container.get<ClientHandle>(ClientHandle.name).initialize().then(() => {
    logger.info("Initialized client");
    logger.info(`Logged in as ${container.get<ClientHandle>(ClientHandle.name).getActiveUser().tag}`);
    container.get<MessageHandlerService>(MessageHandlerService.name).initialize();
    container.get<MainManagedMessage>(MainManagedMessage.name).initialize();
}).catch(reason => {
    logger.error(`on ClientHandle initialize '${reason}'`);
});