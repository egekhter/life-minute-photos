module.exports = {
    name: 'settings',
    loaded: false,
    data: {
        is_onboarded: false,
        rotate: true,
        feature: {
            minutes: 1,
            parallel: 4,
            chronology: 'desc'
        },
        style: {
            controls: true,
            header: true,
            footer: true
        }
    },
    setSetting: function (key, value) {
        return new Promise(async (resolve, reject) => {
            try {
                let keys = key.split('.');

                let obj = module.exports.data;

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
                    await dbL.saveData(module.exports.name, module.exports.data);
                } catch(e) {
                }
            } catch (e) {
                return reject(e);
            }

            resolve();
        });
    },
    getSettings: function () {
        return new Promise(async (resolve, reject) => {
            if(!module.exports.loaded) {
                try {
                    await module.exports.loadSettings();
                } catch(e) {
                }
            }

            return resolve(module.exports.data);
        });
    },
    loadSettings: function () {
        return new Promise(async (resolve, reject) => {
            try {
                let load_data = await dbL.loadData(module.exports.name);

                if(load_data) {
                    for(let k in load_data) {
                        let data = load_data[k];

                        if(typeof data === 'object') {
                            for(let k2 in data) {
                                module.exports.data[k][k2] = data[k2];
                            }
                        } else {
                            module.exports.data[k] = data;
                        }
                    }
                }
            } catch(e) {
            }

            module.exports.loaded = true;

            resolve();
        });
    }
}