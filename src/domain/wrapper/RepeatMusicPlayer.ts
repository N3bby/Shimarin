import {MusicPlayer} from "./MusicPlayer";
import {YoutubeSong} from "../model/YoutubeSong";
import {createLogger, Logger} from "../../logging/Logging";

/**
 * Music player that repeats a single song
 * Can change song, (re-)start or stop
 */
export class RepeatMusicPlayer extends MusicPlayer {

    private _logger: Logger = createLogger(RepeatMusicPlayer.name);

    /**
     * Changes the song that the MusicPlayer is repeating
     * @param {YoutubeSong} song
     */
    queue(song: YoutubeSong): void {
        this._currentSong = song;
        this.next();
    }

    /**
     * Unsupported method for RepeatMusicPlayer. Will throw an error
     * @param {Array<YoutubeSong>} songList
     */
    queueList(songList: Array<YoutubeSong>): void {
        throw new Error("Unsupported method. RepeatMusicPlayer cannot queue a list of songs (since it's supposed to repeat 1 song over and over");
    }

    /**
     * (Re-)starts the repeating song
     */
    async next(): Promise<void> {
        //End current song
        if(this._streamDispatcherIsPlaying) {
            this._streamDispatcher.end();
        }

        //Play currentSong
        this._streamDispatcher = await this._playStream(this._currentSong);
        this._streamDispatcherIsPlaying = true;
        this._streamDispatcher.on("end", reason => {
            this._cleanStreamDispatcher();
            this.next();
        });
        this._streamDispatcher.on("error", err => {
            this._logger.error(`while streaming audio '${err}'`);
            this._cleanStreamDispatcher();
            this.next();
        });

        this.isActive = true;
        this.emit("update");
    }

    /**
     * Stops playing
     */
    stop(): void {
        if(this._streamDispatcherIsPlaying) {
            this._streamDispatcher.end();
        }
        this.isActive = false;
    }

}