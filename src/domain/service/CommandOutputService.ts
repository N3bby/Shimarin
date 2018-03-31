import {COMMAND_OUTPUT_DELTE_DELAY} from "../../properties";
import {createLogger, Logger} from "../../logging/Logging";
import {injectable} from "inversify";

@injectable()
export class CommandOutputService {

    private _logger: Logger = createLogger(CommandOutputService.name);

    private _output: string[] = [];
    private _callbacks: (() => void)[] = [];

    get output(): string[] {
        //Returns a copy of the output array
        return this._output.slice();
    }

    /**
     * Adds output to the command output array and fires the output changed event
     * Also sets up a removal timeout
     * @param {string} message
     */
    addOutput(message: string) {
        this._output.push(message);
        this._fireChangedEvent();
        setTimeout(() => {
            this._output.shift();
            this._fireChangedEvent();
        }, COMMAND_OUTPUT_DELTE_DELAY);
    }

    /**
     * Calls all the callbacks
     * @private
     */
    private _fireChangedEvent() {
        for (let callback of this._callbacks) {
            try {
                callback();
            } catch (e) {
                this._logger.error(`on changed event callback '${e}'`);
            }
        }
    }

    /**
     * Adds a callback for the changed event
     * @param {() => void} callback
     */
    addOutputChangedListener(callback: () => void) {
        this._callbacks.push(callback);
    }

}