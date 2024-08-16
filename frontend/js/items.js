photosApp.items = {
    local: {
        items: {},
        variants: {}
    },
    getLife(gridIndex, divOrder, interval_int) {
        return new Promise(async (resolve, reject) => {
            try {
                let r = await axios.put(`${photosApp.backend.host}life/item`, {
                    gridIndex: gridIndex,
                    divOrder: divOrder,
                    intervalLoop: interval_int
                });
                resolve(r.data);
            } catch (e) {
                resolve(null);
            }
        });
    },
    getItem: function (item_id) {
        return photosApp.items.local.items[item_id];
    },
    getYear: function (item_id) {
        let item = photosApp.items.local.items[item_id];
        let date = getMasterDate(item);
        return new Date(date).getFullYear();
    },
    getMonth: function (item_id) {
        let item = photosApp.items.local.items[item_id];
        let date = getMasterDate(item);
        return new Date(date).getMonth() + 1;
    },
    getDay: function (item_id) {
        let item = photosApp.items.local.items[item_id];
        let date = getMasterDate(item);
        return new Date(date).getDate();
    },
    getHour: function (item_id) {
        let item = photosApp.items.local.items[item_id];
        let date = getMasterDate(item);
        return new Date(date).getHours();
    },
    getMinute: function (item_id) {
        let item = photosApp.items.local.items[item_id];
        let date = getMasterDate(item);
        return new Date(date).getMinutes();
    },
    getSecond: function (item_id) {
        let item = photosApp.items.local.items[item_id];
        let date = getMasterDate(item);
        return new Date(date).getSeconds();
    },
    updateDateTime: function (item_id, data) {
        return new Promise((resolve, reject) => {
            let item = photosApp.items.local.items[item_id];

            let needed_props = ['year', 'month', 'day', 'hour', 'minute', 'second'];

            let valid = true;

            for (let k in needed_props) {
                let prop = needed_props[k];

                if(!(prop in data) || Number.isNaN(Number.parseInt(data[prop]))) {
                    valid = false;
                }
            }

            if(!valid) {
                return reject();
            }

            let two_digits = ["month", "day", "hour", "minute", "second"];

            for (let k in data) {
                let v = data[k];
                v = v.toString();

                data[k] = v;

                if(two_digits.indexOf(k) > -1 && v.length === 1) {
                    data[k] = formatNumberLength(v, 2);
                }
            }

            if(data.year.length > 4) {
                return reject("Year needs to be 4 digits or less");
            }

            if(data.year.length < 4) {
                data.year = formatNumberLength(data.year, 4);
            }

            item.master_item_date = `${data.year}-${data.month}-${data.day} ${data.hour}:${data.minute}:${data.second}`;

            resolve();
        });
    },
    updateItem: function (item, updated_field) {
        return new Promise(async(resolve, reject) => {
            let data = {};

            data[updated_field] = item[updated_field];

            let url = `${photosApp.backend.host}items/${item.id}`;

            try {
                await axios.put(url, data);
            } catch(e) {

            }

            resolve();

        });
    },
    getData: function (item_id) {
        return new Promise(async (resolve, reject) => {
            try {
                let url = `${photosApp.backend.host}data/items?item_id=${item_id}`;
                let result = await axios.get(url);
                resolve(result.data);
            } catch (e) {
                return reject(e);
            }
        });
    },
    getCount: function () {
        return new Promise(async (resolve, reject) => {
            let count = 0;

            try {
                let r = await axios.get(`${photosApp.backend.host}items/photos/count`);
                count = r.data.count;
            } catch (e) {
                console.error(e);
                return resolve(0);
            }

            return resolve(count);
        });
    },
    showLocal: async function (event, item_id) {
        event.preventDefault();
        event.stopPropagation();

        let t = event.currentTarget ? event.currentTarget : event.target;

        if(t._in_progress) {
            return;
        }

        t._in_progress = true;

        if(item_id) {
            let item = photosApp.items.local.items[item_id];

            if(item) {
                let url = item.local_url;

                if(!url) {
                    t._in_progress = false;
                    return;
                }

                if(is_mac) {
                    try {
                        await axios.put(`${photosApp.backend.host}show/file/local`, {
                            file: url
                        });
                    } catch (e) {
                        console.error(e);
                    }
                } else if(is_windows) {
                    let shell = require('electron').shell;
                    shell.showItemInFolder(url);
                }
            }
        }

        t._in_progress = false;
    }
};