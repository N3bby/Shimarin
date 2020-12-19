# This project hasn't been maintained and might not work anymore

# Shimarin

Shimarin is a (WIP) Self-Hosted Discord Music Bot written in Typescript.  
Most of the inspiration came from [jagrosh's music bot](https://github.com/jagrosh/MusicBot).  

Remark: The code is currently a bit messy and needs automated tests

## Features

- Cleans up user commands
- Only uses 1 message which is updated in favor of creating a new one every time a command is issued (which would clutter the chat log).
- Moves its 1 message to the bottom of the chat log (waits if people are chatting)
- Support for Youtube song urls
- Searching for youtube songs by keyword
- Reaction based bot interaction system. The amount of commands you need to use is minimal
- Shows song progression
- Allow only a certain role to use music commands

**Only has single-server support atm**

## Setup

Go [here](./md/setup-guide.md) for a setup guide

## Example

![](./md/img/shimarin-example.PNG)

## Commands

[Commands](./md/commands.md)

## Planned Features/Improvements

Any planned features/bugfixes can be found on the [projects page](https://github.com/Razacx/Shimarin/projects)
