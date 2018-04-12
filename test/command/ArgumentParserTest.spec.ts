import { expect } from "chai";
import "mocha"

import {ArgumentParser} from "../../src/command/ArgumentParser";

function commandToArgs(command: string): string[] {
    return command.split(" ").slice(1);
}

describe("get command arguments", () => {

    it("should provide only body if no options are given", () => {
        let result = ArgumentParser.getCommandArguments(commandToArgs("?test something here"));
        expect(result.args.length).to.equal(0);
        expect(result.body).to.equal("something here");
    });

    it("should provide argument with undefined string if only option is given", () => {
        let result = ArgumentParser.getCommandArguments(commandToArgs("?test -p"));
        expect(result.args.length).to.equal(1);
        expect(result.args[0].name).to.equal("p");
        expect(result.args[0].value).to.equal(undefined);
    });

   it("should provide argument with value if option and value are given: single word unquoted", () => {
       let result = ArgumentParser.getCommandArguments(commandToArgs("?test -p hello"));
       expect(result.args.length).to.equal(1);
       expect(result.args[0].name).to.equal("p");
       expect(result.args[0].value).to.equal("hello");
   });

    it("should provide argument with value if option and value are given: single word double quotes", () => {
        let result = ArgumentParser.getCommandArguments(commandToArgs("?test -p \"hello\""));
        expect(result.args.length).to.equal(1);
        expect(result.args[0].name).to.equal("p");
        expect(result.args[0].value).to.equal("hello");
    });

    it("should provide argument with value if option and value are given: single word single quotes", () => {
        let result = ArgumentParser.getCommandArguments(commandToArgs("?test -p 'hello'"));
        expect(result.args.length).to.equal(1);
        expect(result.args[0].name).to.equal("p");
        expect(result.args[0].value).to.equal("hello");
    });

    it("should provide argument with value if option and value are given: multiple words", () => {
        let result = ArgumentParser.getCommandArguments(commandToArgs("?test -p \"hello there how are ya\""));
        expect(result.args.length).to.equal(1);
        expect(result.args[0].name).to.equal("p");
        expect(result.args[0].value).to.equal("hello there how are ya");
    })

});