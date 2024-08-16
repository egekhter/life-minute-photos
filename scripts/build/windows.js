require('../../backend/helpers/shared');

let path = require('path');
let app_root = getRepoRoot();
let packageSettings = require('../../package.json');

loadEnv();

module.exports = {
    build: function () {
        return new Promise(async (resolve, reject) => {
            console.log({
                building_windows_version: packageSettings.version
            });

            let is_production = true;
            let skip_build = false;

            let skip_sign = true;

            if(process.argv.indexOf('-d') > -1) {
                is_production = false;
            }

            if(process.argv.indexOf('-sb') > -1) {
                skip_build = true;
            }

            if(process.argv.indexOf('-sign') > -1) {
                skip_sign = false;
            }

            let build_frontend = require('../build_frontend');

            const builder_path = joinPaths(app_root, 'node_modules', 'electron-builder');

            const cli = joinPaths(builder_path, 'out', 'cli', 'cli.js');

            process.chdir(app_root);

            if(!skip_build) {
                try {
                    await build_frontend.build(packageSettings.version, is_production);
                } catch (e) {
                    console.error(e);
                    process.exit();
                }
            }

            let bin_dir = joinPaths(app_root, 'backend/bin/win');

            let dist_dir = joinPaths(app_root, 'dist');

            let only_64 = process.argv.indexOf('-64') > -1;
            let only_32 = process.argv.indexOf('-32') > -1;

            let arch_32 = {
                arch: 'ia32',
                installer_string: '-32bit',
                files: [
                    joinPaths(bin_dir, 'exiftool.exe'),
                    // joinPaths(bin_dir, 'ffmpeg-32.exe'),
                    joinPaths(bin_dir, 'gm-32.exe'),
                ]
            };

            let arch_64 =  {
                arch: 'x64',
                installer_string: '',
                files: [
                    joinPaths(bin_dir, 'exiftool.exe'),
                    // joinPaths(bin_dir, 'ffmpeg.exe'),
                    joinPaths(bin_dir, 'gm.exe'),
                ]
            };

            let archs = [];

            if(only_64) {
                archs.push(arch_64);
            } else if (only_32) {
                archs.push(arch_32);
            } else {
                archs.push(arch_64, arch_32);
            }

            let init_output_exe = joinPaths(dist_dir, `${packageSettings.productName} Setup ${packageSettings.version}.exe`);

            for(let arch of archs) {
                let filename = `${packageSettings.productName}-Setup${arch.installer_string}-${packageSettings.version}.exe`;

                filename = filename.toLowerCase().replaceAll(' ', '-');

                let config_path = joinPaths(dist_dir, `builder-config-win-${arch.arch}.json`);
                let config_data = packageSettings.build;

                if('mac' in config_data) {
                    delete config_data.mac;
                }

                let extra_resources = [];

                for(let f of arch.files) {
                    extra_resources.push({
                        from: f,
                        to: `app/backend/bin/win/${path.basename(f).replace('-32', '')}`
                    });
                };

                config_data.artifactName = filename;

                config_data.win = {
                    extraResources: extra_resources
                };

                config_data.nsis = {
                    uninstallDisplayName: packageSettings.productName
                };

                try {
                    await writeFile(config_path, JSON.stringify(config_data));
                } catch (e) {
                    console.error(e);
                }

                let arch_output = joinPaths(dist_dir, filename);

                let presign_output = joinPaths(dist_dir, filename.replace('.exe', '-presign.exe'));

                if(skip_sign) {
                    presign_output = joinPaths(dist_dir, filename);
                }

                if(!skip_build) {
                    let cmd = `node "${cli}" --win --${arch.arch} --config "${config_path}"`;

                    console.log(cmd);

                    try {
                        await runExec(cmd);
                        console.log("Built Windows: " + arch.arch);

                        if(!skip_sign) {
                            let mv_cmd = `mv "${init_output_exe}" "${presign_output}"`;
                            await runExec(mv_cmd);
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }

                if(!skip_sign) {
                    if(await checkIfPathExists(arch_output)) {
                        await deleteFilePath(arch_output);
                    }

                    let cmd = `sudo osslsigncode sign -verbose -pkcs11engine /usr/local/mac-dev/lib/engines-1.1/libpkcs11.dylib -pkcs11module /usr/local/lib/libeTPkcs11.dylib -h sha256 -n ${process.env.WINDOWS_SIGN_NAME} -t http://timestamp.comodoca.com/authenticode -certs ${process.env.WINDOWS_CERT_PEM} -key slot_0 -pass '${process.env.WIN_PASSWORD}' -in ${presign_output} -out ${arch_output}`

                    try {
                        await runExec(cmd);
                        console.log("Signed Windows: " + arch.arch);
                    } catch (e) {
                        console.error(e);
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