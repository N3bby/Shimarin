# Commands

### Play

Plays a song from a given url  
or search results for given keywords.  

##### Syntax  
```
?play <url|keywords>
```

### Clear

Clears messages in a given channel  
Argument can either be a user or a regex.  
Regexes are directly fed into Javascript, so you will have to escape characters yourself.

This command can only be executed by the owner of the bot (OWNER_ID in properties.ts)

The id for a channel or user can be gotten by right-clicking them in the discord client and clicking 'Copy ID'

##### Syntax   
```
clear <channel_id> <'matching'|'user'> <messages_to_search> <regex|user_id>
```

##### Examples  
Clear all messages starting with `what are` from the last 200 messages in some channel
```
clear 255085569573388272 matching 200 ^what are
```

Clear all messages of some user from the last 150 messages in some channel
```
clear 255085569573388272 user 150 159709275524956132
```
