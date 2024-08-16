module.exports = {
}

if(typeof photosApp.dev === 'undefined') {
    if(!isProd()) {
        global.photosApp.dev = {
            enabled: true,
            showConsole: false,
            // performance: true,
            // resetTables: true,
            // skipDebug: true,
            // removeFiles: true
        };
    } else {
        global.photosApp.dev = {};
    }
}