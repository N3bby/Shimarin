import {inject, injectable, multiInject} from "inversify";
import {CommandOutputService} from "./CommandOutputService";
import {Message} from "discord.js";
import {RequestContext} from "../model/RequestContext";
import {COMMAND_PREFIX} from "../../properties";
import {Command} from "../../command/Command";
import {CommandResponse, CommandResponseType} from "../../command/CommandResponse";
import {createLogger, Logger} from "../../logging/Logging";

@injectable()
export class CommandHandlerService {

    private _logger: Logger = createLogger(CommandHandlerService.name);

    @inject(CommandOutputService.name)
    private _commandOutputService: CommandOutputService;

    @multiInject(Command.name)
    private _commands: Command[];

    handleMessage(message: Message) {
        //Parse message so we can create a RequestContext
        let tokens: string[] = message.content.split(" ");
        let commandStr = tokens[0].replace(COMMAND_PREFIX, "");
        tokens.shift(); //Remove first (command) token, rest of the tokens are the arguments now

        //Create RequestContext
        let requestContext = new RequestContext(message.author, commandStr, tokens, message.createdAt);
        this.handleCommand(requestContext);
    }

    handleCommand(requestContext: RequestContext) {
        //Get argument string for debug purposes
        let argumentString = requestContext.args.reduce((t1, t2) => t1 + " " + t2, "");

        //Find and execute command
        let command: Command = this._commands.find(c => c.matches(requestContext.command));
        if (command === undefined) {
            this._commandOutputService.addOutput(`${requestContext.user.tag}, command '${requestContext.command}' does not exist`);
            this._logger.info(`${requestContext.user.tag} tried executing unknown command ${requestContext.command + argumentString}`);
        } else {
            command.validateAuthorizeAndExecute(requestContext).then(commandResponse => {
                if (commandResponse.message !== undefined) {
                    this._commandOutputService.addOutput(`${requestContext.user.tag}, ${commandResponse.message}`);
                }
                this._logger.info(`${requestContext.user.tag} executed command '${requestContext.command + argumentString}'. response was [${CommandResponseType[commandResponse.type]}] '${commandResponse.message}'`);
            }).catch(reason => {
                this._logger.error(`Error on command '${requestContext.command}' with args '${requestContext.args.reduce((a1, a2) => a1 + " " + a2)}': '${reason}'\n${reason.stack}`);
                this._commandOutputService.addOutput(`${requestContext.user.tag}, Something went wrong: '${reason}'`);
            });
        }
    }

}