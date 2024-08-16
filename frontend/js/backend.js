photosApp.backend = {
    host: null,
    ws: {
        host: null,
        client: null,
        connectionTry: 0,
        autoReconnectInterval: 5000,
        reconnect_ip: false,
        connect: function () {
            function reconnect() {
                console.log("Reconnect WS");

                if(photosApp.backend.ws.reconnect_ip) {
                    return;
                }

                photosApp.backend.ws.reconnect_ip = true;

                photosApp.backend.ws.connectionTry++;

                let reconnect_ms = photosApp.backend.ws.autoReconnectInterval * photosApp.backend.ws.connectionTry;

                setTimeout(function(){
                    photosApp.backend.ws.reconnect_ip = false;

                    if(photosApp.backend.ws.client && photosApp.backend.ws.client.readyState === WebSocket.OPEN) {
                        return;
                    }

                    photosApp.backend.ws.connect();
                }, reconnect_ms);
            }

            //on reconnect
            if(photosApp.backend.ws.client) {
                if(photosApp.backend.ws.client.readyState === WebSocket.OPEN) {
                    return;
                }

                photosApp.backend.ws.client = null;
            }


            try {
                photosApp.backend.ws.client = new WebSocket(photosApp.backend.ws.host);
            } catch(e) {
                console.error(e);
                return;
            }

            photosApp.backend.ws.client.onopen = function () {
                // console.log('WS Connection Opened');
                photosApp.backend.ws.connectionTry = 0;
            }

            photosApp.backend.ws.client.onmessage = function(e, flags){
                try {
                    let msg = JSON.parse(e.data);

                    let action = msg.action;
                    let data = msg.data;

                    if(action === 'items') {
                        photosApp.events.onItems();
                    } else if(action === 'interval-loop') {
                        photosApp.events.onIntervalLoop(data);
                    } else if(action === 'notification') {
                        photosApp.events.onNotification(data);
                    } else if(action === 'fullscreen-variant') {
                        photosApp.events.onFullscreenVariant(data);
                    }
                } catch(e) {
                }
            }

            photosApp.backend.ws.client.onerror = function (e) {
                reconnect();
            }

            photosApp.backend.ws.client.onclose = function (e, b) {
                reconnect(e);
            }
        }
    },
    init: function () {
        return new Promise(async(resolve, reject) => {
            photosApp.app.ipcRenderer.on('ports', function (event, args) {
                photosApp.backend.host = `http://localhost:${args.server}/`;
                photosApp.backend.ws.host = `ws://localhost:${args.ws}`;

                photosApp.backend.ws.connect();

                resolve();
            });

            photosApp.app.ipcRenderer.invoke('message', {
                action: 'get-ports'
            });
        });
    }
};