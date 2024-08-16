photosApp.settings = {
    name: 'settings',
    init_called: false,
    data: {
        rotate: true,
        feature: {
            minutes: null,
            parallel: null,
            chronology: 'desc'
        },
        style: {
            controls: true,
            header: true,
            footer: true
        }
    },
    init: function() {
        return new Promise(async (resolve, reject) => {
            if(photosApp.settings.init_called) {
                return resolve();
            }

            photosApp.settings.init_called = true;

            //load settings from file system
            try {
                let r = await axios.get(`${photosApp.backend.host}settings`);
                photosApp.settings.data = r.data;
            } catch (e) {
            }

            resolve();
        });
    },
    saveSettings: function (key, value) {
        return new Promise(async (resolve, reject) => {
            let keys = key.split('.');

            let obj = photosApp.settings.data;

            for(let i = 0; i < keys.length; i++) {
                let key = keys[i];

                //last key
                if(i === keys.length - 1) {
                    obj[key] = value;
                } else {
                    obj = obj[key];
                }
            }

            try {
                await axios.put(`${photosApp.backend.host}settings`, {
                    key: key,
                    value: value
                });
            } catch (e) {
            }

            resolve();
        });
    }
};