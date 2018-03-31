import {ManagedMessage} from "../message/ManagedMessage";
import {MainManagedMessage} from "../message/main/MainManagedMessage";
import {inject, injectable} from "inversify";
import {ClientHandle} from "../wrapper/ClientHandle";
import {Message} from "discord.js";
import {ManagedMessageType} from "../message/ManagedMessageType";
import {SongSelectionManagedMessage} from "../message/song_selection/SongSelectionMessage";

@injectable()
export class ManagedMessageService {

    @inject(ClientHandle.name)
    private _clientHandle: ClientHandle;

    private _managedMessages: ManagedMessage[] = [];

    /**
     * Initialize the Service
     * Creates the main message
     */
    initialize() {
        this._createManagedMessage(ManagedMessageType.MAIN);
        this._createManagedMessage(ManagedMessageType.SONG_SELECTION);
    }

    /**
     * Forwards the message event to all ManagedMessages
     * @param {"discord.js".Message} message
     */
    handleMessage(message: Message) {
        for (let managedMessage of this._managedMessages) {
            managedMessage.handleMessage(message);
        }
    }

    /**
     * Gets message of a specific type. If it does not exist yet, it's created
     * @param {ManagedMessageType} managedMessageType
     * @returns {ManagedMessage | undefined}
     */
    getMessage(managedMessageType: ManagedMessageType): ManagedMessage {
        let message = this._managedMessages.find(message => message.managedMessageType === managedMessageType);
        if(message === undefined) {
            message = this._createManagedMessage(managedMessageType);
        }
        return message;
    }

    /**
     * Factory method for managed messages
     * Creates and initializes the message + adds a callback for when the process ends
     * @param {ManagedMessageType} managedMessageType
     * @private
     */
    private _createManagedMessage(managedMessageType: ManagedMessageType): ManagedMessage {
        let managedMessage: ManagedMessage;

        switch (managedMessageType) {
            case ManagedMessageType.MAIN:
                managedMessage = new MainManagedMessage(this._clientHandle.getMainTextChannel());
                break;
            case ManagedMessageType.SONG_SELECTION:
                managedMessage = new SongSelectionManagedMessage(this._clientHandle.getMainTextChannel());
                break;
            default:
                throw new Error(`No message creation logic for type ${managedMessageType}`)
        }

        managedMessage.initialize();
        this._clientHandle.registerPreDestroyHandler(() => {
            return managedMessage.deleteMessage();
        });
        this._managedMessages.push(managedMessage);
        return managedMessage;
    }

}