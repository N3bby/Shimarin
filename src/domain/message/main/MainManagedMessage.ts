import {ManagedMessage} from "../ManagedMessage";
import {Emoji, Message, MessageOptions, MessageReaction, RichEmbed, TextChannel, User} from "discord.js";
import {BOTTOM_MESSAGE_CONVERSATION_WAIT_DELAY, VOLUME_STEP} from "../../../properties";
import {ManagedMessageType} from "../ManagedMessageType";
import {inject, injectable} from "inversify";
import {ClientHandle} from "../../wrapper/ClientHandle";
import Timer = NodeJS.Timer;
import {createLogger, Logger} from "../../../logging/Logging";
import {CommandOutputService} from "../../service/CommandOutputService";
import {container} from "../../../inversify/inversify.config";
import {MusicPlayer} from "../../wrapper/MusicPlayer";
import {secondsToFormat, YoutubeSong} from "../../model/YoutubeSong";
import {DefaultMusicPlayer} from "../../wrapper/DefaultMusicPlayer";
import {RequestContext} from "../../model/RequestContext";
import {CommandHandlerService} from "../../service/CommandHandlerService";

/**
 * TODO Add current song/queue information + media buttons
 */
@injectable()
export class MainManagedMessage extends ManagedMessage {

    @inject(CommandOutputService.name)
    private _commandOutputService: CommandOutputService;
    @inject(MusicPlayer.name)
    private _musicPlayer: MusicPlayer;
    @inject(CommandHandlerService.name)
    private _commandHandlerService: CommandHandlerService;

    private _timeoutRef: Timer;

    get loggerName(): string {
        return MainManagedMessage.name;
    }

    get managedMessageType(): ManagedMessageType {
        return ManagedMessageType.MAIN;
    }

    initialize(): void {
        super.initialize();

        //Command output status changes
        this._commandOutputService.addOutputChangedListener(this.updateMessage.bind(this));

        //Message updates when music status changes
        this._musicPlayer.on("update", this.updateMessage.bind(this));
        this._musicPlayer.on("stop", this.remakeMessage.bind(this));

        //Reaction handler
        this._clientHandle.on("messageReactionAdd", this._reactionHandler.bind(this));
        this._clientHandle.on("preDestroy", this.deleteMessage.bind(this));

        this.makeMessage();
    }

    /**
     * When receiving a message, move to bottom after a specified delay
     * Clear other timers if there are any
     * @param {"discord.js".Message} message
     */
    handleMessage(message: Message): void {
        //Ignore messages in other channels
        if (message.channel.id !== this._channel.id) return;
        if (this._timeoutRef !== undefined) {
            clearTimeout(this._timeoutRef);
        }
        this._timeoutRef = setTimeout(async () => {
            await this.remakeMessage(0);
            this._logger.debug("Remade message so it's at the bottom");
        }, BOTTOM_MESSAGE_CONVERSATION_WAIT_DELAY);
    }

    protected async _buildMessage(): Promise<{ content: string, options: MessageOptions }> {
        let content: string = "";
        let options: MessageOptions = {embed: null};

        content = this._commandOutputService.output.reduce((previousValue, currentValue) => previousValue + "\n" + currentValue, "");
        content += "\n**Enter a command to make me do something~**";

        if (this._musicPlayer.isActive) {
            if (this._musicPlayer instanceof DefaultMusicPlayer) {
                options.embed = await this._buildMusicEmbedForDefault();
            } else {
                throw Error("No implementation for current MusicPlayer");
            }
        }

        return {content: content, options: options};
    }

    private async _buildMusicEmbedForDefault(): Promise<RichEmbed> {

        let embed: RichEmbed = new RichEmbed();

        //Currently playing
        let time: string = `[${secondsToFormat(this._musicPlayer.currentTime)}/${secondsToFormat(await this._musicPlayer.currentSong.length())}]`;
        embed.addField("Currently playing", `${await this._musicPlayer.currentSong.title()}\n${await this._buildTimeIndicator()} ${time} 🔊 ${(this._musicPlayer.volume * 100).toPrecision(3)}%`);

        //In queue
        let queue: YoutubeSong[] = (this._musicPlayer as DefaultMusicPlayer).getQueue();
        if (queue.length > 0) {
            //Format first two songs in queue
            let firstTwoSongs: YoutubeSong[] = queue.slice(0, 2);
            let queueStr: string = await Promise.all(firstTwoSongs.map(async (value, index) => `\`${index + 1}.\` \`[${secondsToFormat(await value.length())}]\` **${await value.title()}**`))
                .then(value => value.reduce((s1, s2) => s1 + "\n" + s2));
            embed.addField("Queued", queueStr);
            //If there are more, show an indicator how many extra songs in queue
            if (queue.length > 2) {
                embed.setFooter(`(+${queue.length - 2} more)`);
            }
        }

        embed.setColor("#2ecc71");

        return embed;

    }

    private async _buildTimeIndicator(): Promise<string> {

        let time = this._musicPlayer.currentTime;
        let maxTime = await this._musicPlayer.currentSong.length();
        let t: number = time / maxTime;
        if (t > 1) t = 1;
        if (t < 0) t = 0;

        let line: string = "▬▬▬▬▬▬▬▬▬▬▬▬";
        let seeker: string = "🔘";
        let replaceIndex: number = Math.round(t * (line.length - 1));

        return line.substr(0, replaceIndex) + seeker + line.substr(replaceIndex + 1);

    }


    async makeMessage(deleteAfter?: number): Promise<void> {
        await super.makeMessage(deleteAfter);
        await this._initializeReactions();
    }

    async updateMessage(): Promise<void> {
        await super.updateMessage();
        await this._initializeReactions();
    }

    private async _initializeReactions() {
        let initReactionIfNeeded: (reaction: string) => void = async (reaction: string) => {
            let existingReaction: MessageReaction = this._message.reactions.find(value => value.emoji.name === reaction);
            if (existingReaction === null) {
                await this._message.react(reaction);
            }
        };
        if (this._musicPlayer.isActive) {
            try {
                await initReactionIfNeeded("⏹");
                await initReactionIfNeeded("⏩");
                await initReactionIfNeeded("🔉");
                await initReactionIfNeeded("🔊");
            } catch (e) {
                this._logger.error(`On initialize reactions: '${e}'`)
            }
        }
    }

    private _reactionHandler(messageReaction: MessageReaction, user: User) {
        //Only care about reactions on our own message that are not our own reactions
        if (this._message === undefined) return;
        if (messageReaction.message.id === this._message.id && user.id !== this._clientHandle.getActiveUser().id) {
            //Music reactions
            if (this._musicPlayer.isActive) {
                let command: string;
                let args: string[] = [];
                switch (messageReaction.emoji.name) {
                    case "⏹":
                        command = "stop";
                        break; //Message will be re-created so no need to remove reaction
                    case "⏩":
                        command = "skip";
                        break;
                    case "🔉":
                        command = "volume";
                        args.push(((this._musicPlayer.volume - VOLUME_STEP) * 100).toString());
                        break;
                    case "🔊":
                        command = "volume";
                        args.push(((this._musicPlayer.volume + VOLUME_STEP) * 100).toString());
                        break;
                }
                this._commandHandlerService.handleCommand(new RequestContext(user, command, args, new Date()));
            }
            //Remove user reaction so it can be re-used
            messageReaction.remove(user).catch(reason => {
                this._logger.error(`On messageReaction remove : '${reason}'`);
            });
        }
    }

}
