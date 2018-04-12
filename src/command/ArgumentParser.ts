import {CommandArgument} from "./CommandArgument";

//TODO Test
export class ArgumentParser {

    private static concatStringArguments(args: string[]): string[] {

        let result: string[] = [];

        let currentStringDepth = 0;
        let currentString = "";

        for (let i = 0; i < args.length; i++) {
            if (args[i].startsWith("\"") || args[i].startsWith("'")) {
                if (currentStringDepth === 0) {
                    currentString = "\"";
                } else {
                    currentString += " " + args[i];
                }
                currentStringDepth++;
            } else if (args[i].endsWith("\"") || args[i].endsWith("'")) {
                currentStringDepth--;
                if (currentStringDepth === 0) {
                    result.push(currentString + "\"");
                } else {
                    currentString += " " + args[i];
                }
            } else {
                result.push(args[i]);
            }
        }

        return result;

    }

    public static getCommandArguments(args: string[]): { args: CommandArgument[], body: string } {

        args = this.concatStringArguments(args);
        let parsedArgs: CommandArgument[] = [];
        let body: string = "";

        for (let i = 0; i < args.length; i++) {
            if (args[i].startsWith("-")) {
                if (args[i].length === 1) throw new Error("invalid option given");
                if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
                    //Remove leading and trailing " if needed
                    if(args[i + 1].startsWith("\"") && args[i + 1].endsWith("\"") && args[i + 1].length >= 2) {
                        args[i + 1] = args[i + 1].substr(1, args[i + 1].length - 2);
                    }
                    parsedArgs.push(new CommandArgument(args[i].substr(1), args[i + 1]));
                    i++; //Skip over the string we just parsed
                } else {
                    parsedArgs.push(new CommandArgument(args[i].substr(1), undefined))
                }
            } else {
                if(!body) {
                    body += args[i];
                } else {
                    body += " " + args[i];
                }
            }
        }

        return {
            args: parsedArgs,
            body: body
        };

    }

}