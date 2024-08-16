let dirs = {
    tmp_folder: 'tmp',
    data_folder: 'data',
    error_folder: 'errors',
};

let db = {
    tables: {
        items: {
            id_key: 'id',
        },
        items_variants: {
            id_key: 'item_id'
        }
    },
    dir: null,
    partition: {
        limit: 2000,
        table_name: 'partition_table',
        data: {}
    },
    partitions: null,
    batchSize: 10,
    initPartitionsTable: function() {
        for(let table_name in db.tables) {
            let data = db.tables[table_name];

            db.partition.data[table_name] = {
                schema_name: table_name,
                id_key: data.id_key,
                last_id: 0,
                partitions: []
            };

            if(data.id_key2) {
                db.partition.data[table_name].id_key2 = data.id_key2;
            }
        }
    },
    getPartitions: function() {
        return new Promise(async (resolve, reject) => {
            let app_dir;

            try {
                app_dir = await getAppDataDir();
            } catch (e) {
                debugL.error(e);
            }

            db.dir = joinPaths(app_dir, 'db');

            try {
                let data = await db.loadData(db.partition.table_name);

                if(data) {
                    db.partition.data = Object.assign(db.partition.data, data);
                } else {
                    db.initPartitionsTable();
                }
            } catch(e) {
                db.initPartitionsTable();
            }

            resolve();
        });
    },
    loadData: function (table_name) {
        return new Promise(async (resolve, reject) => {
            try {
                let data = getLocalFile(db.dir, table_name + '.json', true);

                if(typeof data === 'string') {
                    data = JSON.parse(data);
                }

                resolve(data);
            } catch(err) {
                reject(err);
            }
        });
    },
    saveData: function (table_name, data, partition_table_only) {
        return new Promise(async (resolve, reject) => {
            if(!db.dir) {
                return reject();
            }

            if(typeof data !== 'string') {
                try {
                    data = JSON.stringify(data);
                } catch (e) {
                    console.error(e);
                    return reject();
                }
            }

            let partition_table_data = JSON.stringify(db.partition.data);
            let partition_table_name = db.partition.table_name + '.json';

            try {
                JSON.parse(partition_table_data);
            } catch (e) {
                debugL.error(e);
                throw  "Couldn't parse partition table before write";
            }

            let save_order = [];

            if(!partition_table_only) {
                save_order.push([db.dir, `${table_name}.json`, data]);
            }

            save_order.push([db.dir, partition_table_name, partition_table_data]);

            for(const soi in save_order) {
                try {
                    let save = save_order[soi];

                    await writeFileDirPath(save[0], save[1], save[2])
                } catch (e) {
                    return reject();
                }
            }

            //after writing partition table, reread it from file and ensure it's valid json before updating backup
            try {
                let part_table = await getLocalFile(db.dir, partition_table_name);

                if(JSON.parse(part_table)) {
                    writeFileDirPath(db.dir, `${partition_table_name}.backup`, partition_table_data);
                }
            } catch (e) {
                debugL.error(e);
            }

            resolve();
        });
    },
    loadPartitionFiles: function (table_name) {
        return new Promise(async(resolve, reject) => {
            let files = db.filterFiles(table_name);

            let partitions = [];

            for(let i = 0; i < files.length; i += db.batchSize) {
                const ios = files.slice(i, i + db.batchSize).map(function (io) {
                    return db.loadData(io);
                });

                try {
                    let data = await Promise.all(ios);
                    partitions = partitions.concat(data);
                } catch(e) {
                    debugL.log("Reading items error: " + JSON.stringify(e));
                    debugL.error("Reading items", e);
                }
            }

            for(let k in partitions) {
                let partition = partitions[k];
                db.partitions[table_name][k] = partition;
            }

            return resolve(partitions);
        });
    },
    filterFiles: function (schema) {
        let files = [];

        for(const pi in db.partition.data[schema].partitions) {
            let partition = db.partition.data[schema].partitions[pi];

            if(partition.partition_number === 0 && partition.size === 0) {
                continue;
            }

            files.push(partition.partition_name);
        }

        return files;
    },
    createPartitionProps: function () {
        db.partitions = {};
        module.exports.partitions = db.partitions;

        for (let table in db.tables) {
            db.partitions[table] = {};
        }
    },
    init: async function () {
        return new Promise(async(resolve, reject) => {
            try {
                await db.setupDirectories();
                db.createPartitionProps();
                await db.getPartitions();
            } catch (e) {
                console.error(e);
            }

            resolve();
        });
    },
    deleteDatabase: function () {
        return new Promise(async (resolve, reject) => {
            debugL.log("deleting database");

            try {
                 await deleteAllFilesInDir(getAppDir(), true);

                debugL.log("Database deleted");

                try {
                    let app_dir = await getAppDataDir();
                    await removeDir(app_dir);
                } catch (e) {
                    debugL.error(e);
                }
            } catch(err) {
                debugL.error("Error deleting database", err);
            }
        });
    },
    setupDirectories: function () {
        return new Promise(async (resolve, reject) => {
            let data_dir = await getAppDataDir();
            let log_dir = await getAppLogDir();

            db.dir = joinPaths(data_dir, 'db');

            let folders = [
                data_dir,
                joinPaths(log_dir, dirs.error_folder),
                db.dir
            ];

            for(const fi in folders) {
                try {
                    await createDirectoryIfNotExistsRecursive(folders[fi]);
                } catch(e) {
                    console.error(e);
                }
            }

            resolve();
        });
    },
};

module.exports = {
    data_loaded: false,
    init: db.init,
    getPartitions: db.getPartitions,
    loadPartitionFiles: db.loadPartitionFiles,
    partition: db.partition.data,
    limit: db.partition.limit,
    partitions: db.partitions,
    saveData: db.saveData,
    loadData: db.loadData,
    deleteDatabase: db.deleteDatabase,
    setupDirectories: db.setupDirectories,
    resetData: function () {
        db.dir = null;
        db.partition.data = {};
        db.partitions = null;

        module.exports.data_loaded = false;
        module.exports.partition = db.partition.data;
        module.exports.partitions = db.partitions;
    },
    setLoaded: function () {
        module.exports.data_loaded = true;
    },
    saveIntervalLoops: async function (interval_data) {
        if(interval_data) {
            timeL.intervalLoop = interval_data;
        }

        let data = JSON.stringify(interval_data);

        let app_dir = await getAppDataDir();

        writeFileDirPath(app_dir, timeL.files.intervalLoop, data);
    },
};