import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { NextjsBuilder } from '../../../dist/models/nextjs-builder'

chai.should();
chai.use(chaiAsPromised);

describe('Nextjs Builder', () => {
    it("should throw 'not implemented' error", async () => {
        const targetDir = process.cwd();

        (() => new NextjsBuilder(targetDir)).should.throw(
            Error, "Nextjs build not implemented!"
        );
    });
});

