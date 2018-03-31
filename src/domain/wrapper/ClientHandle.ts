import {Client, Message, MessageReaction, TextChannel, User, VoiceChannel} from "discord.js";
import {DISCORD_TOKEN, MAIN_TEXT_CHANNEL} from "../../properties";
import {createLogger, Logger} from "../../logging/Logging";
import {injectable} from "inversify";

@injectable()
export class ClientHandle {

    private _logger: Logger = createLogger(ClientHandle.name);

    private _client: Client;
    private _preDestroyCallbacks: (() => void | Promise<void>)[] = [];

    /**
     * Initializes the client
     * @returns {Promise<void>} Promise that resolves when the client logs in
     */
    initialize(): Promise<string> {
        this._initProcessEndCallbacks();
        this._client = new Client();
        return this._client.login(DISCORD_TOKEN);
    }

    /**
     * Initializes process end callbacks
     * @private
     */
    private _initProcessEndCallbacks(): void {

        let cleanupFunc = async (code: any) => {
            for (let preDestroyCallback of this._preDestroyCallbacks) {
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
     * Registers a message handler to the client
     * @param callback
     */
    registerMessageHandler(callback: (message: Message) => void) {
        this._client.on("message", callback);
    }

    /**
     * Registers a handler that is called before a destroy
     * Can be asynchronous
     * @param {() => (void | Promise<void>)} callback
     */
    registerPreDestroyHandler(callback: () => void | Promise<void>) {
        this._preDestroyCallbacks.push(callback);
    }

    /**
     * Registers a reaction handler
     * @param {(messageReaction: "discord.js".MessageReaction, user: "discord.js".User) => void} callback
     */
    regiserReactHandler(callback: (messageReaction: MessageReaction, user: User) => void) {
        this._client.on("messageReactionAdd", callback);
    }

}