//cached dirs
//dirs->recursive: deepest first
//omit dirs
//filesData->media types
//filesData filter
//regex filter
//items and variants schema
//md5s
//de-duplicate
//thumb generation
//update renderer
//process manage->breaker in loop on dir change
//save cache after processing of entire dir
//handle known paths

const EOL = require('os').EOL;

let packageSettings = require('../../package.json');

let folders_file = 'folders.json';
let files_file = 'files.json';
let files_notification_key = 'local-file-processing';

let bytes_threshold = 100 * 1000;
let dimThreshold = 400 * 400;

let exif_queue = [];
let exif_close_ip = false;
let exifP;

let batchSize = require('os').cpus().length / 2;

batchSize = Math.max(batchSize, 1);

let omit_dirs = [
    `iphoto${getSlash()}thumbnails${getSlash()}`,
    `iphoto${getSlash()}previews${getSlash()}`,
    `iphoto${getSlash()}resources${getSlash()}`,
    `iphoto library${getSlash()}data`,
    `.aplibrary${getSlash()}previews${getSlash()}`,
    `.aplibrary${getSlash()}resources${getSlash()}`,
    `.aplibrary${getSlash()}thumbnails${getSlash()}`,
    `.photoslibrary${getSlash()}previews${getSlash()}`,
    `.photoslibrary${getSlash()}resources${getSlash()}`,
    `.photoslibrary${getSlash()}thumbnails${getSlash()}`,
    `imovie cache`,
    `imovie thumbnails`,
    `${getSlash()}$recycle.bin`,
    getAppDir(),
    `${packageSettings.folderName}`,
    `${packageSettings.name}.app/Contents/Resources`
];

let omit_libraries = {
    iphoto: {
        dir_string: 'iphoto',
        omit_dirs: [
            'Attachments',
            'Auto Import',
            'Contents',
            'Database',
            'iLifeShared',
            'iPod Photo Cache',
            'Previews',
            'Resources',
            'Thumbnails'
        ],
        include_dirs: [
            'Masters',
            'Originals'
        ]
    }
};

let filesData = {
    ip: false, //in process
    restart: false,
    dirs: null, // selected, cache
    tmpCache: {},
    files: null
};

function getInProgress() {
    return filesData.ip;
}

function saveProcessedDir(dir, timestamp) {
    return new Promise(async(resolve, reject) =>  {
        if(!dir) {
            return reject("No directory");
        }

        dir = dir.toLowerCase();

        filesData.dirs.cache[dir] = timestamp;

        delete filesData.tmpCache[dir];

        try {
            await saveFolders();
            resolve();
        } catch(e) {
            debugL.error(e);
            reject(e);
        }
    });
}

function saveProcessedDirs() {
    return new Promise(async(resolve, reject) =>  {
        for (let k in filesData.tmpCache) {
            let d = filesData[k];

            if(!d) {
                continue;
            }

            try {
                filesData.dirs.cache[k.toLowerCase()] = d.timestamp;
                delete filesData.tmpCache[k];
            } catch(e) {
                console.error(e);
            }
        }

        try {
            await saveFolders();
            resolve();
        } catch(e) {
            debugL.error(e);
            reject();
        }
    });
}

function getMediaData(file) {
    return new Promise(async(resolve, reject) =>  {
        let metadata;

        let swap_w_h_angles = [90, 270, -90, -270];
        let data = {
            width: null,
            height: null,
            duration: null,
            rotate: null,
            flip: null
        };

        try {
            try {
                metadata = await getImageMetadata(file.file);
            } catch (e) {
                debugL.error(e);
            }

            data.rotate = metadata.rotate;
            data.flip = metadata.flip;

            if(data.rotate && swap_w_h_angles.indexOf(data.rotate) > -1) {
                data.width = metadata.height;
                data.height = metadata.width;
            } else {
                data.width = metadata.width;
                data.height = metadata.height;
            }

            resolve(data);
        } catch (e) {
            return reject(e);
        }
    });
}

function dirHasParent(dir_key) {
    let has_parent = false;

    for(let dk in filesData.dirs.selected) {

        if(dk !== dir_key && dir_key.length > dk.length) {
            let parents = [];

            let parent = dir_key;

            while (pathL.dirname(parent).length && parent !== '/' && !parent.match(/^[a-zA-Z]:\\$/)) {
                parent = pathL.dirname(parent);
                parents.push(parent);
            }

            for(let par of parents) {
                if(par in filesData.dirs.selected) {
                    has_parent = true;
                }
            }
        }
    }

    return has_parent;
}

function getImageMetadata(file_path) {
    return new Promise(async(resolve, reject) =>  {
        let metadata = {
            width: null,
            height: null,
            rotate: null,
            flip: null
        };

        try {
            let metadatas = await getExifMetadata(file_path);
            metadatas = metadatas.split('\n');
            metadata.width = Number.parseInt(getMetadataTagValue(metadatas, 'File:ImageWidth'));

            if(Number.isNaN(metadata.width) && file_path.toLowerCase().endsWith('png')) {
                metadata.width = Number.parseInt(getMetadataTagValue(metadatas, 'PNG:ImageWidth'));
            }

            metadata.height = Number.parseInt(getMetadataTagValue(metadatas, 'File:ImageHeight'));

            if(Number.isNaN(metadata.height) && file_path.endsWith('png')) {
                metadata.height = Number.parseInt(getMetadataTagValue(metadatas, 'PNG:ImageHeight'));
            }

            let orientation = getMetadataTagValue(metadatas, 'IFD0:Orientation');

            if(orientation) {
                orientation = Number.parseInt(orientation);
                switch (orientation) {
                    case 2:
                        metadata.flip = 'h';
                        break;
                    case 3:
                        metadata.rotate = -180;
                        break;
                    case 4:
                        metadata.flip = 'v';
                        break;
                    case 5:
                        metadata.flip = 'h';
                        metadata.rotate = 90;
                        break;
                    case 6:
                        metadata.rotate = 90;
                        break;
                    case 7:
                        metadata.flip = 'h';
                        metadata.rotate = -90;
                        break;
                    case 8:
                        metadata.rotate = -90;
                        break;
                }
            }

            return resolve(metadata);
        } catch (e) {
        }

        return resolve(metadata);
    });
}

function throwIfRestartProcess() {
    if(filesData.restart) {
        appL.deleteNotification(files_notification_key);

        filesData.ip = false;
        throw "Restart";
    }
}

function isAppRegex(file) {
    let is_app = false;

    let purefile = pathL.parse(file).name;
    
    purefile = purefile.toLowerCase();

    let variants = [
        imageL.variants.thumb, imageL.variants.device
    ];

    for(let k in variants) {
        let v = variants[k];
        
        if(purefile.endsWith('_' + v)) {
            is_app = true;
            break;
        }
    }

    return is_app;
}

function isValidFile(file) {
    if(!isValidExt(getExt(file))) {
        return false;
    }

    return !isAppRegex(file);
}

function excludeDir(dir) {
    let exclude = false;

    dir = dir.toLowerCase();

    //level 1 omitting
    for(let omit_dir of omit_dirs) {
        if(is_windows) {
            omit_dir = omit_dir.replace('/', '\\');
        }

        omit_dir = omit_dir.toLowerCase();

        if(dir.indexOf(omit_dir) > -1) {
            exclude = true;
            break;
        }
    }

    //level 2 omitting with library specific logic
    if(!exclude) {
        for(let lib_key in omit_libraries) {
            let library_data = omit_libraries[lib_key];
            let lib_dir_string = library_data.dir_string.toLowerCase();

            //do not exclude if not subdir
            let parent_dirname = pathL.dirname(dir).toLowerCase();

            if(!dir.includes(lib_dir_string) || !parent_dirname.includes(lib_dir_string)) {
                break;
            }

            exclude = true;
            
            let lib_include_dirs = library_data.include_dirs;

            for(let lid of lib_include_dirs) {
                lid = lid.toLowerCase();

                if(dir.includes(lid)) {
                    exclude = false;
                    break;
                }
            }
        }
    }

    return exclude;
}

function isSizeValid(file_obj) {
    return new Promise(async(resolve, reject) =>  {
        if(file_obj.bytes > bytes_threshold) {
            return resolve(true);
        }

        if(file_obj.metadata.width * file_obj.metadata.height > dimThreshold) {
            resolve(true);
        } else {
            resolve(false);
        }
    });
}

function prepareDir(dir) {
    function doDir(d) {
        return new Promise(async (resolve, reject) => {
            let list;

            let currentDK = d.toLowerCase();

            try {
                list = await listFilesDir(d);
            } catch (e) {
                console.error(e);
                return reject(e);
            }

            list = list.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));

            filesData.tmpCache[currentDK] = {
                timestamp: null,
                files: [],
                dir: d
            };

            for(let i = 0; i < list.length; i++) {
                let stat;

                let file = list[i];

                file = pathL.resolve(d, file);

                try {
                    stat = await statPath(file);
                } catch (e) {
                    console.error(e);
                    return reject(e);
                }

                if (stat && stat.isDirectory()) {
                    try {
                        throwIfRestartProcess();
                    } catch (e) {
                        return resolve(processFolders);
                    }

                    let dk = file.toLowerCase();

                    let mtime = stat.mtime.getTime();

                    let cacheTime = filesData.dirs.cache[dk];

                    if(dk in filesData.dirs.cache && mtime <= cacheTime || excludeDir(dk)) {
                        //do nothing
                    } else {
                        //do dir
                        try {
                            await doDir(file);
                        } catch (e) {
                            return reject(e);
                        }
                    }
                } else {
                    if(isValidFile(file)) {
                        //do not add if ends in face#.jpg
                        
                        if(file.includes('face')) {
                            let face_re = /_face[0-9]*\.jpg$/;
                            let match = file.match(face_re);

                            if(match && match.length) {
                                continue;
                            }
                        }

                        filesData.tmpCache[currentDK].files.push({
                            file: file,
                            ctime: stat.ctime.getTime(),
                            bytes: stat.size
                        });
                    }
                }
            }

            filesData.tmpCache[currentDK].timestamp = timeNow(true);

            return resolve(null);
        });
    }

    return new Promise(async(resolve, reject) =>  {
        try {
            await doDir(dir);
        } catch (e) {
            return reject(e);
        }

        resolve();
    });
}

function getThumbName() {
    return imageL.variants.thumb;
}

function getFilesDataTmp() {
    let total = 0;

    for(let k in filesData.tmpCache) {
        let dir = filesData.tmpCache[k];

        let files = dir.files;

        total += files.length;
    }

    return total;
}

async function processFolders() {
    function processFile(file) {
        return new Promise(async (resolve, reject) => {
            try {
                loop_file_number++;

                let mediaData, size_valid, item_data, item_variant_data, set_delete = false;

                appL.updateNotification(process_key, {
                    title: "Processing files",
                    description: `${loop_file_number}/${total_files_loop}`
                });

                //check for new folders to restart process
                throwIfRestartProcess();

                //flush previously processed and save
                itemsL.flushIf();

                let basename = pathL.basename(file.file);

                let file_key = basename.toLowerCase() + file.ctime + file.bytes;

                if(file_key in filesData.files) {
                    let test_item_id = filesData.files[file_key];

                    let test_item = itemsL.data[test_item_id];

                    if(test_item) {
                        if(test_item.deleted) {
                            return resolve();
                        }

                        if(test_item.local_url && await checkIfPathExists(test_item.local_url)) {
                            return resolve();
                        }
                    }
                }

                //get md5
                try {
                    file.md5 = await getMD5(file.file);

                    if(file.md5) {
                        let existing_local = null;

                        if(file.md5 in itemsL.md5s) {
                            existing_local = itemsL.md5s[file.md5];
                        }

                        let ext = getExt(file.file, true);

                        if(isImage(ext)) {
                            file.photo = true;
                        } else {
                            return resolve();
                        }

                        file.date = await getDate(file);

                        file.date = formatDate(file.date);

                        try {
                            mediaData = await getMediaData(file);
                        } catch (e) {
                            return resolve();
                        }

                        file.metadata = mediaData;

                        //filter out by size/resolution

                        try {
                            size_valid = await isSizeValid(file);
                        } catch (e) {
                            debugL.error(e);
                            return resolve();
                        }

                        if(!size_valid) {
                            set_delete = true;
                        }

                        let created = timeNow();

                        if(appL.restart_ip) {
                            return resolve();
                        }

                        //insert item?
                        if(!existing_local) {
                            item_data = {
                                id:  ++dbL.partition['items'].last_id,
                                uuid: null,
                                md5: file.md5,
                                is_photo: file.photo,
                                local_url: file.file,
                                date: file.date,
                                master_item_date: null,
                                filename: basename,
                                width: mediaData.width,
                                height: mediaData.height,
                                rotate: mediaData.rotate,
                                flip: mediaData.flip,
                                size: file.bytes,
                                content_type: getContentType(file.file),
                                created: created,
                                updated: created,
                                deleted: set_delete ? set_delete : null
                            };

                            itemsL.addUpdateItem(item_data, 'new');

                            new_files_processed++;
                        } else {
                            existing_local.local_url = file.file;
                        }

                        if(set_delete) {
                            filesData.files[file_key] = item_data ? item_data.id : existing_local.id;
                            return resolve();
                        }

                        //create thumb
                        let thumb_variant_name = getThumbName();

                        let thumb = null;

                        if(existing_local) {
                            if(existing_local.id in itemsL.variants && thumb_variant_name in itemsL.variants[existing_local.id]) {
                                //do nothing
                            } else {
                                try {
                                    thumb = await itemsL.createThumbnail(existing_local);
                                } catch (e) {
                                    return resolve();
                                }
                            }
                        } else {
                            try {
                                thumb = await itemsL.createThumbnail(item_data);
                            } catch (e) {
                                return resolve();
                            }
                        }

                        let item_id = existing_local ? existing_local.id : item_data.id;

                        //insert item variants?
                        if(thumb) {
                            item_variant_data = {
                                item_id:item_id,
                                variant_type: thumb_variant_name,
                                md5: thumb.md5,
                                local_url: getWindowsPath(thumb.file, true),
                                size: thumb.bytes,
                                content_type: 'image/jpeg',
                                created: timeNow(),
                                updated: timeNow(),
                                deleted: null
                            };

                            itemsL.addUpdateVariant(item_variant_data, 'new');
                        }

                        filesData.files[file_key] = item_id;
                    }
                } catch (e) {
                    console.error(e);
                }

                return resolve();
            } catch(e) {
                console.error(e);
                return reject(e);
            }
        });
    }

    let total_files_loop = 0;
    let loop_file_number = 0;
    let new_files_processed = 0;
    let process_key = files_notification_key;

    if(!dbL.data_loaded) {
        return false;
    }

    if(filesData.ip) {
        return false;
    }

    debugL.log("Starting process folders");

    filesData.tmpCache = {};

    filesData.ip = true;
    filesData.restart = false;

    //remove selected directories that have higher parent directories selected
    let dirs_filtered = {};

    for(let dk in filesData.dirs.selected) {
        let dir = filesData.dirs.selected[dk];

        if(!dirHasParent(dk)) {
            dirs_filtered[dk] = dir;
        }
    }

    //find filtered files recursively

    for(const dk in dirs_filtered) {
        mdp(dk);

        try {
            appL.updateNotification(process_key, {
                title: "Preparing directory",
                description: dk
            });
            
            await prepareDir(dirs_filtered[dk], null);
        } catch (e) {
            debugL.error(e);
        }

        mdpe(dk);
    }

    appL.deleteNotification(process_key);
    appL.updateNotification(process_key, appL.getNotifications()[process_key]);

    debugL.log("Prepared dirs");

    try {
        await openExif();
    } catch (e) {
        debugL.error(e);
    }

    //reverse cache keys to start with deepest dir first
    //after directory loop, save tmpcache key to dirs key then delete tmpcache key
    filesData.tmpCache = sortByKeys(filesData.tmpCache, true);

    debugL.log("Starting dir loop");

    total_files_loop = getFilesDataTmp();

    if(total_files_loop > 0) {
        appL.updateNotification(process_key, {
            title: "Processing files",
            description: `${loop_file_number}/${total_files_loop}`
        });
    }

    let needs_initial_flush = false;

    try {
        for(const k in filesData.tmpCache) { //dir loop
            //parallelize processing
            let dir_files = filesData.tmpCache[k].files;

            for (let i = 0; i < dir_files.length; i += batchSize) {
                const batch = dir_files.slice(i, i + batchSize);

                await Promise.all(batch.map(async file => {
                    try {
                        return await processFile(file);
                    } catch(e) {
                        console.error(e);
                    }
                }));

                if(!needs_initial_flush) {
                    needs_initial_flush = true;
                    itemsL.flushProcessing();
                }
            }

            saveProcessedDir(k, filesData.tmpCache[k].timestamp);
        } //end dir loop
    } catch(e) {
        console.error(e);
        processFolders();
    }

    debugL.log("Finished dir loop");

    appL.deleteNotification(process_key);

    appL.updateNotification(process_key, appL.getNotifications()[process_key]);

    if(new_files_processed > 0) {
        appL.addNotification(process_key + timeNow(true), {
            title: "Files processed",
            description: `${new_files_processed}`
        });
    }

    closeExif();
    
    itemsL.flushProcessing();

    saveProcessedDirs();

    filesData.ip = false;
}

function saveFolders() {
    return new Promise(async (resolve, reject) =>  {
        try {
             await saveObjToDisk(filesData.dirs, folders_file);
             resolve();
        } catch(e) {
            debugL.error(e);
            reject(e);
        }
    });
}

function saveFileKeys() {
    return new Promise(async (resolve, reject) =>  {
        try {
             await saveObjToDisk(filesData.files, files_file);
             resolve();
        } catch(e) {
            debugL.error(e);
            reject(e);
        }
    });
}

function setFolders (dirs) {
    return new Promise(async (resolve, reject) =>  {
        if(!filesData.dirs) {
            try {
                await initDirs();
            } catch (e) {
                debugL.error(e);
            }
        }

        if(!filesData.files) {
            try {
                await initFiles();
            } catch (e) {
                debugL.error(e);
            }
        }

        filesData.dirs.selected = dirs;

        //determine which cache folders to keep after update
        //removes cache when folder removed
        if (filesData.dirs && filesData.dirs.cache) {
            for(let dir in filesData.dirs.cache) {
                if(!(dir in filesData.dirs.selected)) {
                    delete filesData.dirs.cache[dir];
                }
            }
        }

        if(filesData.ip) {
            filesData.restart = true;
        } else {
            processFolders();
        }
        
        try {
            await saveFolders();
            resolve();
        } catch(e) {
            debugL.error(e);
            reject(e);
        }
    });
}

function setDefaultFolder() {
    return new Promise(async (resolve, reject) => {
        let home;
        let default_folder = null;

        try {
            home = require('os').homedir();

            if(is_mac || is_windows) {
                default_folder = joinPaths(home, 'Pictures');
            }
        } catch (e) {
        }

        if(default_folder) {
            try {
                await setFolders([default_folder]);
            } catch (e) {
            }
        }

        return resolve([default_folder]);
    });
}

function initDirs() {
    return new Promise(async (resolve, reject) =>  {
        let app_dir;
        
        if(filesData.dirs === null) {
            try {
                app_dir = await getAppDataDir();
            } catch (e) {
                debugL.error(e);
            }

            try {
                filesData.dirs = await getLocalFile(app_dir, folders_file, true);
            } catch (e) {
                filesData.dirs = {
                    selected: {},
                    cache: {}
                };
            }

            module.exports.dirs = filesData.dirs;
        }

        resolve();
    });
}

function initFiles() {
    return new Promise(async (resolve, reject) =>  {
        let app_dir;
        
        if(filesData.files === null) {
            try {
                app_dir = await getAppDataDir();
            } catch (e) {
                debugL.error(e);
            }

            try {
                filesData.files = await getLocalFile(app_dir, files_file, true);
            } catch (e) {
                filesData.files = {};
            }

            if(!filesData.files) {
                filesData.files = {};
            }

            module.exports.files = filesData.files;
        }

        resolve();
    });
}

function getFolders() {
    return new Promise(async (resolve, reject) => {
        if(filesData.dirs) {
            return resolve(filesData.dirs);
        }

        try {
            await initDirs();
        } catch (e) {
            return reject();
        }

        resolve(filesData.dirs);

    });
}

async function getFoldersItems() {
    return new Promise(async (resolve, reject) => {
        try {
            resolve("Folder processing started");

            await initDirs();
            await initFiles();
            await processFolders();
        } catch (e) {
            debugL.error(e);
        }
    });
}

function oneExifOnly(file) {
    return new Promise(async (resolve, reject) => {
         if(!exif_queue.length) {
             exif_queue.push(file);
             return resolve();
         }

         exif_queue.push(file);

         let t = setInterval(function () {
              if(exif_queue.length && exif_queue[0] === file) {
                  clearInterval(t);
                  return resolve();
              }
         }, 50);
    });
}


async function writeExifIn(file_name) {
    try {
        await oneExifOnly(file_name);

        exifP.stdin.write('-n\n -q\n -b\n -X\n -r\n');
        exifP.stdin.write(EOL);

        exifP.stdin.write(file_name);
        exifP.stdin.write(EOL);

        //include support for large files on 64 bit os
        if(process.arch.includes('64')) {
            exifP.stdin.write('-api');
            exifP.stdin.write(EOL);
            exifP.stdin.write("largefilesupport=1");
            exifP.stdin.write(EOL);
        }

        
        //execute file
        exifP.stdin.write('-execute');
        exifP.stdin.write(EOL);

        exifP.stdin.write('-echo2');

        exifP.stdin.write(EOL);

        exifP.stdin.write(file_name);
        exifP.stdin.write(EOL);
        exifP.stdin.write('-execute');
        exifP.stdin.write(EOL);
    } catch(e) {

    }
}

function openExif() {
    return new Promise(async (resolve, reject) =>  {
        debugL.log("open exif");

        if(module.exports.exif) {
            await closeExif();
        }

        let cp = require('child_process');

        let exif_exe = getExif();

        let exif_args = [
            '-stay_open',
            'True',
            '-@',
            '-'
        ];

        exifP = cp.spawn(exif_exe, exif_args);

        let output_str = '';
        
        exifP.stdout.on('data', function(data) {
            output_str += data.toString();
        });

        exifP.stderr.on('data', function (data) {
            let key = data.toString().replaceAll(`\r\n`, '').replaceAll(`\n`, '');

            removeArrItem(exif_queue, key);

            try {
                let resolve = module.exports.exifResolveMap[key];

                if(resolve) {
                    resolve(output_str);

                    delete module.exports.exifResolveMap[key];
                }
            } catch (e) {
                debugL.error(e);
            }

            output_str = '';
        });

        module.exports.exif = exifP;

        resolve();
    });
}

function closeExif() {
    return new Promise(async (resolve, reject) =>  {
        if(exif_close_ip) {
            await timeoutAwait(null, 500);
        }

        if(!exifP) {
            return resolve();
        }

        exif_close_ip = true;

        debugL.log("close exif");
        exifP.stdin.write('-stay_open');
        exifP.stdin.write(EOL);
        exifP.stdin.write('False');
        exifP.stdin.write(EOL);

        setTimeout(function () {
            debugL.log("exif closed");
            module.exports.exif = null;
            exifP = null;
            exif_close_ip = false;
            resolve();
        }, 500);
    });
}

function awaitProcess(queue_key) {
    let queue_index;

    return new Promise((resolve, reject) => {
        let int;

        function resolveIf() {
            queue_index = imageL.processing.queue.indexOf(queue_key);

            if(queue_index < imageL.processing.max_queue) {
                clearInterval(int);
                resolve();
            } else {
                debugL.log({
                    msg: 'waiting on queue',
                    key: queue_key,
                    index: queue_index
                });
            }
        }

        int = setInterval(function () {
            resolveIf();
        }, 100);

        resolveIf();

    });
}

function checkExistingVariant(item_id, variant_type) {
    if(item_id in itemsL.variants && itemsL.variants[item_id][variant_type]) {
        return itemsL.variants[item_id][variant_type];
    }

    return null;
}

function getFullscreenImage(item_id) {
    let queue_key = `image-queue-${item_id}`;

    return new Promise(async (resolve, reject) => {
        let device_src, data;

        let item = itemsL.data[item_id];

        let variant = checkExistingVariant(item_id, imageL.variants.device);

        //return existing variant
        if(variant) {
            return resolve(variant);
        }

        resolve();

        if(!item.local_url) {
            return;
        }

        if(queue_key in imageL.processing.finished || imageL.processing.queue.indexOf(queue_key) > -1) {
            return;
        }

        imageL.processing.queue.push(queue_key);

        try {
            await awaitProcess(queue_key);
        } catch (e) {
            debugL.error(e);
        }

        //check again in case same item id was requested at different times
        variant = checkExistingVariant(item_id, imageL.variants.device);

        if(variant) {
            return appL.updateFullscreen(variant);
        }

        try {
            device_src = await itemsL.getThumbDirPath(item.local_url, imageL.variants.device);

            await itemsL.createImageThumb(item.local_url, device_src);

            data = {
                item_id:item_id,
                variant_type: imageL.variants.device,
                md5: await getMD5(device_src),
                local_url: getWindowsPath(device_src, true),
                size: await getFileSize(device_src),
                content_type: getContentType(device_src),
                created: timeNow(),
                updated: timeNow(),
                deleted: null
            };

            itemsL.addUpdateVariant(data, 'new');
            itemsL.flushProcessing(true);

            imageL.processing.finished[queue_key] = 1;
        } catch (e) {
            debugL.error(e);
        }

        removeArrItem(imageL.processing.queue, queue_key);

        return appL.updateFullscreen(data);
    });
}

module.exports = {
    thumb: {
        height: 1000,
        width: 1200
    },
    getFolders: getFolders,
    getFoldersItems: getFoldersItems,
    saveFolders: saveFolders,
    setFolders: setFolders,
    setDefaultFolder: setDefaultFolder,
    dirs: filesData.dirs,
    files: filesData.files,
    exif: null,
    openExif: openExif,
    closeExif: closeExif,
    writeExifIn: writeExifIn,
    exifResolveMap: {},
    exifRe: null,
    thumb_name: getThumbName(),
    saveFileKeys: saveFileKeys,
    inProgress: getInProgress,
    getFullScreenImage: getFullscreenImage,
    resetData: function () {
        filesData.ip = false;
        filesData.restart = false;
        filesData.dirs = null;
        filesData.tmpCache = {};
        filesData.files = null;

        module.exports.dirs = filesData.dirs;
        module.exports.files = filesData.files;
    }
};