require('./helpers/shared');

const bodyParser = require('body-parser');
const express = require('express');
const http = require('http');
const WebSocketServer = require('ws');

global._ = require('lodash');
global.axios = require('axios');
global.fsL = require('fs');
global.osL = require('os');
global.pathL = require('path');

// process.env.PATH += `:${joinPaths(getRepoRoot(), 'build')}`;

global.photosApp = {};
global.appExpress = null;
global.appServer = null;
global.main_pid = Number.parseInt(process.env.main_pid);
global.portNum = null;
global.is_mac = process.platform === 'darwin';
global.is_windows = process.platform === 'win32';

global.devL = require('./server/dev');
global.debugL = require('./server/debug');
global.appL = require('./server/app');
global.dbL = require('./server/db');
global.imageL = require('./server/image');
global.filesL = require('./server/files');
global.itemsL = require('./server/items');
global.cacheL = require('./server/cache');
global.organizeL = require('./server/organize');
global.gridL = require('./server/grid');
global.viewsL = require('./server/views');
global.timeL = require('./server/time');
global.styleL = require('./server/style');
global.settingsL = require('./server/settings');

global.wsObj = null;

//todo toggle when needed
// require( 'trace-unhandled/register' );


function createWebServer() {
    return new Promise(async (resolve, reject) => {
        async function listenOnPort() {
            if(typeof appL !== 'undefined' && appL.restart_ip) {
                appL.restart_ip = false;
            }

            if(appServer && appServer._isActive) {
                closeServer();
            }

            appServer = appExpress.listen(0, function () {
                portNum = appServer.address().port;
                appServer._isActive = true;

                devConsole({
                    port: portNum
                });

                try {
                    writePortToFile(portNum);
                } catch (e) {
                }

                resolve(portNum);
            });

            //allow up to 15 minutes for connection
            appServer.setTimeout(60 * 1000 * 15);
        }

        appExpress = express();

        appExpress.use(function(req, res, next) {
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
            res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
            next();
        });

        appExpress.use(bodyParser.urlencoded({limit: '2mb', extended: true }));
        appExpress.use(bodyParser.json({limit: '2mb', extended: true}));

        //route endpoints-> frontend to backend
        require('./server/routes')(appExpress);

        listenOnPort();
    });
}

function createWSServer() {
    return new Promise(async (resolve, reject) => {
        const server = http.createServer();
        const wss = new WebSocketServer.Server({ server });

        wss.on("connection", (ws) => {
            devConsole("Connection");
            wsObj = ws;
        });

        let wsHttp = server.listen(0, () => {
            resolve(wsHttp.address().port);
        });
    });
}

(async function () {
    devConsole({
       NODE_ENV: getNodeEnv()
    });

    //renderer inits get ports to main, main requests ports from us, we send ports back to main, which sends ports to renderer
    process.on('message', async function (msg) {
        if(msg.action === 'get-ports') {
            let server_port = await createWebServer();
            let ws_port = await createWSServer();

            process.send({
                action: 'ports',
                data: {
                    ports: {
                        server: server_port,
                        ws: ws_port
                    }
                }
            });
        } else if(msg.action === 'close-server') {
            closeServer();
        }
    });
})();


global.closeServer = function () {
    try {
        if(appServer._isActive) {
            appServer.close();
            debugL.log("Closed app server");
            appServer._isActive = false;
        }
    } catch (e) {
    }
}

process.on('unhandledRejection', function(err, p) {
    if(typeof debugL === 'undefined') {
        console.error(err);
    } else {
        debugL.error("Unhandled rejection", err);

        if (err && err.stack) {
            debugL.error(err.stack);
        }
    }
});

process.on('uncaughtException', function(err) {
    if(typeof debugL === 'undefined') {
        console.error(err);
    } else {
        // handle the error safely
        debugL.error("Uncaught exception");

        debugL.error(err, err.stack);

        if(err) {
            if(['ECONNREFUSED', 'ETIMEDOUT'].indexOf(err.code) > -1) {
                debugL.error("uncaught exception ws err");
            }
        }
    }
});