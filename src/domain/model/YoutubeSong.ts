
export class YoutubeSong {

    protected _title: string;
    protected _length: number;
    protected _link: string;

    constructor(title: string, length: number, link: string) {
        this._title = title;
        this._length = length;
        this._link = link;
    }

    async title(): Promise<string> {
        return this._title;
    }

    /**
     * Gets the length of the song in seconds
     * @returns {number}
     */
    async length(): Promise<number> {
        return this._length;
    }

    async link(): Promise<string> {
        return this._link;
    }

}

/**
 * Formats seconds to minutes/seconds format mm:ss
 * @param {number} totalSeconds
 * @returns {string}
 * @private
 */
export function secondsToFormat(totalSeconds: number): string {
    let lpad = (str: string, padString: string, length: number) => {
        while (str.length < length) str = padString + str;
        return str;
    };
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = Math.floor(totalSeconds % 60);
    return `${lpad(minutes.toString(), "0", 2)}:${lpad(seconds.toString(), "0", 2)}`;
}