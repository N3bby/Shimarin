import {injectable} from "inversify";
import {MusicPlayer} from "./MusicPlayer";
import {YoutubeSong} from "../model/YoutubeSong";
import {createLogger, Logger} from "../../logging/Logging";

/**
 * MusicPlayer that works with a queue
 * Can add to the queue, advance to the next song or stop playing (and clear the queue)
 */
@injectable()
export class DefaultMusicPlayer extends MusicPlayer {

    private _logger: Logger = createLogger(DefaultMusicPlayer.name);
    private _queue: YoutubeSong[] = [];

    constructor() {
        super();
    }

    /**
     * Get a copy of the queue
     * @returns {YoutubeSong[]}
     */
    getQueue(): YoutubeSong[] {
        //Returns a copy
        return this._queue.slice();
    }

    /**
     * Queue a song, starts playing if nothing is currently playing
     * @param {YoutubeSong} song
     */
    queue(song: YoutubeSong): void {
        this._queue.push(song);
        if (!this.isActive) {
            this.next();
        } else {
            this.emit("update");
        }
    }

    /**
     * Queue a list of songs, starts playing if nothing is currently playing
     * @param {Array<YoutubeSong>} songList
     */
    queueList(songList: Array<YoutubeSong>): void {
        songList.forEach(song => this._queue.push(song));
        if (!this.isActive) {
            this.next();
        } else {
            this.emit("update");
        }
    }

    /**
     * Advance to the next song in the queue. Will stop if no more songs are available
     */
    async next(): Promise<void> {
        //Stop playing current song
        if (this._streamDispatcherIsPlaying) {
            this._streamDispatcher.end("forced");
        }

        //Get next song, stop playing if no more songs in the queue
        this._currentSong = this._queue.shift();
        if (!this._currentSong) {
            this.stop();
            return;
        }

        //Start new song and register event handlers
        this._streamDispatcher = await this._playStream(this._currentSong);
        this._streamDispatcherIsPlaying = true;
        this._streamDispatcher.on("end", reason => {
            this._cleanStreamDispatcher();
            if(reason !== "forced") this.next();
        });
        this._streamDispatcher.on("error", err => {
            this._cleanStreamDispatcher();
            this.next();
        });

        this.isActive = true;
        this.emit("update")
    }

    /**
     * Clears the queue and stops playing the current song
     */
    stop(): void {
        this._queue = [];
        if(this._streamDispatcherIsPlaying) {
            this._streamDispatcher.end("forced");
        }
        this.isActive = false;
    }

}