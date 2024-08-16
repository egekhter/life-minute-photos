module.exports = {
    ip: false,
    life: {
        arr: [],
        obj: {}
    },
    items: {
        asc: null,
        desc: null
    },
    init: function () {
        return new Promise(async (resolve, reject) => {
            try {
                await itemsL.mergeData();
            } catch(e) {
                console.error(e);
            }

            resolve();
        });
    },
    getItems: function (dir) {
        return new Promise(async (resolve, reject) => {
            let cacheItems;

            if(!cacheL.items[dir] || !(cacheL.items[dir].length)) {
                if(cacheL.ip) { // prevent parallel execution
                    return setTimeout(function () {
                        resolve(cacheL.items[dir]);
                    }, 5);
                }

                cacheL.ip = true;

                try {
                    await itemsL.mergeData();
                } catch(e) {
                    console.error(e);
                }

                cacheL.ip = false;
            }

            cacheItems = cacheL.items[dir];

            return resolve(cacheItems);
        });

    },
    setItems: function (items) {
        items.sort(function (a, b) {
            return a.filename > b.filename ? 1 : -1;
        });

        items.sort(function (a, b) {
            return getMasterDate(a) > getMasterDate(b) ? 1 : -1;
        });

        let items_asc = items;

        cacheL.items.asc = items_asc;

        let items_desc = [];

        for(let i = items_asc.length - 1; i >= 0; i--) {
            items_desc.push(items_asc[i]);
        }

        cacheL.items.desc = items_desc;

        return cacheL.items;
    },
    resetData: function (force) {
        if(cacheL.ip && !force) {
            return false;
        }

        // console.log("reset cache data")

        module.exports.life.arr = [];
        module.exports.life.obj = {};
        module.exports.items.asc = null;
        module.exports.items.desc = null;
    }
};