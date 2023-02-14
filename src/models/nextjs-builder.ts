import { Builder } from "./builder";

class NextjsBuilder extends Builder {
    constructor(targetDir: string) {
        super(targetDir);

        throw Error("Nextjs build not implemented!");
    }
}

export { NextjsBuilder }