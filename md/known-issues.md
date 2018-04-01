# Known Issues

### youtube-search index.d.ts compilation issue
For some reason this file doesn't compile. I'm guessing `tsconfig.json` is not configured correctly or newer versions of typescript aren't backwards compatible with this package

Fix by changing the definition for the `search` function to this:
````
declare function search(
  term: string,
  opts: search.YouTubeSearchOptions,
  cb?: (err: Error, result?: search.YouTubeSearchResults[], pageInfo?: search.YouTubeSearchPageResults) => void
): Promise<(result: search.YouTubeSearchResults[], pageInfo?: search.YouTubeSearchPageResults) => void>;
````

### \[MainManagedMessage] On initialize reaction 'message is undefined' while song is playing

