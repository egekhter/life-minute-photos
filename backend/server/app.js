let notifications = {};

let sendProcessQueueTs = {};

function sendProcess(action, data) {
    return new Promise(async (resolve, reject) => {
        let sendData = {
            action: action,
            data: data
        };

        if(action === 'items') { //parsing items freezes ui, so we send ws ping then retrieve via http endpoint
            itemsL.wsItems = data;
            sendData.data = null;
        }

        if(!wsObj) {
            return resolve();
        }

        if(!(action in sendProcessQueueTs)) {
            sendProcessQueueTs[action] = [];
        }

        for(let t of sendProcessQueueTs[action]) {
            clearTimeout(t);
        }

        let t = setTimeout(function () {
            wsObj.send(JSON.stringify(sendData));
        }, 100);

        sendProcessQueueTs[action].push(t);

        resolve();
    });
}

function updateItems(items, variants, data_only) {
    return new Promise(async (resolve, reject) => {
        let grid;

        cacheL.resetData();

        try {
            grid = await gridL.getLife();
        } catch(e) {
            console.error(e);
        }

        sendProcess('items', {
            items: items,
            variants: variants,
            data_only: data_only,
            grid: grid
        });

        module.exports.threshold = 10000;
    });
}

function updateIntervalLoop(interval_loop) {
    return new Promise(async (resolve, reject) => {
        sendProcess('interval-loop', {
            interval_loop: interval_loop,
        });
    });
}

function getNewNotificationsCount() {
    let count = 0;

    for(let k in notifications) {
        let n = notifications[k];

        //make sure we added the seen property
        if(n && 'seen' in n) {

            //not seen
            if(!n.seen) {
                count++;
            }
        }
    }

    return count;
}

function addNotification(key, data) {
    return new Promise((resolve, reject) => {
        notifications[key] = data;

        if(!('started' in notifications[key])) {
            notifications[key].started = timeNow();
        }

        if(!('timestamp' in notifications[key])) {
            notifications[key].timestamp = timeNow();
        }

        setNotificationSeen(key, false);

        sendProcess('notification', {
            key: key,
            data: data,
            new_notifications_count: getNewNotificationsCount()
        });

        resolve();
    });
}

function updateNotification(key, data) {
    return new Promise((resolve, reject) => {
        if(key) {
            let notification = notifications[key];

            //create new
            if(!notification) {
                notifications[key] = data;
                notification = notifications[key];
            } else if (data) { //update
                for(let k in data) {
                    notification[k] = data[k];
                }
            }

            if(!notification) {
                return resolve();
            }

            if(!('started' in notification)) {
                notification.started = timeNow();
            }

            notification.timestamp = timeNow();
        }

        setNotificationSeen(key, false);

        sendProcess('notification', {
            key: key,
            data: data,
            new_notifications_count: getNewNotificationsCount()
        });

        resolve();
    });
}

function setNotificationSeen(key, bool) {
    let skip_keys = ['syncing'];

    let n = notifications[key];

    if(!n) {
        return;
    }

    if(skip_keys.indexOf(key) > -1) {
        return;
    }

    if(bool) {
        n.seen = true;
    } else {
        if(!('seen' in n)) {
            n.seen = bool;
        }
    }
}

module.exports = {
    restart_ip: false,
    version: null,
    threshold: 5000,
    is_onboarded: false,
    updateItems: updateItems,
    updateIntervalLoop: updateIntervalLoop,
    addNotification: addNotification,
    updateNotification: updateNotification,
    sendProcess: sendProcess,
    reset: function (hard_reset) {
        cacheL.life.arr =[];
        cacheL.life.obj = {};
        cacheL.items = {};

        if(hard_reset) {
            timeL.intervalLoop = [];
        }
    },
    init: function () {
    },
    deleteNotification: function(key) {
        if(key in notifications) {
            let notification = notifications[key];

            if(notification) {
                notification.remove_notification = true;
                notification.seen = true;
            }
        }
    },
    notificationsSeen: function (keys) {
        return new Promise(async (resolve, reject) => {
            for(let k of keys) {
                setNotificationSeen(k, true);
            }

            appL.updateNotification();
        });
    },
    getNotifications: function () {
        return notifications;
    },
    updateFullscreen(variant) {
        sendProcess('fullscreen-variant', variant);
    },
    resetData: function () {
        notifications = {};

        module.exports.threshold = 5000;

        cacheL.resetData();
        dbL.resetData();
        debugL.resetData();
        filesL.resetData();
        gridL.resetData();
        imageL.resetData();
        itemsL.resetData();
        organizeL.resetData();
        timeL.resetData();
    },
    getOnboarded: function () {
        return new Promise(async (resolve, reject) => {
            resolve(settingsL.data.is_onboarded);
        });
    },
    setOnboarded: function (bool) {
        return new Promise(async (resolve, reject) => {
            try {
                await settingsL.setSetting('is_onboarded', true);
            } catch(e) {

            }

            resolve();
        });
    }
};

function setVersion() {
    return new Promise(async (resolve, reject) => {
        require('./debug').log("Set App Version");

        //get version from package
        try {
            let data = require('../../package.json');
            module.exports.version = data.version;
        } catch (e) {
            debugL.error(e);
        }

        resolve();
    });
}


(async function () {
    //set server
    try {
        await setVersion();

        debugL.log({
            version: appL.version
        });

    } catch (e) {
    }
})();