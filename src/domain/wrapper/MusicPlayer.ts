import {StreamDispatcher, VoiceChannel, VoiceConnection} from "discord.js";
import {createLogger, Logger} from "../../logging/Logging";
import {YoutubeSong} from "../model/YoutubeSong";
import Timer = NodeJS.Timer;
import {injectable} from "inversify";
import {MUSIC_END_LEAVE_DELAY, VOICE_CONNECTION_PASSES} from "../../properties";
const ytdl = require('ytdl-core');

/**
 * Wrapper for queue/stream/voice related logic
 * TODO Rewrite this mess maybe
 */
@injectable()
export class MusicPlayer {

    private _logger: Logger = createLogger(MusicPlayer.name);

    private _voiceConnection: VoiceConnection;
    private _streamDispatcher: StreamDispatcher;

    private _currentSong: YoutubeSong;
    private _queue: YoutubeSong[] = [];
    private _isPlaying: boolean = false;
    private _volume: number = 0.1;

    private _updateInterval: Timer;

    private _voiceChannelLeaveTimer: Timer;

    get volume(): number {
        return this._volume;
    }

    set volume(value: number) {
        //Constrain between 0 and 1
        if(value < 0) value = 0;
        if(value > 1) value = 1;
        this._volume = value;
        //Also set streamDispatcher value if a song is currently playing
        if(this._streamDispatcher !== undefined) {
            this._streamDispatcher.setVolumeLogarithmic(value);
        }
    }

    /**
     * Move changed to isPlaying through this property setter so that the update timer (for stream timeline) can be updated
     * correctly
     * @param {boolean} value
     */
    private set isPlaying(value: boolean) {
        if(!value) {
            //Stop update interval
            clearInterval(this._updateInterval);
        } else {
            //Start update interval
            this._updateInterval = setInterval(() => {
                this._fireStatusChangedEvent()
            }, 5000);
        }
        this._isPlaying = value;
    }

    //Named differently because typescript doesn't allow getter/setter different visibilities...
    public get playing(): boolean {
        return this._isPlaying;
    }

    get isConnected(): boolean {
        return this._voiceConnection !== undefined &&
            (this._voiceConnection.status === 0 || //READY
                this._voiceConnection.status === 3); //IDLE
    }

    get voiceChannel(): VoiceChannel {
        if(this._voiceConnection !== undefined) {
            return this._voiceConnection.channel;
        }
        return undefined;
    }

    get currentSong(): YoutubeSong {
        return this._currentSong;
    }

    get currentTime(): number {
        if(this._streamDispatcher !== undefined) {
            return this._streamDispatcher.time/1000;
        }
        return 0;
    }

    /**
     * Connects to a given voice channel. Returns a promise that resolves when done
     * @param {"discord.js".VoiceChannel} channel
     * @returns {Promise<void>}
     */
    connect(channel: VoiceChannel): Promise<void> {
        clearTimeout(this._voiceChannelLeaveTimer);
        return channel.join().then(value => {
            this._voiceConnection = value;
        });
    }

    /**
     * Queues a song and starts playing if nothing is currently playing
     * @param {YoutubeSong} youtubeSong
     */
    queue(youtubeSong: YoutubeSong) {
        clearTimeout(this._voiceChannelLeaveTimer);
        //Push song into queue
        this._queue.push(youtubeSong);
        //Start playing if nothing is playing atm
        if(!this._isPlaying) {
            this.next();
        } else {
            this._fireStatusChangedEvent()
        }
    }

    /**
     * Stops current song (if any)
     * Starts playing next song in queue (and removes it from the queue)
     * Also registers handlers so subsequent queued items will play automatically
     */
    next() {
        //Destroy current streamDispatcher (if it exists)
        if(this._isPlaying) {
            this._streamDispatcher.stream.destroy();
            this._streamDispatcher.end("forced");
        }

        //Fetch song, return if queue is empty
        this._currentSong = this._queue.shift();
        if(this._currentSong === undefined) {
            this._clean();
            this._fireQueueEndedEvent();
            return;
        }

        //Get stream (ytdl) and play it
        let stream = ytdl(this._currentSong.link, {filter: "audioonly", quality: "highestaudio"});
        this._streamDispatcher = this._voiceConnection.playStream(stream, {seek: 0, passes: VOICE_CONNECTION_PASSES});
        this._streamDispatcher.setVolumeLogarithmic(this._volume);

        //Register events
        this._streamDispatcher.on("end", reason => {
            this._clean();
            //Prevents automatically advancing queue when we want to end the streamDispatcher manually
            if(reason === "forced") return;
            this.next();
        });
        this._streamDispatcher.on("error", err => {
            this._clean();
            this._logger.error(`on stream '${err}'`);
        });

        //Set playing to true
        this.isPlaying = true;
        this._fireStatusChangedEvent();
    }

    /**
     * Clears queue and stops current song
     */
    stop() {
        //Clear queue
        this._queue = [];
        //Stop running stream
        if(this._isPlaying) {
            this._streamDispatcher.stream.destroy();
            this._streamDispatcher.end("forced");
        }
        this._fireQueueEndedEvent();
    }

    private _clean() {
        this.isPlaying = false;
        this._currentSong = undefined;
        this._streamDispatcher = undefined;
    }

    /**
     * Returns a copy of the queue
     * @returns {YoutubeSong[]}
     */
    getQueue(): YoutubeSong[] {
        return this._queue.slice();
    }

    //Events --------------------------------------------------

    private _statusChangedCallbacks: (() => void)[] = [];

    registerStatusChangedHandler(callback: () => void) {
        this._statusChangedCallbacks.push(callback);
    }

    private _fireStatusChangedEvent() {
        for (let callback of this._statusChangedCallbacks) {
            callback();
        }
    }

    private _queueEndedCallbacks: (() => void)[] = [];

    registerQueueEndedHandler(callback: () => void) {
        this._queueEndedCallbacks.push(callback);
    }

    private _fireQueueEndedEvent() {
        this._voiceChannelLeaveTimer = setTimeout(() => {
            this._voiceConnection.disconnect();
            this._voiceConnection = undefined;
        }, MUSIC_END_LEAVE_DELAY);
        for(let callback of this._queueEndedCallbacks) {
            callback();
        }
    }

}
