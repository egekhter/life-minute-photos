require('../../backend/helpers/shared');
let app_root = getRepoRoot();
let notarize = require('./notarize');
let packageSettings = require('../../package.json');
const path = require("path");

loadEnv();

module.exports = {
    build: function () {
        return new Promise(async (resolve, reject) => {
            console.log({
                building_mac_version: packageSettings.version
            });

            let is_production = true;
            let skip_build = false;

            let skip_sign = true;
            let skip_notarize = true;

            if(process.argv.indexOf('-d') > -1) {
                is_production = false;
            }

            if(process.argv.indexOf('-sb') > -1) {
                skip_build = true;
            }

            if(process.argv.indexOf('-sign') > -1) {
                skip_sign = false;
            }

            if(process.argv.indexOf('-notarize') > -1) {
                skip_notarize = false;
            }

            let build_frontend = require('../build_frontend');

            const builder_path = joinPaths(app_root, 'node_modules/electron-builder');

            const cli = joinPaths(builder_path, 'out/cli/cli.js');

            process.chdir(app_root);

            if(!skip_build) {
                console.log("Building frontend: Mac");
                try {
                    await build_frontend.build(packageSettings.version, is_production);
                } catch (e) {
                    console.error(e);
                    process.exit();
                }
            }

            let bin_dir = joinPaths(app_root, 'backend', 'bin/mac');

            let dist_dir = joinPaths(app_root, 'dist');

            let files = [
                joinPaths(bin_dir, 'exiftool'),
                // joinPaths(bin_dir, 'ffmpeg'),
                joinPaths(bin_dir, 'gm'),
                joinPaths(bin_dir, 'md5'),
            ];

            let archs = [
                {
                    arch: 'x64',
                    installer_string: '-x64',
                    files: files
                },
                {
                    arch: 'arm64',
                    installer_string: '-arm64',
                    files: files
                },
            ];

            for(let arch of archs) {
                let fileName = `${packageSettings.name}-${packageSettings.version}-${arch.arch}.dmg`;
                fileName = fileName.toLowerCase().replaceAll(' ', '-');

                // let config_path = joinPaths(dist_dir, `builder-config-mac-${arch.arch}.json`);
                // let config_data = packageSettings.build;

                // config_data.artifactName = fileName;

                if(!skip_build) {
                    // try {
                    //     await writeFile(config_path, JSON.stringify(config_data));
                    // } catch (e) {
                    //     console.error(e);
                    // }

                    console.log(`Building Mac: ${arch.arch}`);

                    let cmd = `"${cli}" --mac --${arch.arch}`;

                    try {
                        await runExec(cmd);
                        console.log("Built Mac");
                    } catch (e) {
                        console.error(e);
                        process.exit();
                    }
                }

                let software_path = joinPaths(dist_dir, fileName);

                if(!require('fs').existsSync(software_path)) {
                    console.log("Path does not exist");
                    process.exit();
                }

                if(!skip_sign) {
                    console.log(`Signing Mac: ${arch.arch}`);

                    let cmd = `codesign --deep --force --verbose --timestamp --sign "${process.env.MAC_SIGN_ID_STR}" "${software_path}"`;
                    console.log(cmd);
                    await runExec(cmd);
                }

                if(!skip_notarize) {
                    console.log(`Notarizing Mac: ${arch.arch}`);

                    //notarize
                    try {
                        await notarize.notarize(packageSettings.name, software_path);
                    } catch (e) {
                        console.error(e);
                        process.exit();
                    }
                }
            }

            resolve();
        });
    }
};

if(!module.parent) {
    module.exports.build();
}