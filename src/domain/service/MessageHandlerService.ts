import {Message, TextChannel, User} from "discord.js";
import {ClientHandle} from "../wrapper/ClientHandle";
import {inject, injectable} from "inversify";
import {ManagedMessageService} from "./ManagedMessageService";
import {COMMAND_PREFIX, LISTEN_TO_OTHER_CHANNELS, MAIN_TEXT_CHANNEL} from "../../properties";
import {createLogger, Logger} from "../../logging/Logging";
import {CommandHandlerService} from "./CommandHandlerService";

@injectable()
export class MessageHandlerService {

    private _logger: Logger = createLogger(MessageHandlerService.name);

    @inject(ClientHandle.name)
    private _clientHandle: ClientHandle;

    @inject(ManagedMessageService.name)
    private _managedMessageService: ManagedMessageService;

    @inject(CommandHandlerService.name)
    private _commandHandlerService: CommandHandlerService;

    private _activeUser: User;
    private _mainTextChannel: TextChannel;

    initialize() {
        this._activeUser = this._clientHandle.getActiveUser();
        this._mainTextChannel = this._clientHandle.getMainTextChannel();
        this._clientHandle.registerMessageHandler(this._handleMessage.bind(this));
    }

    private _handleMessage(message: Message) {
        //Ignore own messages
        if(message.author.id === this._activeUser.id) {
            return;
        }
        //If message is not in the guild of the main channel, ignore it
        if(message.guild.id !== this._mainTextChannel.guild.id) {
            return;
        }
        //If not listening to other channels and message is in another channel, ignore it
        if(message.channel.id !== MAIN_TEXT_CHANNEL && !LISTEN_TO_OTHER_CHANNELS) {
            return;
        }
        try {
            if (message.content.startsWith(COMMAND_PREFIX)) {
                //Is a command
                this._commandHandlerService.handleMessage(message);
                message.delete().catch(reason => {
                    this._logger.error(`on delete '${reason}'`);
                });
            } else {
                //Is a normal text message
                this._managedMessageService.handleMessage(message);
            }
        } catch (e) {
            this._logger.error(`Error thrown for message '${message.content}' -> '${e}'`);
        }
    }

}