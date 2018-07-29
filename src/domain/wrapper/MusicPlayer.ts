import {StreamDispatcher, VoiceChannel, VoiceConnection} from "discord.js";
import {YoutubeSong} from "../model/YoutubeSong";
import {inject, injectable} from "inversify";
import * as events from "events";
import {ClientHandle} from "./ClientHandle";
import Timer = NodeJS.Timer;
import {MUSIC_EMBED_UPDATE_INTERVAL, MUSIC_END_LEAVE_DELAY, VOICE_CONNECTION_PASSES} from "../../properties";
import {CommandOutputService} from "../service/CommandOutputService";
import {createLogger, Logger} from "../../logging/Logging";
import {error} from "util";

const ytdl = require('ytdl-core');

export declare interface MusicPlayer {

    on(event: "start", listener: () => void): this;

    on(event: "update", listener: () => void): this;

    on(event: "stop", listener: () => void): this;

}

/**
 * Abstract MusicPlayer class
 * Handlers some management logic (sending events (partially), timeouts, intervals and recurring discord.js calls)
 */
@injectable()
export abstract class MusicPlayer extends events.EventEmitter {

    private _baseLogger: Logger = createLogger(MusicPlayer.name);

    @inject(ClientHandle.name)
    protected _clientHandle: ClientHandle;

    @inject(CommandOutputService.name)
    protected _commandOutputService: CommandOutputService;

    /**
     * The voiceConnection that is currently in use
     */
    protected _voiceConnection: VoiceConnection;

    /**
     * The streamDispatcher that is currently in use
     */
    protected _streamDispatcher: StreamDispatcher;

    /**
     * If the streamDispatcher is currently playing a song
     * Needs to be set manually because as far as I know there's no way to know this...
     */
    protected _streamDispatcherIsPlaying: boolean = false;

    /**
     * The song that is currently playing
     */
    protected _currentSong: YoutubeSong;

    private _volume: number = 0.1;
    private _isActive: boolean = false;

    private _updateInterval: Timer;
    private _voiceChannelLeaveTimer: Timer;

    protected constructor() {
        super();
        this._registerEventHandlers();
    }

    /**
     * Gets the volume
     * @returns {number}
     */
    get volume(): number {
        return this._volume;
    }

    /**
     * Sets the volume
     * @param {number} value
     */
    set volume(value: number) {
        if (value < 0) value = 0;
        if (value > 1) value = 1;
        this._volume = value;
        if (this._streamDispatcher)
            this._streamDispatcher.setVolumeLogarithmic(value);
    }

    /**
     * Gets whether the musicPlayer is active
     * @returns {boolean}
     */
    get isActive(): boolean {
        return this._isActive;
    }

    /**
     * Sets whether the musicPlayer is active (also fires off events)
     * Do not edit this value from outside.
     * Can't make getters and setters for properties have different visibilities in typescript ¯\_(ツ)_/¯
     * @param {boolean} value
     */
    set isActive(value: boolean) {
        if (value && !this._isActive) {
            this.emit("start");
        } else if (!value && this._isActive) {
            this.emit("stop");
        }
        this._isActive = value;
    }

    /**
     * Checks whether the musicPlayer is connected to a voiceChannel
     * @returns {boolean}
     */
    get isConnected(): boolean {
        if (this._voiceConnection) {
            //0 = READY | 3 = IDLE
            return this._voiceConnection.status === 0 || this._voiceConnection.status === 3;
        }
    }

    /**
     * Gets the voiceChannel that the musicPlayer is connected to
     * @returns {"discord.js".VoiceChannel}
     */
    get voiceChannel(): VoiceChannel {
        return this._voiceConnection ? this._voiceConnection.channel : undefined;
    }

    /**
     * Gets the current song that the musicPlayer is playing
     * @returns {YoutubeSong}
     */
    get currentSong(): YoutubeSong {
        return this._currentSong;
    }

    /**
     * Gets the current time of the song (in seconds)
     * @returns {number}
     */
    get currentTime(): number {
        return this._streamDispatcher ? this._streamDispatcher.time / 1000 : 0;
    }

    /**
     * Connects the musicPlayer to a given voiceChannel
     * @param {"discord.js".VoiceChannel} channel
     * @returns {Promise<void>}
     */
    connect(channel: VoiceChannel): Promise<void> {
        clearTimeout(this._voiceChannelLeaveTimer);
        if (this._voiceConnection) {
            this._voiceConnection.disconnect();
            this._voiceConnection = undefined;
        }
        return channel.join().then(value => {
            this._voiceConnection = value;
        })
    }

    /**
     * Queue a song
     * @param {YoutubeSong} song
     */
    abstract queue(song: YoutubeSong): void;

    /**
     * Queues a list of songs. Use this when wanting to queue a lot of things at once (e.g. a playlist) to prevent event spam.
     * @param {Array<YoutubeSong>} songList
     */
    abstract queueList(songList: Array<YoutubeSong>): void;

    /**
     * Advance to the next song
     */
    abstract async next(): Promise<void>;

    /**
     * Stop playing songs
     */
    abstract stop(): void;

    /**
     * Creates a new streamDispatcher in which the given song starts playing
     * Returns the created streamDispatcher
     * @param {YoutubeSong} song
     * @returns {"discord.js".StreamDispatcher}
     * @private
     */
    protected async _playStream(song: YoutubeSong): Promise<StreamDispatcher> {
        let stream: any;
        try {
            stream = ytdl(await song.link(), {filter: "audioonly"});
        } catch (e) {
            let errorMessage: string = `Problem getting stream for song '${await song.title()}': '${e}'`;
            this._baseLogger.error(errorMessage);
            this._commandOutputService.addOutput(errorMessage);
            return;
        }
        let streamDispatcher = this._voiceConnection.playStream(stream, {seek: 0, passes: VOICE_CONNECTION_PASSES});
        stream.on("error", async (err: any) => {
            let errorMesssage: string = `Problem with stream '${await song.title()}': '${err}'`;
            this._baseLogger.error(errorMesssage);
            this._commandOutputService.addOutput(errorMesssage);
        });
        streamDispatcher.on("error", async err => {
            let errorMesssage: string = `Problem with streamDispatcher'${await song.title()}': '${err}'`;
            this._baseLogger.error(errorMesssage);
            this._commandOutputService.addOutput(errorMesssage);
        });
        streamDispatcher.setVolumeLogarithmic(this._volume);
        return streamDispatcher;
    }

    /**
     * Cleans values of the streamDispatcher
     * @private
     */
    protected _cleanStreamDispatcher() {
        this._streamDispatcherIsPlaying = false;
        this._streamDispatcher = undefined;
    }

    /**
     * Registers default handlers for MusicPlayer events
     * @private
     */
    private _registerEventHandlers() {
        this.on("start", () => {
            //Stop leave timeout
            clearTimeout(this._voiceChannelLeaveTimer);
            this._voiceChannelLeaveTimer = undefined;

            //Start sending updates
            if (!this._updateInterval) {
                this._updateInterval = setInterval(() => {
                    this.emit("update");
                }, MUSIC_EMBED_UPDATE_INTERVAL);
            }
        });

        this.on("stop", () => {
            //Leave voiceChannel in MUSIC_END_LEAVE_DELAY milliseconds
            if(!this._voiceChannelLeaveTimer) {
                this._voiceChannelLeaveTimer = setTimeout(() => {
                    this._voiceConnection.disconnect();
                    this._voiceConnection = undefined;
                }, MUSIC_END_LEAVE_DELAY);
            }

            //Stop sending updates
            clearTimeout(this._updateInterval);
            this._updateInterval = undefined;
        });
    }

}