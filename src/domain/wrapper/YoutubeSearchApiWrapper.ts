import * as youtubeSearch from "youtube-search";
import {YOUTUBE_DATA_API_KEY} from "../../properties";
import {YoutubeSong} from "../model/YoutubeSong";
import {YouTubeSearchResults} from "youtube-search";
const ytdl = require("ytdl-core");

/**
 * Wrapper for the youtube search api
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
            for(let searchResult of searchResults) {
                promises.push(this.getSongDetails(searchResult.link));
            }
            return Promise.all(promises);
        }).then(results => {
            let youtubeSongs: YoutubeSong[] = [];
            for(let ytSong of results) {
                youtubeSongs.push(ytSong);
            }
            return youtubeSongs;
        });
    }

    getSongDetails(link: string): Promise<YoutubeSong> {
        return new Promise<YoutubeSong>(resolve => {
            ytdl.getInfo(link, (err: any, info: any) => {
                if(err) throw err;
                resolve(new YoutubeSong(info.title, info.length_seconds, link))
            });
        });
    }

}