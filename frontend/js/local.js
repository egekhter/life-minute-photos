photosApp.local = {
    dirs: {
        selected: {}
    },
    runData: {
        threshold: 1000,
        lastRun: null,
        running: false
    },
    init: function () {
        photosApp.initLastStep = 'local';

        return new Promise(async (resolve, reject) => {
            try {
                await photosApp.local.getFolders();
                await photosApp.local.getFoldersItems();
            } catch(e) {

            }

            resolve();
        });
    },
    getFolders: function() {
        return new Promise(async (resolve, reject) => {
            try {
                let r = await axios.get(`${photosApp.backend.host}folders`);

                if(r.data) {
                    photosApp.local.dirs = r.data;
                }

                photosApp.view.updateDirCount();
            } catch (e) {
            }

            resolve();
        });
    },
    getFoldersItems: function() {
        return new Promise(async (resolve, reject) => {
            let host = photosApp.backend.host;

            try {
                await axios.get(`${host}folders/items`);
            } catch (e) {

            }

            resolve();
        });
    },
    getPhotos: function () {
        return new Promise(async (resolve, reject) => {
            if(!photosApp.db.data_loaded) {
                return resolve();
            }

            if(photosApp.local.runData.lastRun && timeNow(true) - photosApp.local.runData.lastRun < photosApp.local.runData.threshold) {
                return resolve();
            }

            photosApp.local.runData.lastRun = timeNow(true);

            devConsole("Local: get photos");

            //resolve to process in background
            resolve();

            if(photosApp.local.runData.running) {
                return reject();
            }

            photosApp.local.runData.running = true;

            try {
                await photosApp.local.getFolders();
                await photosApp.local.getFoldersItems();
            } catch(e) {

            }

            photosApp.local.runData.running = false;
        });
    },
    addFolders: function (dirs) {
        for(let k in dirs) {
            let dir = dirs[k];

            if(!(dir.toLowerCase() in photosApp.local.dirs.selected)) {
                photosApp.local.dirs.selected[dir.toLowerCase()] = dir;
            }
        }

        photosApp.local.saveFolders();
        photosApp.view.updateDirCount();
        photosApp.view.updateManageDirectories();
    },
    getSelectedDirCount: function () {
        return Object.keys(photosApp.local.dirs.selected).length;
    },
    listFolders: function () {
        return photosApp.local.dirs.selected;
    },
    removeFolder: function (dir) {
        if(dir in photosApp.local.dirs.selected) {
            delete photosApp.local.dirs.selected[dir];
        }

        photosApp.local.saveFolders();
        photosApp.view.updateDirCount();
    },
    getDefaultFolders: function () {
        return new Promise(async (resolve, reject) => {
            let home = require('os').homedir();
            let pictures_dir = require('path').join(home, 'Pictures');

            let exists = await checkIfPathExists(pictures_dir);

            if(exists) {
                return resolve(pictures_dir);
            }

            return resolve(null);
        });
    },
    saveFolders: function () {
        return new Promise(async (resolve, reject) => {
            try {
                await axios.post(`${photosApp.backend.host}folders`, {dirs: photosApp.local.dirs.selected});
            } catch(e) {
                console.error(e);
            }

            resolve();
        });
    },
    onAddFolder: function() {
        document.getElementById('add-folder').addEventListener(click_handler, async function (e) {
            e.preventDefault();
            e.stopPropagation();

            const remote = require('@electron/remote');

            const { dialog } = remote;

            let openDialog = dialog.showOpenDialog({
                properties: ['openDirectory', 'multiSelections', 'createDirectory']
            });

            try {
                let data = await openDialog;

                let dirs = data.filePaths;

                if(dirs.length) {
                    photosApp.local.addFolders(dirs);
                }
            } catch(e) {
                console.error(e);
            }
        });

        photosApp.local.dragAndDropHolder();
    },
    dragAndDropHolder: function() {
        let holder = document.getElementById('app');

        holder.ondragover = () => {
            return false;
        };

        holder.ondragleave = () => {
            return false;
        };

        holder.ondragend = () => {
            return false;
        };

        holder.ondrop = (e) => {
            e.preventDefault();

            let dirs = [];

            let path = require('path');

            let fs = require('fs');

            for (let f of e.dataTransfer.files) {
                let stat = fs.lstatSync(f.path);

                if(stat.isDirectory()) {
                    dirs.push(f.path);
                } else {
                    dirs.push(path.dirname(f.path));
                }
            }

            photosApp.local.addFolders(dirs);

            return false;
        };
    }
};