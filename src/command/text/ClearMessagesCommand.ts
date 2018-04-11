import {Command} from "../Command";
import {RequestContext} from "../../domain/model/RequestContext";
import {CommandResponse, CommandResponseType} from "../CommandResponse";
import {OWNER_ID} from "../../properties";
import {ClientHandle} from "../../domain/wrapper/ClientHandle";
import {inject} from "inversify";
import {Message} from "discord.js";
import {MainManagedMessage} from "../../domain/message/main/MainManagedMessage";
import {CommandOutputService} from "../../domain/service/CommandOutputService";

export class ClearMessagesCommand extends Command {

    @inject(ClientHandle.name)
    private _clientHandle: ClientHandle;

    @inject(MainManagedMessage.name)
    private _mainManagedMessage: MainManagedMessage;

    @inject(CommandOutputService.name)
    private _commandOutputService: CommandOutputService;

    getLogName(): string {
        return ClearMessagesCommand.name;
    }

    get name(): string {
        return "clear";
    }

    get description(): string {
        return "clears messages";
    }

    get syntax(): string {
        return "clear <channel_id> <**matching**|**user**> <messages_to_search> <regex|user_id>";
    }

    matches(command: string): boolean {
        return command === "clear";
    }

    authorize(requestContext: RequestContext): CommandResponse {
        if (requestContext.user.id !== OWNER_ID) {
            return new CommandResponse(CommandResponseType.ERROR, "only the owner of the bot can do this");
        } else {
            return new CommandResponse(CommandResponseType.SUCCESS);
        }
    }

    validate(requestContext: RequestContext): CommandResponse {
        //Check arguments minimum length
        if (requestContext.args.length < 4) {
            return new CommandResponse(CommandResponseType.ERROR, "not enough arguments, expected 3");
        }
        //Check if channel from argument 1 exists
        if (this._clientHandle.getTextChannelById(requestContext.args[0]) === undefined) {
            return new CommandResponse(CommandResponseType.ERROR, `no text channel found with id '${requestContext.args[0]}'`);
        }
        //Check if argument 2 is correct
        if (requestContext.args[1] !== "matching" && requestContext.args[1] !== "user") {
            return new CommandResponse(CommandResponseType.ERROR, "argument 1 must be 'matching' or 'user'");
        }
        //Check if argument 3 is a number
        try {
            let limit: number = parseInt(requestContext.args[2]);
            if (limit < 1) {
                return new CommandResponse(CommandResponseType.ERROR, "messages_to_search must be larger than 0");
            }
        } catch (e) {
            return new CommandResponse(CommandResponseType.ERROR, "<messages_to_search> must be a natural number");
        }
        //Check if argument 4 resolves to a existing user id when argument 1 is 'user'
        if (requestContext.args[1] === "user" && this._clientHandle.getUserById(requestContext.args[3]) === undefined) {
            return new CommandResponse(CommandResponseType.ERROR, `no user found with id '${requestContext.args[3]}'`);
        }
        //Success if all previous things were okay
        return new CommandResponse(CommandResponseType.SUCCESS);
    }

    async execute(requestContext: RequestContext): Promise<CommandResponse> {

        this._commandOutputService.addOutput(`${requestContext.user.tag}, started clearing messages, this may take a while...`);

        let messages: Message[] = await this._clientHandle.getLastNMessages(
            this._clientHandle.getTextChannelById(requestContext.args[0]),
            parseInt(requestContext.args[2]));

        //Remove our command message
        //Remove managed message so we can't accidentally delete it
        messages.shift();
        messages = messages.filter(value => value.id !== this._mainManagedMessage.message.id);

        let matches: Message[] = [];
        let removed: number = 0;
        let fails: number = 0;

        //Fill matched messages list
        if (requestContext.args[1] === "user") {
            for (let message of messages) {
                if (message.author.id === requestContext.args[3]) {
                    matches.push(message);
                }
            }
        } else if (requestContext.args[1] === "matching") {
            //Combine indices 2+ to form a string
            let regexToMatch: RegExp = new RegExp(requestContext.args.slice(3).reduce((s1, s2) => s1 + " " + s2, "").trim());

            //Get all messages that match the regex
            for (let message of messages) {
                if (regexToMatch.test(message.content)) {
                    matches.push(message);
                }
            }
        }

        //Actually delete the messages
        for (let message of matches) {
            try {
                this._logger.debug(`deleted message of ${message.author.id} '${message.content}'`);
                await message.delete();
                removed++;
            } catch (e) {
                fails++;
                this._logger.error(`on delete message '${e}'`);
            }
        }

        return new CommandResponse(CommandResponseType.SUCCESS, `deleted ${removed} messages, ${fails} fails`);

    }

}