photosApp.debug = {
    init_called: false,
    error_folder: 'errors',
    init: function () {
        photosApp.initLastStep = 'debug';

        return new Promise ((resolve, reject) => {
            if(photosApp.debug.init_called) {
                return resolve();
            }

            photosApp.debug.init_called = true;

            if(true || photosApp.dev.skipDebug) {
                return resolve();
            }

            resolve();

        });
    },
    openDevTools: function () {
        photosApp.app.ipcRenderer.sendSync('synchronous-message', {
            action: 'open-devtools'
        });
    }
};