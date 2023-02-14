import path from "path";

import { AssetPublisher } from "./asset-publisher";
import { read_config } from "./config";
import { CELLS_SITE_TEMPLATE_REPO, CELLS_SITE_TEMPLATE_WORK_DIR } from "./constants";
import { displayError, errorCode, ErrorCode } from "./errors";
import { initCellsTemplate } from "./init";
import { KVArgs } from "./interfaces/kv-args";
import ManifestBuilder from "./manifest";
import { NextjsBuilder } from "./models/nextjs-builder";
import { StaticSiteBuilder } from "./models/static-site-builder";

class BuildDispatcher {
    static async exec(options: any): Promise<ErrorCode> {
        try {
            const rawCfg = read_config(options);
            const cfg = await AssetPublisher.getConfig(rawCfg, process.env);
            const kvArgs: KVArgs = Object.assign({ retries: 0 }, cfg.kv);

            const targetDir = process.cwd();
            let builder, manifest;

            const webpackConfigPath = "webpack.config.js";
            if (options.staticSite) {
                await initCellsTemplate(targetDir, CELLS_SITE_TEMPLATE_REPO);

                const staticSiteWorkerDir = path.join(targetDir, CELLS_SITE_TEMPLATE_WORK_DIR);

                console.log("Static site template initialized. Building ...");
                process.chdir(staticSiteWorkerDir);

                builder = new StaticSiteBuilder(process.cwd());
                builder.createWorkerDir();

                manifest = new ManifestBuilder(targetDir, options.assetsDir, 
                    `${CELLS_SITE_TEMPLATE_WORK_DIR}/worker/manifest.json`).storageManifest();
               
                await builder.buildWorker(
                    webpackConfigPath,
                    manifest,
                    kvArgs,
                    options.staticSite
                );
            } else {
                builder = new NextjsBuilder(targetDir);
                builder.createWorkerDir();
                manifest = new ManifestBuilder(targetDir).storageManifest();
            }

            console.log("Completed.");

            return ErrorCode.Ok;
        } catch (err: any) {
            displayError(err);

            return errorCode(err);
        }
    }
}

export { BuildDispatcher }