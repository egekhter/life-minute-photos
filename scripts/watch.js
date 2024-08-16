let is_production = true;

if(process.argv.indexOf('-d') > -1) {
    is_production = false;
}

const chokidar = require('chokidar');

require('../backend/helpers/shared');

let app_dir = require('path').resolve(__dirname, '../frontend');

let frontend = require('./build_frontend');

// Initialize watcher.
let dirs = [
    joinPaths(app_dir, 'js'),
    joinPaths(app_dir, 'scss'),
];

function build() {
    return new Promise(async (resolve, reject) => {
        console.log("Build: ", getDateTimeStr());
        frontend.build(null, is_production);
        resolve();
    });
}

for (let i = 0; i < dirs.length; i++) {
    let d = dirs[i];

    console.log("Watching: ", d);

    const watcher = chokidar.watch(d, { persistent: true });

    // Add event listeners.
    let events = ['change', 'ready'];

    for(let e of events) {
        watcher.on(e, function (check) {
            try {
                build()
            } catch (e) {
                console.error(e);
            }
        });
    }
}