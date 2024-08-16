module.exports = {
    name: 'style',
    screen: {
        width: {
            start: null,
            current: null
        },
        height: {
            start: null,
            current: null
        },
        devicePixelRatio: null
    },
    setScreen: function (data) {
        module.exports.screen = data;
    },
    setControls: function (bool) {
        return new Promise(async (resolve, reject) => {
            try {
                let data = {
                    controls: bool
                };

                await dbL.saveData(module.exports.name, data);
            } catch (e) {
                return reject(e);
            }

            resolve();
        });
    },
    getControls: function () {
        return new Promise(async (resolve, reject) => {
            let bool = true;

            try {
                let loaded_data = await dbL.loadData(module.exports.name);

                if('controls' in loaded_data) {
                    bool = loaded_data.controls;
                }
            } catch (e) {

            }

            resolve(bool);
        });
    }
}