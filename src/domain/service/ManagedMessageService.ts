import {ManagedMessage} from "../message/ManagedMessage";
import {inject, injectable} from "inversify";
import {ClientHandle} from "../wrapper/ClientHandle";
import {Message} from "discord.js";
import {container} from "../../inversify/inversify.config";

@injectable()
export class ManagedMessageService {

    @inject(ClientHandle.name)
    private _clientHandle: ClientHandle;

    /**
     * Forwards the message event to all ManagedMessages
     * @param {"discord.js".Message} message
     */
    handleMessage(message: Message) {
        let managedMessages: ManagedMessage[] = container.getAll(ManagedMessage.name);
        for (let managedMessage of managedMessages) {
            managedMessage.handleMessage(message);
        }
    }

}