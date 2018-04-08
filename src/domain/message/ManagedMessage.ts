import {Message, MessageOptions, TextChannel} from "discord.js";
import {createLogger, Logger} from "../../logging/Logging";
import {MESSAGE_DELETE_INTERVAL} from "../../properties";
import {ManagedMessageType} from "./ManagedMessageType";
import Timer = NodeJS.Timer;
import {inject, injectable} from "inversify";
import {ClientHandle} from "../wrapper/ClientHandle";

/**
 * Represents a message that can only have a single instance with some added functionality
 */
@injectable()
export abstract class ManagedMessage {

    @inject(ClientHandle.name)
    protected _clientHandle: ClientHandle;

    protected _logger: Logger = createLogger(this.loggerName);

    protected _message: Message;
    protected _channel: TextChannel;

    private _deletionTimer: number;
    protected _msUntilDeletion: number;

    abstract get loggerName(): string;

    abstract get managedMessageType(): ManagedMessageType;

    get message(): Message {
        return this._message;
    }

    /**
     * Initialization method
     */
    initialize(): void {
        this._channel = this._clientHandle.getMainTextChannel();
    }

    /**
     * Called when a message arrives. We can use this to make sure we're always the last one for example
     * @param {"discord.js".Message} message
     */
    abstract handleMessage(message: Message): void;

    /**
     * Builds the message
     * @returns {{content: string; options: "discord.js".MessageOptions}}
     */
    protected abstract _buildMessage(): { content: string, options: MessageOptions };

    /**
     * Makes the message with a delay after which it is deleted
     * @param {number} deleteAfter <= 0 for never (in ms)
     * @returns {Promise<void>}
     */
    async makeMessage(deleteAfter?: number) {
        //Register setTimeout to delete message if needed
        if(deleteAfter === undefined) deleteAfter = 0;
        if(deleteAfter > 0) {
            this._msUntilDeletion = deleteAfter;
            this._deletionTimer = setTimeout(this.delayedDeletionCallback.bind(this), deleteAfter >= MESSAGE_DELETE_INTERVAL ? MESSAGE_DELETE_INTERVAL : deleteAfter);
        }
        //Create the message
        let data = this._buildMessage();
        let message = await this._channel.send(data.content, data.options).then(message => {
            this._message = message as Message;
        }).catch(reason => {
            this._logger.error(`on send '${reason}'`);
        });
    }

    /**
     * Callback for setTimeout that deletes the message if the timer has run out,
     * otherwise makes a new setTimeout for checking again later
     */
    protected delayedDeletionCallback() {
        this._msUntilDeletion -= MESSAGE_DELETE_INTERVAL;
        if(this._msUntilDeletion <= 0) {
            this.deleteMessage();
        } else {
            this.updateMessage();
            this._deletionTimer = setTimeout(this.delayedDeletionCallback.bind(this), this._msUntilDeletion >= MESSAGE_DELETE_INTERVAL ? MESSAGE_DELETE_INTERVAL : this._msUntilDeletion);
        }
    }

    /**
     * Deletes the message
     * @returns {Promise<void>}
     */
    async deleteMessage() {
        clearTimeout(this._deletionTimer);
        if (this._message !== undefined) {
            await this._message.delete().catch(reason => {
                this._logger.error(`on delete '${reason}'`);
            });
            this._message = undefined;
        }
    }

    /**
     * Updates the message
     * @returns {Promise<void>}
     */
    async updateMessage() {
        if (this._message !== undefined) {
            let messageContent = this._buildMessage();
            await this._message.edit(messageContent.content, messageContent.options).catch(reason => {
                this._logger.error(`on update '${reason}'`);
            });
        }
    }

    /**
     * Remakes the message with a delay after which it is deleted
     * @param {number} deleteAfter <= 0 for never (in ms)
     * @returns {Promise<void>}
     */
    async remakeMessage(deleteAfter?: number) {
        await this.deleteMessage();
        await this.makeMessage(deleteAfter)
    }

}