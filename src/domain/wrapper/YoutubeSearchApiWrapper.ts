import * as youtubeSearch from "youtube-search";
import {YOUTUBE_DATA_API_KEY} from "../../properties";
import {YoutubeSong} from "../model/YoutubeSong";
import {YouTubeSearchResults} from "youtube-search";

const ytdl = require("ytdl-core");
const ypi = require("youtube-playlist-info");

/**
 * Wrapper for the youtube search api (and playlist-info)
 */
export class YoutubeSearchApiWrapper {

    private _opts: youtubeSearch.YouTubeSearchOptions = {
        maxResults: 5,
        key: YOUTUBE_DATA_API_KEY,
        type: "video"
    };

    /**
     * Takes search terms and gives a list of YoutubeSong objects
     * This is a 'wtf' function, so hold on tight if you're reading it
     * Basically, it converts callback-based methods from 3rd party libraries to promises and then chains them
     * @param {string} keywords
     * @returns {Promise<YoutubeSong[]>}
     */
    search(keywords: string): Promise<YoutubeSong[]> {
        //Returns promise that fetches search results
        let getSearchResults = (keywords: string) => {
            return new Promise<YouTubeSearchResults[]>(resolve => {
                youtubeSearch(keywords, this._opts, (err, result) => {
                    resolve(result);
                })
            })
        };

        //Get search results
        //Map each result to a YoutubeSong
        //Return array of songs
        return getSearchResults(keywords).then(searchResults => {
            let promises: Promise<YoutubeSong>[] = [];
            for (let searchResult of searchResults) {
                promises.push(this.getSongDetails(searchResult.link));
            }
            return Promise.all(promises);
        }).then(results => {
            let youtubeSongs: YoutubeSong[] = [];
            for (let ytSong of results) {
                youtubeSongs.push(ytSong);
            }
            return youtubeSongs;
        });
    }

    getSongDetails(link: string): Promise<YoutubeSong> {
        return ytdl.getInfo(link).then((info: any) => {
            return new YoutubeSong(info.title, info.length_seconds, link);
        });
    }

    /**
     * Returns a list of video ids from the given playlist
     * @param {string} link
     * @returns {Promise<Array<string>>}
     */
    getPlaylistInfo(link: string): Promise<Array<string>> {

        //Get playlist id from link
        let playlistId: string = new RegExp(".*list=([a-zA-Z0-9_]*).*").exec(link)[1];

        //Check index.d.ts of "youtube-playlist-info" for PlaylistItem information
        //The types are not exported so I can't use them here :(
        return ypi(YOUTUBE_DATA_API_KEY, playlistId).then((items: any[]) => {
            return items.map(item => item.resourceId.videoId);
        })

    }

}