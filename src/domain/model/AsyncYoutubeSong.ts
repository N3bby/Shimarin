import {YoutubeSong} from "./YoutubeSong";
import {YoutubeSearchApiWrapper} from "../wrapper/YoutubeSearchApiWrapper";

export class AsyncYoutubeSong extends YoutubeSong {

    private _ytSearchApiWrapper: YoutubeSearchApiWrapper = new YoutubeSearchApiWrapper();
    private _fetched: boolean = false;

    constructor(link: string) {
        super(undefined, undefined, link);
    }

    async title(): Promise<string> {
        await this._fetchDataIfNeeded();
        return this._title;
    }

    async length(): Promise<number> {
        await this._fetchDataIfNeeded();
        return this._length;
    }

    async link(): Promise<string> {
        await this._fetchDataIfNeeded();
        return this._link;
    }

    private async _fetchDataIfNeeded(): Promise<void> {
        if (!this._fetched) {
            await this._ytSearchApiWrapper.getSongDetails(this._link).then(async value => {
                this._title = await value.title();
                this._length = await value.length();
            }).catch(reason => {
                this._title = "Unavailable";
                this._length = 0;
            });
            this._fetched = true;
        }
    }

}