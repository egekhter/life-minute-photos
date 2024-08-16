require('./helpers/shared');
loadEnv();

const { fork } = require('child_process');
const { app, BrowserWindow, desktopCapturer, ipcMain, session } = require('electron');
const DesktopMenu = require('electron').Menu;
const remoteMain = require('@electron/remote/main');
const unhandled = require('electron-unhandled');
const process = require('process');
const Store = require('electron-store');
const store = new Store();

// Electron settings from .json file.
const electronSettings = require('./electron-settings.json');
const packageSettings = require('../package.json');
const windowSizeKey = 'windowSize';

global.debugL = require('./server/debug');


module.exports = {
    getRelativeUrl: function (url, remove_file_path) {
        let index_url = `file://${__dirname}/`;

        if(url[0] === '/') {
            url = url.substring(1);
        }

        if(remove_file_path) {
            index_url = index_url.replace('file://', '');
        }

        return `${index_url}${url}`;
    },
    init: async function () {
        process.env.NODE_ENV = isProd() ? 'prod' : 'dev';

        // Keep a global reference of the window object, if you don't, the window will
        // be closed automatically when the JavaScript object is garbage collected.
        let mainWindow;

        unhandled();

        //disable hardware acceleration on windows
        if(getIsWindows()) {
            app.disableHardwareAcceleration();
        }

        // Module to control application life, browser window and tray.
        const is_our_lock = app.requestSingleInstanceLock()

        if(!is_our_lock) {
            return app.quit()
        }

        try {
            await killPreviouslyStarted();
        } catch(e) {
            console.error(e);
        }

        app.allowRendererProcessReuse = false;


        function createMenu() {
            const application = {
                id: 'menu-application',
                label: "Application",
                submenu: [
                    {
                        label: "Exit",
                        accelerator: "Command+Q",
                        click: () => {
                            app.quit()
                        }
                    }
                ]
            };

            const edit = {
                label: 'Edit',
                submenu: [
                    { role: 'undo' },
                    { role: 'redo' },
                    { type: 'separator' },
                    { role: 'cut' },
                    { role: 'copy' },
                    { role: 'paste' },
                    ...(process.platform === 'darwin' ? [
                        { role: 'delete' },
                        { role: 'selectAll' },
                        { type: 'separator' },
                        {
                            label: 'Speech',
                            submenu: [
                                { role: 'startSpeaking' },
                                { role: 'stopSpeaking' }
                            ]
                        }
                    ] : [
                        { role: 'delete' },
                        { type: 'separator' },
                        { role: 'selectAll' }
                    ])
                ]
            }

            const template = [
                application,
                edit
            ];

            let menu = DesktopMenu.buildFromTemplate(template);

            DesktopMenu.setApplicationMenu(menu);
        }


        async function createMainWindow () {
            let appIcon = joinPaths(getRepoRoot(), 'icon.png');
            let startMaximized = true;
            const browserWindowOpts = Object.assign({}, electronSettings, { icon: appIcon });
            browserWindowOpts.title = packageSettings.productName;
            browserWindowOpts.show = false;

            let prevSize = store.get(windowSizeKey);

            if(prevSize) {
                startMaximized = false;
                browserWindowOpts.width = prevSize.width;
                browserWindowOpts.height = prevSize.height;
            }

            if(getIsWindows()) {
                browserWindowOpts.title = '';
                browserWindowOpts.frame = false;
            }

            mainWindow = new BrowserWindow(browserWindowOpts);

            if(startMaximized) {
                mainWindow.maximize();
            }

            mainWindow.show();

            mainWindow.setMenuBarVisibility(false);

            mainWindow.webContents.on('did-finish-load', function () {
                mainWindow.webContents.send('window-id', mainWindow.id);
            });

            mainWindow.on('page-title-updated', function(e) {
                e.preventDefault()
            });

            mainWindow.loadURL(module.exports.getRelativeUrl('../frontend/index.html'));

            // Open DevTools
            if (electronSettings.webPreferences.devTools || !isProd()) {
                mainWindow.webContents.openDevTools();
            }

            mainWindow.on('close', function () {
                app.quit();
            });

            mainWindow.on("resize", function () {
                let size = mainWindow.getSize();
                let width = size[0];
                let height = size[1];

                store.set(windowSizeKey, {
                    width: width,
                    height: height
                });
            });

            // Emitted when the window is closed.
            mainWindow.on('closed', () => {
                // Dereference the window object, usually you would store windows
                // in an array if your app supports multi windows, this is the time
                // when you should delete the corresponding element.
                mainWindow = null;
            });

            app.on('second-instance', (event, commandLine, workingDirectory) => {
                // Someone tried to run a second instance, we should focus our window.
                if (mainWindow) {
                    if (mainWindow.isMinimized()) {
                        mainWindow.restore();
                    }

                    mainWindow.focus();
                }
            });

            mainWindow.webContents.on('crashed', (e) => {
                debugL.error("main window crashed", e);
            });
        }

        // This method will be called when Electron has finished
        // initialization and is ready to create browser windows.
        // Some APIs can only be used after this event occurs.

        let app_ready_called = false;

        async function onReady() {
            return new Promise(async (resolve, reject) => {
                if(app_ready_called) {
                    return resolve();
                }

                app_ready_called = true;

                await createMainWindow();

                createMenu();

                let redirectURL = 'data:application/x-javascript;base64,UHJvZHVjdFJlZ2lzdHJ5SW1wbC5SZWdpc3RyeT1jbGFzc3tjb25zdHJ1Y3Rvcigpe31uYW1lRm9yVXJsKHIpe3JldHVybiBudWxsfWVudHJ5Rm9yVXJsKHIpe3JldHVybiBudWxsfXR5cGVGb3JVcmwocil7cmV0dXJuIG51bGx9fSxQcm9kdWN0UmVnaXN0cnlJbXBsLl9oYXNoRm9yRG9tYWluPWZ1bmN0aW9uKHIpe3JldHVybiIifSxQcm9kdWN0UmVnaXN0cnlJbXBsLnJlZ2lzdGVyPWZ1bmN0aW9uKHIsdCl7UHJvZHVjdFJlZ2lzdHJ5SW1wbC5fcHJvZHVjdHNCeURvbWFpbkhhc2g9bmV3IE1hcH0sUHJvZHVjdFJlZ2lzdHJ5SW1wbC5fcHJvZHVjdHNCeURvbWFpbkhhc2g9bmV3IE1hcCxQcm9kdWN0UmVnaXN0cnlJbXBsLnJlZ2lzdGVyKFtdLFtdKSxQcm9kdWN0UmVnaXN0cnlJbXBsLnNoYTE9ZnVuY3Rpb24ocil7cmV0dXJuIiJ9Ow==';

                session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
                    if ((/^devtools:\/\/devtools\/remote\/serve_file\/@[0-9a-f]{40}\/product_registry_impl\/product_registry_impl_module.js$/ui).test(details.url)) {
                        callback({
                            redirectURL
                        });
                        return;
                    }
                    callback({});
                });

                resolve();
            });
        }

        if(app.isReady()) {
            await onReady();
        } else {
            app.on('ready', onReady);
        }

        // Quit when all windows are closed.
        app.on('window-all-closed', () => {
            // On OS X it is common for applications and their menu bar
            // to stay active until the user quits explicitly with Cmd + Q
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });

        app.on('activate', async () => {
            // On OS X it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (mainWindow === null) {
                await createMainWindow();
            }

            debugL.log("On activate");

            try {
                mainWindow.webContents.send('window-activate', {
                });
            } catch (e) {
            }
        });

        app.on('browser-window-focus', () => {
            debugL.log("On window focus");

            try {
                mainWindow.webContents.send('window-activate', {
                });
            } catch (e) {
            }
        });

        let beforeQuitDone = false;

        app.on('before-quit', async function(e) {
            debugL.log("Before quit");

            server_proc.kill('SIGINT');

            if (!beforeQuitDone) {
                e.preventDefault();

                try {
                    await killPids(server_proc.pid);
                } catch(e) {
                    console.error(e);
                }

                beforeQuitDone = true;
                app.quit();
            }
        });

        remoteMain.initialize();

        remoteMain.enable(mainWindow.webContents)

        ipcMain.handle('message', async function(event, arg) {
            if(arg.action === 'get-ports') {
                server_proc.send({
                    action: 'get-ports'
                });
            }
        });

        ipcMain.handle('capture-window-id', async function(event, arg) {
            return desktopCapturer.getSources({ types: ['window'] }).then(async sources => {
                for (const source of sources) {
                    if (source.name === packageSettings.productName && mainWindow) {
                        return source.id;
                    }
                }
            })
        });

        ipcMain.on('synchronous-message', async (event, arg) => {
            if(arg.action === 'open-devtools') {
                if(!isProd()) {
                    mainWindow.webContents.openDevTools();
                }

                event.returnValue = arg;
            }
        });

        ipcMain.on('quit-app', async (event, arg) => {
            app.quit();
        });

        let env = Object.create( process.env );
        env.NODE_ENV = isProd() ? 'prod' : 'dev';
        env.frontend_path = module.exports.getRelativeUrl('../frontend');
        env.main_pid = global.main_pid = process.pid;

        let pids = {};

        const server_proc = fork(joinPaths(__dirname, 'server.js'), [], {
            env: env,
        });

        pids[server_proc.pid] = 1;

        debugL.log("subprocess: " + server_proc.pid);

        server_proc.on('message', function (msg) {
            devConsole(msg);

            if(msg.action === 'ports') {
                mainWindow.webContents.send(msg.action, msg.data.ports);
            } else if(msg.action === 'restart-app') {
                if(mainWindow) {
                    mainWindow.webContents.send(msg.action, {
                        data: null
                    });
                }
            }
        });
    }
};

module.exports.init();