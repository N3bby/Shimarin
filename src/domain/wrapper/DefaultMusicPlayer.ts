import {injectable} from "inversify";
import {MusicPlayer} from "./MusicPlayer";
import {YoutubeSong} from "../model/YoutubeSong";
import {createLogger, Logger} from "../../logging/Logging";

@injectable()
export class DefaultMusicPlayer extends MusicPlayer {

    private _logger: Logger = createLogger(DefaultMusicPlayer.name);
    private _queue: YoutubeSong[] = [];

    constructor() {
        super();
    }

    getQueue(): YoutubeSong[] {
        //Returns a copy
        return this._queue.slice();
    }

    queue(song: YoutubeSong): void {
        this._queue.push(song);
        if (!this.isActive) {
            this.next();
        } else {
            this.emit("update");
        }
    }

    next(): void {
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
        this._streamDispatcher = this._playStream(this._currentSong);
        this._streamDispatcherIsPlaying = true;
        this._streamDispatcher.on("end", reason => {
            this._cleanStreamDispatcher();
            if(reason !== "forced") this.next();
        });
        this._streamDispatcher.on("error", err => {
            this._logger.error(`while streaming audio '${err}'`);
            this._cleanStreamDispatcher();
            this.next();
        });

        this.isActive = true;
        this.emit("update")
    }

    stop(): void {
        this._queue = [];
        if(this._streamDispatcherIsPlaying) {
            this._streamDispatcher.end("forced");
        }
        this.isActive = false;
    }

}