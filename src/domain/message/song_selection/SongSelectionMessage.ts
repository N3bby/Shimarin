import {ManagedMessage} from "../ManagedMessage";
import {ManagedMessageType} from "../ManagedMessageType";
import {Message, MessageOptions, MessageReaction, RichEmbed, TextChannel, User} from "discord.js";
import {secondsToFormat, YoutubeSong} from "../../model/YoutubeSong";
import {SONG_SELECTION_DELETE_DELAY} from "../../../properties";
import {ClientHandle} from "../../wrapper/ClientHandle";
import {CommandOutputService} from "../../service/CommandOutputService";
import {container} from "../../../inversify/inversify.config";
import {RequestContext} from "../../model/RequestContext";
import {CommandHandlerService} from "../../service/CommandHandlerService";
import {inject, injectable} from "inversify";

@injectable()
export class SongSelectionManagedMessage extends ManagedMessage {

    @inject(CommandOutputService.name)
    private _commandOutputService: CommandOutputService;
    @inject(CommandHandlerService.name)
    private _commandHandlerService: CommandHandlerService;

    private _user: User;
    private _ytSongs: YoutubeSong[];

    private _reactionCallback: (messageReaction: MessageReaction, user: User) => void;
    private _preDestroyCallback: () => void;

    get loggerName(): string {
        return SongSelectionManagedMessage.name;
    }

    get managedMessageType(): ManagedMessageType {
        return ManagedMessageType.SONG_SELECTION;
    }

    /**
     * Initializes a new SongSelection message
     * Removes old message
     * @param {"discord.js".User} user that requested the songs
     * @param {YoutubeSong[]} list of YoutubeSongs that match the request
     */
    initialize(user?: User, ytSongs?: YoutubeSong[]): void {
        super.initialize();

        //Don't initialize if arguments are undefined
        if (user === undefined || ytSongs === undefined) {
            return;
        }
        //Limit the amount of songs
        if (ytSongs.length > 5) {
            ytSongs = ytSongs.splice(0, 5);
        }
        //Set variables
        this._user = user;
        this._ytSongs = ytSongs;

        //Register callbacks
        this._reactionCallback = this._reactionHandle.bind(this);
        this._preDestroyCallback = this.deleteMessage.bind(this);
        this._clientHandle.on("messageReactionAdd", this._reactionCallback);
        this._clientHandle.on("preDestroy", this._preDestroyCallback);

        //Make message
        this.makeMessage(SONG_SELECTION_DELETE_DELAY).then(value => {
            this._initializeReactions().catch(reason => {
                //Rejection ignored
            });
        });
    }

    handleMessage(message: Message): void {
    }

    /**
     * Returns a message with the different songs that were found and a countdown for when the message will be removed
     * @returns {{content: string; options: "discord.js".MessageOptions}}
     */
    async _buildMessage(): Promise<{ content: string, options: MessageOptions }> {
        let embed: RichEmbed = new RichEmbed();
        embed.setTitle(`${this._user.tag}, I found these songs for you`);

        let description = "";
        for (let i = 0; i < this._ytSongs.length; i++) {
            description += `\`${i + 1}.\` \`[${secondsToFormat(await this._ytSongs[i].length())}]\` ${await this._ytSongs[i].title()}\n`;
        }
        embed.setDescription(description);
        embed.setFooter(`⌛ ${Math.round(this._msUntilDeletion / 1000)}s`);

        embed.setColor("#2ecc71");

        return {content: undefined, options: {embed: embed}};
    }


    /**
     * Initializes the reactions on this message based on the amount of ytSongs (max 5)
     * @returns {Promise<void>}
     * @private
     */
    async _initializeReactions() {
        let numberIcons: string[] = ["1⃣", "2⃣", "3⃣", "4⃣", "5⃣"];
        for (let i = 0; i < this._ytSongs.length; i++) {
            await this._message.react(numberIcons[i]);
        }
        await this._message.react("❌");
    }

    /**
     * Reaction event handler
     * @param {"discord.js".MessageReaction} messageReaction
     * @param {"discord.js".User} user
     * @private
     */
    private async _reactionHandle(messageReaction: MessageReaction, user: User) {
        //Only care about reactions to this message from the requesting user
        if(this._message === undefined) return;
        if (messageReaction.message.id === this._message.id && user.id === this._user.id) {
            //Check if cancelled
            let cancelIcon: string = "❌";
            if(messageReaction.emoji.name === cancelIcon) {
                this._commandOutputService.addOutput(`${user.tag}, you cancelled the song selection`);
                this.deleteMessage();
            }
            //Check if number selected
            let numberIcons: string[] = ["1⃣", "2⃣", "3⃣", "4⃣", "5⃣"];
            let index = numberIcons.indexOf(messageReaction.emoji.name);
            if (index >= 0 && index < this._ytSongs.length) {
                let selectedSong = this._ytSongs[index];
                //Call as new command
                let requestContext = new RequestContext(user, "play", [await selectedSong.link()], new Date());
                this._commandHandlerService.handleCommand(requestContext);
                //Delete the message
                this.deleteMessage();
            }
            //Remove listener so we can garbage collect the object
            this._clientHandle.removeListener("messageReactionAdd", this._reactionCallback);
            this._clientHandle.removeListener("preDestroy", this._preDestroyCallback);
        }
    }

}