photosApp.db = {
    init_called: false,
    data_loaded: false,
    classes: {
        loading: 'db-loading'
    },
    dir: null,
    init: function () {
        photosApp.initLastStep = 'db';

        return new Promise(async (resolve, reject) => {
            if(photosApp.db.init_called) {
                return resolve();
            }

            photosApp.db.init_called = true;

            try {
                await photosApp.db.getPartitions();
            } catch (e) {
                return reject(e);
            }

            resolve();
        });
    },
    getPartitions: function() {
        return new Promise(async (resolve, reject) => {
            try {
                await axios.get(`${photosApp.backend.host}db`);
                resolve();
            } catch (e) {
                reject();
            }
        });
    },
    setDataLoaded: function () {
        return new Promise(async (resolve, reject) => {
            try {
                await axios.put(`${photosApp.backend.host}db/loaded`);
            } catch (e) {

            }

            photosApp.db.data_loaded = true;

            return resolve();
        });
    },
    getBackend: function () {
        return new Promise(async(resolve, reject) => {
            let map = [
                {
                    url: 'items',
                    prop: 'items.local.items'
                },
                {
                    url: 'variants',
                    prop: 'items.local.variants'
                }
            ];

            try {
                for(let m in map) {
                    let route = map[m];
                    let res = await axios.get(`${photosApp.backend.host}${route.url}`);

                    _.set(photosApp, route.prop, res.data);
                }
            } catch(e) {
                console.error(e);
            }

            //set data loaded on backend
            try {
                await photosApp.db.setDataLoaded();
            } catch(e) {
            }

            photosApp.time.updateChronologyFromTo();

            resolve();
        });
    },

};