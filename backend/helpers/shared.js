const {exec} = require("child_process");
const find_process = require("./find-process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const process = require("process");
const writeFileAtomic = require("write-file-atomic");

const packageSettings = require("../../package.json");

global.image_ext = ['jpg', 'png', 'gif', 'tif', 'tiff', 'jpeg', 'bmp', 'heic', 'webp'];
global.writeKeys = {};


Date.prototype.toMysqlFormat = function() {
    return this.toISOString().slice(0, 19).replace('T', ' ');
};

global.isProd = function () {
    return getNodeEnv().toLowerCase().includes("prod");
}

global.getNodeEnv = function () {
    if(process.argv.indexOf('-d') > -1) {
        return 'dev';
    }

    if(process.env.NODE_ENV) {
        return process.env.NODE_ENV;
    }

    return 'production';
}

global.getRepoRoot = function () {
    let slash = `/`;

    if(getIsWindows()) {
        slash = `\\`;
    }

    let path_split = __dirname.split(slash);

    let path_split_slice = path_split.slice(0, path_split.length - 2);

    let root = path_split_slice.join(slash);

    return root;
};

global.loadEnv = function () {
    let repo_root = getRepoRoot();

    const process = require('process');
    process.chdir(repo_root);

    require('dotenv').config();
}

global.killPreviouslyStarted = function () {
    return new Promise(async (resolve, reject) => {
        try {
            let sub_process_name = isProd() ? `${packageSettings.productNameShort} Helper` : 'Electron Helper';

            let helpers = await find_process('name', sub_process_name);

            for(let h of helpers) {
                if(h.ppid !== process.pid) {
                    try {
                        process.kill(h.pid);
                    } catch(e) {
                    }
                }
            }
        } catch(e) {
        }

        return resolve();
    });
}

global.killPids = function (server_pid) {
    return new Promise(async (resolve, reject) => {
        let int = setInterval(async function () {
            try {
                let helpers = await find_process('pid', server_pid);

                if(!helpers.length) {
                    clearInterval(int);
                    return resolve();
                } else {
                    try {
                        process.kill(server_pid);
                    } catch(e) {

                    }
                }
            } catch(e) {
            }
        }, 50);
    });
}

global.devConsole = function() {
    if(typeof photosApp !== 'undefined' && photosApp.dev && photosApp.dev.enabled && photosApp.dev.showConsole) {
        let args = [];

        for (let i = 0; i < arguments.length; i++) {
            let arg = arguments[i];
            args.push(arg);

            if(arg && arg.type && arg.type == 'error') {
                // console.trace();
            }
        }

        if(args.length === 1) {
            console.log(args[0]);
        } else {
            console.log(args);
        }

        let tr = Error().stack.split('\n');

        if(tr.length >= 3) {
            console.log(tr[2]);
        }
    }
}

global.getIsWindows = function() {
    if(process.platform.startsWith('win')) {
        return true;
    }

    return typeof is_windows !== 'undefined' && is_windows;
}

global.sortByKeys = (object, reverse) => {
    const keys = Object.keys(object);

    let sortedKeys = _.sortBy(keys);

    if(reverse) {
        sortedKeys = sortedKeys.reverse();
    }

    return _.fromPairs(
        _.map(sortedKeys, key => [key, object[key]])
    )
};

global.joinPaths = function() {
    let args = [];

    for (let i = 0; i < arguments.length; i++) {
        let arg = arguments[i] + '';

        if(!arg) {
            continue;
        }

        if(typeof arg === 'number') {
            arg = arg.toString();
        }

        args.push(arg);
    }

    let check_http = false;

    for(let arg of args) {
        if(arg.startsWith('https://') || arg.startsWith('http://')) {
            check_http = true;
        }
    }

    let slash = '/';

    if(process.platform.startsWith('win') && !check_http) {
        slash = '\\';
    }

    return args.map((part, i) => {
        let re;

        if (i === 0) {
            re = new RegExp(`[\\${slash}]*$`, 'g');

        } else {
            re = new RegExp(`(^[\\${slash}]*|[\\/]*$)`, 'g');
        }

        return part.trim().replace(re, '');
    }).filter(x=>x.length).join(slash)
};

global.getAppDir = function () {
    let app_dir_name = process.env.FOLDER_NAME || packageSettings.folderName;

    return joinPaths(os.homedir(), 'Pictures', app_dir_name);
};

global.getAppDataDir = function () {
    return new Promise(async (resolve, reject) => {
        try {
            let app_dir = await getAppDir();

            resolve(joinPaths(app_dir, 'data'));
        } catch (e) {
            return reject();
        }
    });
};

global.getAppLogDir = function () {
    return new Promise(async (resolve, reject) => {
        try {
            let app_dir = await getAppDir();

            resolve(joinPaths(app_dir, 'logs'));
        } catch (e) {
            return reject();
        }
    });
};

global.getLocalFile = function(dir, filename, json) {
    return new Promise((resolve, reject) => {
        let read_path = path.join(dir, filename);

        fs.readFile(read_path, 'utf8', function (err, data) {
            if(err) {
                return reject(err);
            }

            if(json) {
                if(!data) {
                    data = {};
                } else {
                    data = JSON.parse(data);
                }
            }

            return resolve(data);
        });
    });
};

global.saveObjToDisk = function(data, filename) {
    return new Promise(async (resolve, reject) => {
        let app_dir;

        let str = JSON.stringify(data);

        try {
            app_dir = await getAppDataDir();
        } catch (e) {
            debugL.error(e);
        }

        try {
            await writeFileDirPath(app_dir, filename, str);
            resolve();
        } catch (e) {
            debugL.error(e);
            reject();
        }
    });
};

global.oneFileWriteOnly = function(key) {
    return new Promise((resolve, reject) => {
        if(!(key in writeKeys) || writeKeys[key] === false) {
            writeKeys[key] = true;

            return resolve();
        } else {
            function f(attempt) {
                setTimeout(function () {
                    if(attempt > 100) {
                        return reject();
                    }

                    if(writeKeys[key] === false) {
                        writeKeys[key] = true;
                        return resolve();
                    }

                    f(attempt + 1);

                }, 100);
            }

            f(0);
        }
    });
};

global.writeFileDirPath = function(dir, filename, data, force_write) {
    return new Promise(async(resolve, reject) =>  {
        let output_path;

        try {
           output_path = path.join(dir, filename);
        } catch(e) {
            debugL.error(e);
            return reject();
        }

        try {
            await oneFileWriteOnly(output_path);
        } catch (e) {
            debugL.error(e);
        }

        if(typeof data === 'object') {
            data = JSON.stringify(data);
        }

        if(typeof appL !== 'undefined' && appL.restart_ip && !force_write) {
            devConsole({
                "Insert DB prevented": joinPaths(dir, filename)
            });

            return reject();
        }

        writeFileAtomic(output_path, data, {}, function (err) {
            if(err) {
                debugL.error(err);
                writeKeys[output_path] = false;
                return reject(err);
            }

            writeKeys[output_path] = false;

            return resolve();
        });
    });
};

global.mdp = function(name) {
    console.time(name);
};

global.writeFileTo = function(to, data) {
    return new Promise(async (resolve, reject) => {

        if(typeof appL !== 'undefined' && appL.restart_ip) {
            devConsole({
                "Insert DB prevented": to
            });

            return reject();
        }

        writeFileAtomic(to, data, {}, function (err) {
            if(err) {
                debugL.error(err);
                return reject(err);
            }

            return resolve();
        });
    });
};

global.mdpe = function(name) {
    console.timeEnd(name);
};

global.timeNow = function(ms) {
    if(ms) {
        return Date.now();
    }

    return Number.parseInt(Date.now() / 1000);
};

global.isImage = function (ext) {
    if(!ext) {
        return false;
    }

    ext = ext.toLowerCase();

    return image_ext.indexOf(ext) > -1;
};


global.isValidExt = function (ext) {
    if(!ext) {
        return false;
    }

    ext = ext.toLowerCase();

    return isImage(ext);
};

global.getExt = function (file, lower) {
    let ext = pathL.extname(file).substring(1);

    if(lower) {
        return ext.toLowerCase();
    }

    return ext;
};

global.isFileF = function (p) {
    return new Promise((resolve, reject) => {
        fs.lstat(p, (err, stats) => {

            if(err) {
                debugL.error(err); //Handle error
                return reject(err);
            }

            return resolve(stats.isFile());
        });
    });
};

global.getExtFromFileName = function(filename) {
    let re = /(?:\.([^.]+))?$/;
    return re.exec(filename)[1];
}

global.isDirF = function(p) {
    return new Promise((resolve, reject) => {
        fs.lstat(p, (err, stats) => {

            if(err) {
                debugL.error(err); //Handle error
                return reject(err);
            }

            return resolve(stats.isDirectory());
        });
    });
}

global.statPath = function(p) {
    return new Promise((resolve, reject) =>  {
        fs.stat(p, function (err, stats) {
            if(err) {
                return reject(err);
            }

            resolve(stats);
        });
    });
};

global.listFilesDir = function(dir) {
    return new Promise(async (resolve, reject) => {
        let exists;

        try {
            exists = await checkIfPathExists(dir);

            if(!exists) {
                return resolve([]);
            }
        } catch (e) {
            return reject(e);
        }

        fs.readdir(dir, function (err, filesData) {
            //handling error
            if (err) {
                if(exists) {
                    return resolve([]);
                }
                debugL.error('Unable to scan directory: ' + err);
                return reject(err);
            }

            resolve(filesData);
        });
    });
};

global.checkIfPathExists = function(p) {
    return new Promise((resolve, reject) => {
        fs.exists(p, function (exists) {
            let bool = exists ? true : false;

            return resolve(bool);
        });
    });
}

global.getBuildDir = function () {
    return joinPaths(getOriginalDirName(), 'build');
};

global.getOsDir = function() {
    let os_str;

    if(is_mac) {
        os_str = 'mac';
    }  else if(getIsWindows()) {
        os_str = 'win';
    }

    return pathL.join(getBuildDir(), os_str);
};

global.getBinDir = function () {
    let os_str;

    if(is_mac) {
        os_str = 'mac';
    }  else if(getIsWindows()) {
        os_str = 'win';
    }

    return joinPaths(getRepoRoot(), 'backend', 'bin', os_str);
};

global.getGM = function () {
    let slash;
    let gm = require('gm');

    if(is_mac) {
        slash = '/';
    }  else if(getIsWindows()) {
        slash = '\\';
    }

    let bin_dir = getBinDir();

    process.env.MAGICK_HOME = bin_dir;
    // process.env.DYLD_LIBRARY_PATH = getLibDir();
    process.env.DYLD_FALLBACK_LIBRARY_PATH = joinPaths(bin_dir, 'lib');
    process.env.MAGICK_TIME_LIMIT = 30;
    // gm.prototype._options.nativeAutoOrient = true;
    return gm.subClass({
        appPath: bin_dir + slash,
        nativeAutoOrient: true
        // imageMagick: true
    });
};

global.getMD5 = function (p) {
    return new Promise(async (resolve, reject) => {
        if(is_mac) {
            let md5 = joinPaths(getBinDir(), 'md5');

            exec(`"${md5}" "${p}"`, (err, stdout, stderr) => {
                if(err) {
                    debugL.error(err);
                }
                stdout = stdout.replace('\n', '');
                let match = stdout.match(/[^ ]*$/);
                if(match && match.length) {
                    resolve(match[0]);
                } else {
                    resolve(null);
                }
            });
        } else if(is_windows) {
            let cmd = `CertUtil -hashfile "${p}" MD5`;

            exec(cmd, function (err, stdout, stderr) {
                if(stderr) {
                    resolve(null);
                } else {
                    let split = stdout.split('\n');

                    if(split && split.length > 1) {
                        let replace_re = /[^A-Za-z0-9]+/g;

                        return resolve(split[1].replace(replace_re, ''));
                    } else {
                        return resolve(null);
                    }
                }
            });
        }
    });
};

global.getContentType = function (content_type) {
    try {
        content_type = content_type.toLowerCase();
    } catch(e) {
        return null;
    }

    if(content_type.indexOf('.jpg') > -1) {
        return 'image/jpeg';
    }

    if(content_type.indexOf('.jpeg') > -1) {
        return 'image/jpeg';
    }

    if(content_type.indexOf('.png') > -1) {
        return 'image/png';
    }

    if(content_type.indexOf('.tif') > -1) {
        return 'image/tiff';
    }

    return null;
};


global.runExec = function(cmd) {
    return new Promise(async (resolve, reject) =>  {
        exec(cmd, (err, stdout, stderr) => {
            if (err) {
                //some err occurred
                if(typeof debugL !== 'undefined') {
                    debugL.error(err);
                } else {
                    console.error(err);
                }

                reject(err);
            } else {
                resolve(stdout);
            }
        });
    });
}

global.getExifMetadata = function(file) {
    return new Promise(async (resolve, reject) =>  {
        resolve._file = file;
        filesL.exifResolveMap[file] = resolve;
        require('../server/files').writeExifIn(file);
    });
}

global.getDate = function(fileObj) {
    return new Promise(async (resolve, reject) =>  {
        let metadatas;
        let dates = {};

        try {
            metadatas = await getExifMetadata(fileObj.file);
            metadatas = metadatas.split('\n');
        } catch (e) {
            debugL.error(e);
        }

        try {
            let metadata_tags = {
                '1A': 'ExifIFD:DateTimeOriginal',
                '1B': 'Keys:CreationDate',
                '1C': 'QuickTime:CreateDate',
                '2A': 'ExifIFD:CreateDate',
                '2B': 'H264:DateTimeOriginal',
                '3A': 'Composite:SubSecCreateDate',
                '4A': 'IPTC:DateCreated',
                '5A': 'IFD0:ModifyDate',
                '5B': 'System:FileModifyDate'
            };

            for (let tag_priority in metadata_tags) {
                let tag_name = metadata_tags[tag_priority];
                let value = getMetadataTagValue(metadatas, tag_name);

                let date_obj;

                try {
                    date_obj = getDateObj(value);
                } catch (e) {
                    continue;
                }

                if(!date_obj) {
                    continue;
                }

                value = getDateStrFroObj(date_obj);

                if(value && !(['0000:00:00 00:00:00', '0000-00-00 00:00:00'].includes(value))) {
                    dates[tag_priority] = value;
                }
            }
        } catch (e) {
            debugL.error(e);
            return resolve(new Date().toMysqlFormat());
        }

        //date from filename
        let file_date_name_check = dateFromName(fileObj.file);

        if(file_date_name_check) {
            dates['3A2'] = file_date_name_check;
        }

        if(!Object.keys(dates).length) {
            return resolve(new Date().toMysqlFormat());
        } else {
            dates = sortByKeys(dates);

            let date = null;

            for (let k in dates) {
                date = dates[k];
                break;
            }

            return resolve(date);
        }
    });
};

global.getOrient = function(file) {
    return new Promise(async (resolve, reject) => {
        let orient = {
            rotate: null,
            flip: null
        };

        try {
            let metadatas = await getExifMetadata(file);
            metadatas = metadatas.split('\n');
            let value = getMetadataTagValue(metadatas, 'IFD0:Orientation');

            if(value) {
                value = Number.parseInt(value);

                switch (value) {
                    case 2:
                        orient.flip = 'h';
                        break;
                    case 3:
                        orient.rotate = -180;
                        break;
                    case 4:
                        orient.flip = 'v';
                        break;
                    case 5:
                        orient.flip = 'h';
                        orient.rotate = 90;
                        break;
                    case 6:
                        orient.rotate = 90;
                        break;
                    case 7:
                        orient.flip = 'h';
                        orient.rotate = -90;
                        break;
                    case 8:
                        orient.rotate = -90;
                        break;
                }
            }

            return resolve(orient);
        } catch (e) {

        }

        return resolve(orient);
    });
};

global.removeWhiteSpaceBeginning = function(str) {
    if(!str) return str;
    return str.replace(/^\s+/g, '');
};


global.getMetadataTagValue = function(metadatas, tag_name) {
    if(typeof metadatas === 'string') {
        metadatas = metadatas.split('\n');
    }

    let value = null;
    let regex = new RegExp(`<${tag_name}>(.*)<\/${tag_name}>`);

    for (let k in metadatas) {
        let metadata = metadatas[k];

        metadata = removeWhiteSpaceBeginning(metadata);

        if(metadata[0] !== '<') {
            continue;
        }

        let matches = metadata.match(regex);

        if(matches && matches.length) {
            value = matches[1];
            break;
        }

    }

    return value;
}

function dateFromName(name) {
    let date_time_regex = '/([0-9]{4})-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])(?:-(0[0-9]|1[0-9]|2[0-3])-(0[0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])-(0[0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9]))?/';

    let year = null;
    let month = null;
    let day = null;
    let hour = 0;
    let minute = 0;
    let second = 0;

    try {
        let matches = name.match(date_time_regex);

        if(matches) {
            try {
                year = matches[1];
            } catch (e) {

            }

            try {
                month = matches[2];
            } catch (e) {

            }

            try {
                day = matches[3];
            } catch (e) {

            }

            try {
                hour = matches[4];
            } catch (e) {

            }

            try {
                minute = matches[5];
            } catch (e) {

            }

            try {
                second = matches[6];
            } catch (e) {

            }

            if(year && month && day)
            {
                return `${year}-${month}-${day} ${hour}:${minute}:${second};`
            }
        }
    } catch (e) {
        return null;
    }
}

global.makeDirectory = function(d) {
    return new Promise(async (resolve, reject) => {
        fs.mkdir(d, function (err) {
            if(err) {
                return reject(err);
            }

            resolve();
        });
    });
}

global.createDirectoryIfNotExistsRecursive = function(dirname) {
    return new Promise(async (resolve, reject) => {
        let slash = '/';
        let directories_backwards = [dirname];
        let minimize_dir = dirname;
        let directories_needed = [];
        let directories_forwards = [];

        // backward slashes for windows
        if(getIsWindows()) {
            slash = '\\';
        }

        while (minimize_dir = minimize_dir.substring(0, minimize_dir.lastIndexOf(slash))) {
            directories_backwards.push(minimize_dir);
        }

        //stop on first directory found
        for(const d in directories_backwards) {
            let dir = directories_backwards[d];
            let exists = await checkIfPathExists(dir);
            if(!exists) {
                directories_needed.push(dir);
            } else {
                break;
            }
        }

        //no directories missing
        if(!directories_needed.length) {
            return resolve();
        }

        // make all directories in ascending order
        directories_forwards = directories_needed.reverse();

        for(const d in directories_forwards) {
            try {
                let dir = directories_forwards[d];

                try {
                    await makeDirectory(dir);
                } catch (e) {
                    debugL.error(e);
                }
            } catch(e) {
                if(typeof debugL !== 'undefined') {
                    debugL.error(e);
                } else {
                    console.error(e);
                }
            }
        }

        return resolve();
    });
};

global.getFileSize = function (i) {
    return new Promise(async (resolve, reject) => {
        fsL.stat(i, function(err, stat) {
            if(err) {
                return reject(err);
            }

            return resolve(stat.size);
        });
    });
};

global.getExif = function() {
    let exif = pathL.join(getBinDir(), 'exiftool');

    if(getIsWindows()) {
        exif += '.exe';
    }

    return exif;
}


global.formatNumberLength = function(num, length) {
    let r = "" + num;

    while (r.length < length) {
        r = "0" + r;
    }
    return r;
};

global.initPartition = function(schema, number) {
    return {
        partition_number: number,
        partition_name: `${schema}-${formatNumberLength(number, 5)}`,
        min_id: null,
        max_id: null,
        size: 0
    };
};

global.insertPartitionSingle = function(table_name, insert) {
    return new Promise(async (resolve, reject) => {
        let partition_limit = dbL.limit;

        let partitions =  dbL.partition[table_name].partitions;
        if(!partitions.length) {
            partitions.push(initPartition(dbL.partition[table_name].schema_name, 0));
        }

        let partition_index = partitions.length - 1;

        if(!(partition_index in dbL.partitions[table_name])) {
            dbL.partitions[table_name][partition_index] = {};
        }

        let schema_key_name = dbL.partition[table_name].id_key;

        let partitions_changed = [];

        for (let k in insert) {
            let item = insert[k];

            if(partitions[partition_index].size >= partition_limit) {
                partitions.push(initPartition(table_name, partitions.length));
                partition_index = partitions.length - 1;
                dbL.partitions[table_name][partition_index] = {};
            }

            if(partitions[partition_index].min_id === null) {
                partitions[partition_index].min_id = item[schema_key_name];
            }

            partitions[partition_index].max_id = item[schema_key_name];
            partitions[partition_index].size++;

            dbL.partitions[table_name][partition_index][item[schema_key_name]] = item;

            if(partitions_changed.indexOf(partition_index) === -1) {
                partitions_changed.push(partition_index);
            }

        }

        //save data
        for(const pc in partitions_changed) {
            let changed_partition_index = partitions_changed[pc];
            let partition_id = formatNumberLength(changed_partition_index, 5);
            let filename = `${table_name}-${partition_id}`;

            try {
                await dbL.saveData(filename, dbL.partitions[table_name][changed_partition_index]);
            } catch (e) {
                debugL.error(e);
            }
        }

        resolve();
    });
};

global.insertPartitionMulti = function(table_name, insert, variant_logic) {
    return new Promise(async (resolve, reject) => {
        let partition_limit = dbL.limit;

        let partitions = dbL.partition[table_name].partitions;

        if (!partitions.length) {
            partitions.push(initPartition(dbL.partition[table_name].schema_name, 0));
        }

        let partition_index = partitions.length - 1;

        if(!(partition_index in dbL.partitions[table_name])) {
            dbL.partitions[table_name][partition_index] = {};
        }

        let schema_key_name = dbL.partition[table_name].id_key;
        let schema_key_name2 = dbL.partition[table_name].id_key2;

        let partitions_changed = [];

        for (let k in insert) {
            let item = insert[k];
            let item_id = item[schema_key_name];

            if (item_id <= dbL.partition[table_name].last_id) {
                for (let k2 in partitions) {
                    let partition = partitions[k2];
                    if (item_id >= partition.min_id && item_id <= partition.max_id) {
                        partition_index = k2;
                        break;
                    }
                }
            } else {
                if (partitions[partitions.length - 1].size >= partition_limit) {
                    partitions.push(initPartition(table_name, partitions.length));
                    dbL.partitions[table_name][partitions.length - 1] = {};
                }

                partition_index = partitions.length - 1;
            }

            if (item_id <= partitions[partition_index].min_id || partitions[partition_index].min_id === null) {
                partitions[partition_index].min_id = item_id;
            }

            if (item_id > partitions[partition_index].max_id || partitions[partition_index].max_id === null) {
                partitions[partition_index].max_id = item_id;
            }

            if (!(item[schema_key_name] in dbL.partitions[table_name][partition_index])) {
                dbL.partitions[table_name][partition_index][item_id] = {};
            }

            if (variant_logic) {
                if (!(item_id in dbL.partitions[table_name][partition_index])) {
                    dbL.partitions[table_name][partition_index][item_id] = {};
                }

                if (item.variant_type.indexOf('hls_segment') > -1) {
                    if (!(item.variant_type in dbL.partitions[table_name][partition_index][item_id])) {
                        dbL.partitions[table_name][partition_index][item_id][item.variant_type] = {};
                    }

                    dbL.partitions[table_name][partition_index][item_id][item.variant_type][item.segment_number] = item;
                } else {
                    dbL.partitions[table_name][partition_index][item_id][item.variant_type] = item;
                }
            } else {
                dbL.partitions[table_name][partition_index][item_id][item[schema_key_name2]] = item;
            }

            partitions[partition_index].size++;

            if (item_id > dbL.partition[table_name].last_id) {
                dbL.partition[table_name].last_id = item_id;
            }

            if (partitions_changed.indexOf(partition_index) === -1) {
                partitions_changed.push(partition_index);
            }
        }

        //save data
        for(const pc in partitions_changed) {
            let changed_partition_index = partitions_changed[pc];
            let partition_id = formatNumberLength(changed_partition_index, 5);
            let filename = `${table_name}-${partition_id}`;

            try {
                await dbL.saveData(filename, dbL.partitions[table_name][changed_partition_index]);
            } catch (e) {
                debugL.error(e);
            }
        }

        resolve();

    });
};

function partitionExists(table_name, partition_index) {
    let max_checks = 1000;

    let current_check = 0;

    return new Promise(async (resolve, reject) => {
        function f() {
            if(table_name in dbL.partitions && partition_index in dbL.partitions[table_name]) {
                clearInterval(_int);

                resolve();
            } else {
                current_check++;
            }

            if(current_check > max_checks) {
                clearInterval(_int);
                return reject();
            }
        }

        let _int = setInterval(f, 10);

        f();
    });

}

global.updatePartitionSingle = function(table_name, update) {
    return new Promise(async (resolve, reject) => {
        if(!Array.isArray(update)) {
            update = [update];
        }

        let partitions =  dbL.partition[table_name].partitions;
        let schema_key_name = dbL.partition[table_name].id_key;
        let partition_index = null;

        let partitions_changed = [];

        for(let update_item of update) {
            let item = null;

            if(update_item[schema_key_name]) {
                item = update_item;
            } else {
                // finishPartitionProcess('update', table_name, this_int);
                debugL.error("Could not find update id");
                return reject();
            }

            let item_id = item[schema_key_name];

            for(let k in partitions) {
                let partition = partitions[k];
                if(item_id >= partition.min_id && item_id <= partition.max_id) {
                    partition_index = k;
                    break;
                }
            }

            for(let k in update_item) {
                let v = update_item[k];
                if(k in item && item[k] !== v) {
                    item[k] = v;
                }
            }

            try {
                let exists = dbL.partitions[table_name][partition_index];
                if(!exists) {
                    try {
                        await partitionExists(table_name, partition_index);
                    } catch (e) {
                        return reject(e);
                    }
                }

                dbL.partitions[table_name][partition_index][item[schema_key_name]] = item;
            } catch (e) {
                debugL.error(e);
                return reject(e);
            }

            if(partitions_changed.indexOf(partition_index) === -1) {
                partitions_changed.push(partition_index);
            }
        }

        try {
            await savePartitions(table_name, partitions_changed);
        } catch (e) {
            return reject();
        }

        resolve();
    });
};

global.updatePartitionsMulti = function(table_name, update) {
    return new Promise(async (resolve, reject) => {
        if(!Array.isArray(update)) {
            update = [update];
        }

        let partitions = dbL.partition[table_name].partitions;
        let schema_key_name = dbL.partition[table_name].id_key;
        let schema_key_name2 = dbL.partition[table_name].id_key2;
        let partition_index = null;

        let partitions_changed = [];

        for(let item of update) {
            let item_id = item[schema_key_name];

            for(let k in partitions) {
                let partition = partitions[k];

                if(item_id >= partition.min_id && item_id <= partition.max_id) {
                    partition_index = k;
                    break;
                }
            }
            try {
                dbL.partitions[table_name][partition_index][item[schema_key_name]][item[schema_key_name2]] = item;

                if(partitions_changed.indexOf(partition_index) === -1) {
                    partitions_changed.push(partition_index);
                }
            } catch (e) {
                console.error(e);
            }

        }

        try {
            await savePartitions(table_name, partitions_changed);
        } catch (e) {
            return reject();
        }

        resolve();
    });
};

global.updateVariantPartitions = function(table_name, update) {
    return new Promise(async (resolve, reject) => {
        if(!Array.isArray(update)) {
            update = [update];
        }

        let partitions = dbL.partition[table_name].partitions;
        let schema_key_name = dbL.partition[table_name].id_key;
        let partition_index = null;

        let partitions_changed = [];

        for(let item of update) {
            let item_id = item[schema_key_name];

            for(let k in partitions) {
                let partition = partitions[k];

                if(item_id >= partition.min_id && item_id <= partition.max_id) {
                    partition_index = k;
                    break;
                }
            }

            if(partitions_changed.indexOf(partition_index) === -1) {
                partitions_changed.push(partition_index);
            }
        }

        try {
            await savePartitions(table_name, partitions_changed);
        } catch (e) {
            return reject();
        }

        resolve();
    });
};

global.savePartitions = function(table_name, partitions_changed) {
    return new Promise(async (resolve, reject) => {
        //save data
        for(const pc in partitions_changed) {
            let changed_partition_index = partitions_changed[pc];
            let partition_id = formatNumberLength(changed_partition_index, 5);
            let filename = `${table_name}-${partition_id}`;

            try {
                await dbL.saveData(filename, dbL.partitions[table_name][changed_partition_index]);
            } catch (e) {
                debugL.error(e);
                reject();
                break;
            }
        }

        resolve();
    });
}

global.deleteAllFilesInDir = function(dir, reset) {
    return new Promise((resolve, reject) => {
        fsL.readdir(dir, async function (err, files) {
            //handling error
            if (err) {
                debugL.error(err);
                return resolve();
            }

            debugL.log("Deleting all files in dir: " + dir);

            //listing all files using forEach

            for(const index in files) {
                let file = files[index];
                let file_path = pathL.join(dir, file);
                let stats = await statPath(file_path);

                if(stats.isFile()) {
                    try {
                        await deleteFilePath(file_path);
                    } catch (e) {
                        debugL.error(e);
                    }
                } else if (stats.isDirectory()) {
                    try {
                        if(reset && dir === 'latest') {
                            continue;
                        }

                        await deleteAllFilesInDir(file_path);
                    } catch (e) {

                    }
                }
            }

            debugL.log("Files deleted");

            resolve();
        });
    });
};

global.deleteFilePath = function(filePath) {
    return new Promise((resolve, reject) => {
        fs.unlink(filePath, function (err, success) {
            if(err) {
                debugL.error("error deleting file", err);
                resolve();
            } else {
                resolve();
            }
        })
    });
};

global.removeDir = function(dir) {
    function rmDir(p) {
        return new Promise(async (resolve, reject) => {
            fs.rmdir(p, function (err) {
                if(err) {
                    return reject(err);
                }

                resolve();
            });
        });
    }

    function rimraf(dir_path) {
        return new Promise(async (resolve, reject) => {
            let entries;

            try {

                let exists = await checkIfPathExists(dir_path);

                if(exists) {
                    try {
                        entries = await listFilesDir(dir_path);
                    } catch (e) {
                        return reject(e);
                    }

                    for(let entry of entries) {
                        let stat;
                        let entry_path = pathL.join(dir_path, entry);

                        try {
                            stat = await statPath(entry_path);
                        } catch (e) {
                            return reject(e);
                        }

                        if (stat.isDirectory()) {
                            try {
                                await rimraf(entry_path);
                            } catch (e) {
                                return reject(e);
                            }
                        } else {
                            try {
                                await deleteFilePath(entry_path);
                            } catch (e) {
                                return reject(e);
                            }
                        }
                    }

                    try {
                        await rmDir(dir_path);
                    } catch (e) {
                        return reject(e);
                    }
                }
            } catch (e) {
                return reject(e);
            }

            resolve();
        });
    }

    return new Promise(async (resolve, reject) =>  {
        try {
            await rimraf(dir);
        } catch (e) {
            console.error(e);
        }

        resolve();
    });
};

global.formatDate = function (date) {
    let date_str = date.substring(0,10).replace(/:/g, '-');
    let time_str = date.substring(11, 19);

    return `${date_str} ${time_str}`;
};

global.getDateObj = function (date) {
    if(!date) {
        return null;
    }

    let obj = {
        year: null,
        month: null,
        day: null,
        hour: null,
        minute: null,
        second: null
    };

    let split = date.split(':');

    if(split.length > 5) {
        split[4] = split[4].split('-')[0];
    }

    obj.year = split[0];

    if(!Number.isFinite(Number.parseInt(obj.year)) || obj.year.length < 4) {
        return null;
    }

    obj.month = split[1];

    if(!Number.isFinite(Number.parseInt(obj.month))) {
        obj.month = '01';
    }

    let sp_2 = split[2].split(' ');

    obj.day = sp_2[0];

    if(!Number.isFinite(Number.parseInt(obj.day))) {
        obj.day = '01';
    }

    if(sp_2 && sp_2[1]) {
        obj.hour = sp_2[1];
    } else {
        obj.hour = '00';
    }

    if(split[3]) {
        obj.minute = split[3];
    } else {
        obj.minute = '00';
    }

    if(split[4]) {
        obj.second = split[4];
    } else {
        obj.second = '00';
    }

    return obj;
};

global.getDateStrFroObj = function (obj) {
    if(!obj) {
        return '';
    }

    return `${obj.year}-${obj.month}-${obj.day} ${obj.hour}:${obj.minute}:${obj.second}`;
};

global.ordinal_suffix_of = function(i) {
    let j = i % 10,
        k = i % 100;

    if (j == 1 && k != 11) {
        return i + "st";
    }

    if (j == 2 && k != 12) {
        return i + "nd";
    }

    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
};

global.getMasterDate = function(item) {
    if(item.master_item_date) {
        if(item.master_item_date === '0000-00-00 00:00:00') {
            item.master_item_date = null;
        }
    }

    return item.master_item_date ? item.master_item_date : item.date;
}

global.copyFile = function(from, to) {
    return new Promise(async (resolve, reject) => {
        fs.copyFile(from, to, function (err, data) {
            if(err) {
                return reject(err);
            }

            return resolve();
        })
    });
}

global.getDateTimeStr = function () {
    let date = new Date();

    return date.toISOString().slice(0, 10) + ' ' + date.toISOString().substring(11, 19);
}

global.timeoutAwait = function(f, t) {
    return new Promise((resolve, reject) => {
        setTimeout(function () {
            if(f) {
                f();
            }

            resolve();
        }, t);
    });
}

global.isObjectEmpty = function(obj) {
    for(let key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }

    return true;
}

global.humanMonthFromNumber = function(month, shorten) {
    month = Number.parseInt(month);

    if(!month) {
        return '';
    }

    let human_month;

    if(month === 1) {
        human_month = 'January';
    } else if(month === 2) {
        human_month = 'February';
    } else if(month === 3) {
        human_month = 'March';
    } else if (month === 4) {
        human_month = 'April';
    } else if(month === 5) {
        human_month = 'May';
    } else if(month === 6) {
        human_month = 'June';
    } else if(month === 7) {
        human_month = 'July'
    } else if(month === 8) {
        human_month = 'August'
    } else if(month === 9) {
        human_month = 'September'
    } else if(month === 10) {
        human_month = 'October'
    } else if(month === 11) {
        human_month = 'November'
    } else if(month === 12) {
        human_month = 'December'
    }

    if(shorten) {
        try {
            return human_month.substring(0, 3);
        } catch(e) {
            console.error(e);
        }

    }

    return human_month;
}

global.isFloat = function(n){
    return Number(n) === n && n % 1 !== 0;
}

global.sortDesc = function (arr) {
    arr.sort(function (a, b) {
        return b - a;
    });
}

global.sortAsc = function(arr) {
    arr.sort(function (a, b) {
        return a - b;
    });
}

global.removeArrItem = function(arr, item) {
    let index = arr.indexOf(item);

    if(index > -1) {
        arr.splice(index, 1);
    }
}

global.getWindowsPath = function (i, is_url, is_fs) {
    if(!i) {
        return null;
    }

    //only change url on windows
    if(!is_windows || i.startsWith('./')) {
        return i;
    }

    if(is_url) {
        i = i.replace(/\\/g, '/');

        let str = 'file://';

        if(!i.startsWith(str) && !i.startsWith('http')) {
            if(i.startsWith('/')) {
                i = str + i;
            } else {
                i = str + '/' + i;
            }
        }
    } else if(is_fs) {
        i = i.replace(/\//g, '\\');
    }

    return i;
}

global.getSlash = function () {
    return getIsWindows() ? '\\' : '/';
}

global.arrItemUnique = function(arr, item) {
    if(arr.indexOf(item) === -1) {
        arr.push(item);
    }
}

global.arrItemRemove = function(arr, item) {
    if(arr.indexOf(item) > -1) {
        arr.splice(arr.indexOf(item), 1);
    }
}

global.writePortToFile = function(portNum) {
    let file_path = joinPaths(getAppDir(), 'port');

    return new Promise(async (resolve, reject) => {
        try {
            await writeFileTo(file_path, portNum);
        } catch (e) {
            console.error(e);
        }

        return resolve();
    });
}

global.chunkArray = function(arr, num_chunks) {
    let chunkedArr = [];
    let chunkJob = {};

    if(arr.length < num_chunks) {
        num_chunks = arr.length;
    }

    //initialize chunks
    for(let c = 0; c < num_chunks; c++) {
        chunkedArr[c] = [];
        chunkJob[c] = 0;
    }

    let chunkArrayIndex = 0;

    for(let i = 0; i < arr.length; i++) {
        if(chunkArrayIndex >= num_chunks) {
            chunkArrayIndex = 0;
        }

        chunkJob[chunkArrayIndex]++;

        chunkArrayIndex++;
    }

    let itemIndex = 0;

    for(let c = 0; c < num_chunks; c++) {
        for(let i = 0; chunkJob[c] > 0; chunkJob[c]--) {
            chunkedArr[c].push(arr[itemIndex]);

            itemIndex++;
        }
    }


    return chunkedArr;
}

global.writeFile = function (filePath, buffer, cb) {
    return new Promise((resolve, reject) => {
        let fs = require('fs');

        fs.writeFile(filePath, buffer, function (err) {
            if(err) {
                console.error(err);
            }

            resolve();
        });
    });
}

global.iconDots = function () {
    return `
        <svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60.0835 60.074">
            <g>
                <path class="cls-1" d="M60.0835,30.0685c-.009,16.5838-13.5587,30.0472-30.1978,30.0054C13.4403,60.0326-.0089,46.501,0,30.0051.009,13.4221,13.5587-.0412,30.1976,0c16.4446.0408,29.8949,13.5732,29.8859,30.0684ZM18.7741,33.3691c1.9765.0297,3.5411-1.3899,3.5898-3.2571.0481-1.8434-1.5014-3.378-3.4402-3.4071-1.9755-.0297-3.5404,1.3904-3.5895,3.2573-.0485,1.8427,1.5015,3.3778,3.4399,3.4069ZM37.7197,29.8545c-.1114,1.7079,1.3329,3.3455,3.0862,3.4991,2.147.1882,3.8136-1.1363,3.9435-3.1339.1111-1.7085-1.3327-3.3455-3.0859-3.4992-2.1469-.1882-3.8134,1.1362-3.9437,3.134ZM33.3704,30.134c.0405-2.1678-1.1541-3.4162-3.2934-3.4232-2.077-.0067-3.2537.9867-3.3589,3.1056-.1081,2.1764,1.07,3.4841,3.1648,3.5487,2.1679.0669,3.4481-1.1191,3.4875-3.2311Z"/>
            </g>
        </svg>`;
}

global.iconCheck = function () {
    return `<svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 139.2847 94.4394"><g id="sHB9Y8.tif"><path d="M49.7167,82.3981c.7678-.7325,1.4327-1.3426,2.071-1.9793,19.7724-19.7226,39.5351-39.4548,59.3164-59.1685,6.415-6.3931,12.9029-12.7134,19.3082-19.1162,3.5137-3.5123,6.3898-2.188,8.1039.3763,1.1592,1.7341.964,3.4654-.2962,5.07-.5105.65-1.1227,1.223-1.7098,1.8099-27.4526,27.4444-54.9073,54.8867-82.3624,82.3286-3.596,3.5943-5.3965,3.6298-8.9402.0915-14.2933-14.2712-28.5688-28.5602-42.8676-42.8259-1.5338-1.5303-2.828-3.1143-2.1596-5.458,1.0476-3.6734,5.159-4.7037,8.0593-1.9681,3.0211,2.8496,5.9617,5.7853,8.9119,8.709,10.0342,9.9443,20.0553,19.9019,30.0882,29.8476.7597.7531,1.5729,1.4524,2.4769,2.2831Z"/></g></svg>`;
}

