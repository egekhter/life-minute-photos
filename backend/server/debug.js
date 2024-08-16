const {stringify} = require('flatted');
const error_folder = 'errors';


async function log(data, extra_info, custom_dir = null) {
    if(!isProd()) {
        if(custom_dir === error_folder) {
            console.error(data);
        } else {
            devConsole(data);
        }

        if(extra_info) {
            devConsole(extra_info);
        }
    }

    function free() {
        return new Promise(async (resolve, reject) => {
            if(!module.exports.log_ip) {
                module.exports.log_ip = true;
                return resolve();
            }

            setTimeout(async function () {
                await free();
                resolve();
            }, 10);
        });
    }

    await free();

    try {
        let log_dir = await getAppLogDir();

        if(custom_dir) {
            log_dir = joinPaths(log_dir, custom_dir);
        }

        try {
            await createDirectoryIfNotExistsRecursive(log_dir);
        } catch (e) {
            console.error(e);
        }

        let log_file = joinPaths(log_dir, new Date().toISOString().slice(0, 10));

        let extra_info_str = '';

        if(extra_info) {
            extra_info_str = extra_info;

            if(typeof extra_info !== 'string') {
                extra_info_str = stringify(extra_info);
            }
        }

        let log_msg = '';

        if(data && typeof data !== 'string') {
            log_msg = stringify(data);
        } else if(data) {
            log_msg = data;
        }

        let fs = require('fs');

        let logStream = fs.createWriteStream(log_file, {flags: 'a'});
        logStream.write(`${getDateTimeStr()}\n${log_msg}\n${extra_info_str}\n\n`);
        logStream.end();
    } catch (e) {
    }

    module.exports.log_ip = false;
}

async function error (data, extra_info) {
    let stack = extra_info;

    if(typeof data === 'object' && !stack && 'stack' in data) {
        stack = data.stack;
    }

    module.exports.log(data, stack, error_folder);
}

function resetData() {
    module.exports.log_ip = false;
}

module.exports = {
    log_ip: false,
    log: log,
    error: error,
    resetData: resetData
};