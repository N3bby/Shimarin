import {
    Channel,
    ChannelLogsQueryOptions,
    Client, Collection,
    Message,
    MessageReaction,
    Snowflake,
    TextChannel,
    User,
    VoiceChannel
} from "discord.js";
import {DISCORD_TOKEN, MAIN_TEXT_CHANNEL} from "../../properties";
import {createLogger, Logger} from "../../logging/Logging";
import {injectable} from "inversify";
import * as events from "events";

export declare interface ClientHandle {

    on(event: 'message', listener: (message: Message) => void): this;
    on(event: 'preDestroy', listener: () => void): this;
    on(event: 'messageReactionAdd', listener: (messageReaction: MessageReaction, user: User) => void): this;

}

@injectable()
export class ClientHandle extends events.EventEmitter {

    private _logger: Logger = createLogger(ClientHandle.name);
    private _client: Client;

    /**
     * Initializes the client
     * @returns {Promise<void>} Promise that resolves when the client logs in
     */
    initialize(): Promise<string> {
        this._initProcessEndCallbacks();
        this._client = new Client();
        this._registerEventDelegates();
        return this._client.login(DISCORD_TOKEN);
    }

    /**
     * Initializes process end callbacks
     * @private
     */
    private _initProcessEndCallbacks(): void {

        let cleanupFunc = async (code: any) => {
            for (let preDestroyCallback of this.listeners("preDestroy")) {
                await preDestroyCallback();
            }
            await this._client.destroy();
            this._logger.info("Destroyed client");
            process.exit(code);
        };

        //Taken from:
        //https://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits
        process.once("exit", cleanupFunc);
        process.once("SIGINT", cleanupFunc);
        process.once("SIGTERM", cleanupFunc);
        process.once("unhandledRejection", (async (reason, promise) => {
            console.log("Unhandled promise rejection at: Promise", promise, "reason:", reason);
            await cleanupFunc(0);
        }));
        process.once("uncaughtException", async error => {
            console.log(error.stack);
            await cleanupFunc(0);
        });

    }

    getActiveUser(): User {
        return this._client.user;
    }

    /**
     * Gets the main TextChannel
     * @returns {"discord.js".TextChannel}
     */
    getMainTextChannel(): TextChannel {
        let channel = this._client.channels.find(channel =>
            channel.type === "text" && channel.id === MAIN_TEXT_CHANNEL
        ) as TextChannel;
        if (channel === undefined) this._logger.error(`No TextChannel found with id ${MAIN_TEXT_CHANNEL}`);
        return channel;
    }

    /**
     * Gets the voice channel of the given user (if he/she is in one, otherwise gives undefined)
     * @param {"discord.js".User} user
     * @returns {"discord.js".VoiceChannel}
     */
    getUserVoiceChannel(user: User): VoiceChannel {
        return this._client.channels.find(channel => {
            //Check if channel is a voice channel
            if(channel.type === "voice") {
                let voiceChannel = channel as VoiceChannel;
                //Check if user is in it, if both are true, this is the channel we're looking for
                return voiceChannel.members.find(member => member.id === user.id) !== null;
            }
        }) as VoiceChannel;
    }

    /**
     * Gets a user by it's id, returns 'undefined' if not found
     * @param {"discord.js".Snowflake} id
     * @returns {"discord.js".User}
     */
    getUserById(id: Snowflake): User {
        return this._client.users.get(id);
    }

    /**
     * Gets a TextChannel by it's id. If the channel id does not exist or it is not a text channel, returns undefined
     * @param {"discord.js".Snowflake} id
     * @returns {"discord.js".TextChannel}
     */
    getTextChannelById(id: Snowflake): TextChannel {
        let channel: Channel = this._client.channels.get(id);
        if(channel.type === "text") {
            return channel as TextChannel
        } else {
            return undefined;
        }
    }

    /**
     * Gets the last n messages in a TextChannel
     * @param {"discord.js".TextChannel} channel
     * @param {number} amount
     * @returns {Promise<"discord.js".Message[]>}
     * @private
     */
    async getLastNMessages(channel: TextChannel, amount: number): Promise<Message[]> {

        let clamp: (value: number, min: number, max: number) => number = (value: number, min: number, max: number) => {
            if(value < min) return min;
            if(value > max) return max;
            return value;
        };

        let result: Message[] = [];
        let before: Snowflake = undefined;

        while (amount > 0) {
            //Get messages
            let options: ChannelLogsQueryOptions = {limit: clamp(amount, 0, 100), before: before};
            let messages: Collection<Snowflake, Message> = await channel.fetchMessages(options);

            //Add to result
            result = result.concat(messages.array());

            //If we can't fetch more messages (end of chat log), stop
            if(messages.size < clamp(amount, 0, 100)) {
                break;
            }

            //Decrement amount we still need to do and set before id to oldest message we got
            amount -= messages.size;
            before = messages.array()[messages.size - 1].id;
        }

        return result;

    }

    private _registerEventDelegates() {
        this._client.on("message", message => this.emit("message", message));
        this._client.on("preDestroy", () => this.emit("preDestroy"));
        this._client.on("messageReactionAdd", (messageReaction, user) => this.emit("messageReactionAdd", messageReaction, user));
    }

}