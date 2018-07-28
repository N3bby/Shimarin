import {Command} from "../Command";
import {inject, injectable} from "inversify";
import {RequestContext} from "../../domain/model/RequestContext";
import {CommandResponse, CommandResponseType} from "../CommandResponse";
import {YoutubeSearchApiWrapper} from "../../domain/wrapper/YoutubeSearchApiWrapper";
import {YoutubeSong} from "../../domain/model/YoutubeSong";
import {SongSelectionManagedMessage} from "../../domain/message/song_selection/SongSelectionMessage";
import {MusicPlayer} from "../../domain/wrapper/MusicPlayer";
import {ClientHandle} from "../../domain/wrapper/ClientHandle";
import {container} from "../../inversify/inversify.config";
import {MUSIC_REQUIRED_ROLE_ID, MUSIC_REQUIRED_ROLE_TOGGLE} from "../../properties";

@injectable()
export class PlayCommand extends Command {

    @inject(MusicPlayer.name)
    private _musicPlayer: MusicPlayer;

    @inject(ClientHandle.name)
    private _clientHandle: ClientHandle;

    private _ytSearchApiWrapper: YoutubeSearchApiWrapper = new YoutubeSearchApiWrapper();

    getLogName(): string {
        return PlayCommand.name;
    }

    get name(): string {
        return "play";
    }

    get description(): string {
        return "queues a song";
    }

    get syntax(): string {
        return "play <keyword|url>";
    }

    matches(command: string): boolean {
        return command === "play";
    }

    validate(requestContext: RequestContext): CommandResponse {
        if (requestContext.args.length < 1) {
            return new CommandResponse(CommandResponseType.ERROR, "you must give a url or keyword");
        } else {
            return new CommandResponse(CommandResponseType.SUCCESS);
        }
    }

    async authorize(requestContext: RequestContext): Promise<CommandResponse> {
        if (MUSIC_REQUIRED_ROLE_TOGGLE) {
            if (await this._clientHandle.userHasRole(requestContext.user, MUSIC_REQUIRED_ROLE_ID)) {
                return new CommandResponse(CommandResponseType.SUCCESS);
            } else {
                return new CommandResponse(CommandResponseType.UNAUTHORIZED, "you're not allowed to use this command");
            }
        } else {
            return new CommandResponse(CommandResponseType.SUCCESS);
        }
    }

    async execute(requestContext: RequestContext): Promise<CommandResponse> {
        let param = requestContext.args[0];
        if (param.startsWith("http")) {

            //Try to join voice channel if needed, if there is a problem (returns a CommandResponse), then return it
            let joinResponse: CommandResponse = await this._joinVoiceChannelIfNeeded(requestContext);
            if (joinResponse) return joinResponse;

            //Try to fetch youtube song. If a CommandResponse is returned, there was an error, so return it.
            let songResult: (CommandResponse | YoutubeSong) = await this._getYoutubeSong(param);
            if(songResult instanceof CommandResponse) return songResult;

            //Queue the song
            this._musicPlayer.queue(songResult as YoutubeSong);
            return new CommandResponse(CommandResponseType.SUCCESS, "queued your song");

        } else {
            //If parameter is a keyword, do a search for the keyword and create a selection prompt
            return await this._doKeywordSearch(requestContext);
        }
    }

    /**
     * Do a keyword search using the requestContext
     * @param {RequestContext} requestContext
     * @returns {Promise<CommandResponse>} CommandResponse if there was an error
     * @private
     */
    private async _doKeywordSearch(requestContext: RequestContext): Promise<CommandResponse> {

        //Is a keyword
        let param = requestContext.args.reduce((p1, p2) => p1 + " " + p2);
        try {
            let songs: YoutubeSong[] = await this._ytSearchApiWrapper.search(param);
            let songSelectionMessage: SongSelectionManagedMessage = container.get(SongSelectionManagedMessage.name);
            songSelectionMessage.initialize(requestContext.user, songs);
            return new CommandResponse(CommandResponseType.SUCCESS);
        } catch (e) {
            this._logger.error(e);
            return new CommandResponse(CommandResponseType.ERROR, "problem while searching for youtube videos");
        }

    }

    /**
     * Join voice channel based on requestContext (may not be needed)
     * @param {RequestContext} requestContext
     * @returns {Promise<CommandResponse>} CommandResponse if there was an error
     * @private
     */
    private async _joinVoiceChannelIfNeeded(requestContext: RequestContext): Promise<CommandResponse> {

        if (!this._musicPlayer.isConnected) {
            //User must be in a voice channel, so check that
            let voiceChannel = this._clientHandle.getUserVoiceChannel(requestContext.user);
            if (!voiceChannel) {
                return new CommandResponse(CommandResponseType.ERROR, "you must be in a voice channel");
            }
            //Join channel
            try {
                await this._musicPlayer.connect(voiceChannel);
            } catch (e) {
                this._logger.error(`on voiceChannel join ${e}`);
                return new CommandResponse(CommandResponseType.ERROR, "I couldn't join your voice channel :(");
            }
        } else {
            //If not in the same channel as the user, reconnect to new channel
            let voiceChannel = this._clientHandle.getUserVoiceChannel(requestContext.user);
            if (this._musicPlayer.voiceChannel.id !== voiceChannel.id) {
                await this._musicPlayer.connect(voiceChannel);
            }
        }

    }

    /**
     * @param {string} url
     * @returns {Promise<CommandResponse | YoutubeSong>} YoutubeSong if song was fetched correctly. CommandResponse when there is an error
     * @private
     */
    private async _getYoutubeSong(url: string): Promise<CommandResponse | YoutubeSong> {
        //Get the song
        let youtubeSong: YoutubeSong;
        try {
            youtubeSong = await this._ytSearchApiWrapper.getSongDetails(url);
            return youtubeSong;
        } catch (e) {
            this._logger.error(`on getting song info ${e}`);
            return new CommandResponse(CommandResponseType.ERROR, "there is a problem with this song");
        }
    }

}
