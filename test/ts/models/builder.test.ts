import * as fs from 'fs';
import * as path from 'path';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as spies from 'chai-spies';

import { Builder } from '../../../dist/models/builder';
import { StaticSiteBuilder } from '../../../dist/models/static-site-builder';
import { FailedToBuild } from '../../../dist/errors';

chai.should();
chai.use(spies);
chai.use(chaiAsPromised);

describe('Builder', () => {
    let builder: Builder;
    let currentDir: string;
    let workerDir: string;

    before(() => {
        currentDir = process.cwd();
        builder = new StaticSiteBuilder(currentDir);
        workerDir = path.join(builder.targetDir, "worker");
    });

    describe('when a new instance is created', () => {
        it('should set correct target dir', () => {
            builder.targetDir.should.be.equal(currentDir);
        });
    });

    describe('when create a worker dir', () => {
        afterEach(() => {
            fs.rmSync(workerDir, { recursive: true });
        });

        describe('that specified path already exists and is NOT a dir', () => {
            before(() => {
                fs.writeFileSync(workerDir, 'fileDataMock');
            });

            it('should throw an error', () => {
                (() => builder.createWorkerDir()).should.throw(
                    FailedToBuild, workerDir, "cannot create 'worker' directory"
                );
            });
        });

        describe('that specified path already exists and is a dir', () => {
            let sandbox: ChaiSpies.Sandbox;

            before(() => {
                fs.mkdirSync(workerDir);

                sandbox = chai.spy.sandbox();
                sandbox.on(fs, ['mkdirSync']);
            });

            after(() => {
                sandbox.restore();
            });

            it('should NOT take actions', () => {
                builder.createWorkerDir();

                fs.mkdirSync.should.have.been.called.exactly(0);
            });
        });

        describe('that NOT exists', () => {
            it('should create a new dir based', () => {
                builder.createWorkerDir();

                fs.existsSync(workerDir).should.be.true;
            });
        });
    });
});

