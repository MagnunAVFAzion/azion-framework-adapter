import { copyFileSync,rmSync } from "fs";
import path from "path";
import webpack, { Configuration } from "webpack";
import merge from "webpack-merge";
import { BOOTSTRAP_CODE } from "../bootstraps/common";
import { BootstrapUtils } from "../bootstraps/utils";

import { generateWorkerStaticSiteConfig } from "../configs/static-site/webpack.worker.config";
import { FailedToBuild } from "../errors";
import { ManifestMap } from "../manifest";
import { Builder } from "./builder";

class StaticSiteBuilder extends Builder {
    baseConfig: Configuration;
    outputPath: string;

    constructor(targetDir: string) {
        super(targetDir);

        this.outputPath = path.join(this.targetDir, "worker");
        this.baseConfig = generateWorkerStaticSiteConfig(this.outputPath);
    }

    async buildWorker(
        configPath: string,
        manifest: ManifestMap,
        kvArgs: any,
        isStaticSite: boolean
    ): Promise<webpack.Stats> {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const baseConfig = require(path.join(this.targetDir, configPath));
        const baseConfigObj = typeof baseConfig === "function" ?
            baseConfig() : baseConfig;
        const additionalConfig = generateWorkerStaticSiteConfig(this.outputPath);
        const config = merge(baseConfigObj, additionalConfig);

        const definePluginObj: any = (config.plugins ?? []).filter(
            (el: object) => el.constructor.name === "DefinePlugin"
        )[0];
        definePluginObj.definitions.CREDENTIALS_VALUE = JSON.stringify(kvArgs);
        definePluginObj.definitions.STATIC_CONTENT_MANIFEST_VALUE = JSON.stringify(manifest);

        const workerCompiler = webpack(config);

        let bootstrapCode = BOOTSTRAP_CODE;
        if (isStaticSite) bootstrapCode += ' global.__PROJECT_TYPE_PATTERN = PROJECT_TYPE_PATTERN_VALUE;';

        workerCompiler.hooks.beforeRun.tapAsync(
            "Before compile",
            (_, callback) => {

                copyFileSync(isStaticSite? "./src/index.js": "./index.js", config.entry);

                const bootstrapUtils = new BootstrapUtils(
                    config.entry?.toString() ?? "./index.tmp.js",
                    bootstrapCode
                );
                bootstrapUtils.addBootstrap();
                callback();
            }
        );

        workerCompiler.hooks.done.tapAsync(
            "After compile",
            (_, callback) => {
                rmSync(config.entry);
                callback();
            }
        );

        return new Promise((resolve, reject) => {
            workerCompiler.run((err: Error, stats: webpack.Stats) => {
                if (err) {
                    const error = err as any;
                    const reason = JSON.stringify(
                        error.details ?? "webpack execution for the worker",
                        null,
                        " "
                    );
                    reject(new FailedToBuild(this.targetDir, reason));
                    return;
                }
                const info = stats.toJson();
                if (stats.hasErrors()) {
                    for (const msg of info.errors) {
                        console.error(msg);
                    }
                    reject(
                        new FailedToBuild(this.targetDir, "worker compilation errors")
                    );
                    return;
                }
                console.log("Finished worker.");
                resolve(stats);
            });
        });
    }
}

export { StaticSiteBuilder }