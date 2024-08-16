module.exports = {
    divs: 2,
    names: [
        'life'
    ],
    files: {
        intervalLoop: 'interval-loop.json'
    },
    intervalLoop: [], //used to lookup item ids based on grid length/index
    getYearOfDate(date) {
        return date.substr(0, 4);
    },
    getMonthOfDate(date, human_readable) {
        let month = date.substr(5, 2);

        if(human_readable) {
            month = humanMonthFromNumber(month, true);
        }

        return month;
    },
    async initIntervalLoops(on_chronology) {
        return new Promise(async (resolve, reject) => {
            //initialize interval loop to array with length of parallel grid count
            if(timeL.intervalLoop.length !== settingsL.data.feature.parallel) {
                timeL.intervalLoop = [];

                for(let i = 0; i < settingsL.data.feature.parallel; i++) {
                    timeL.intervalLoop.push(0);
                }
            }

            //switch interval loop index to show previous image
            if(on_chronology) {
                cacheL.resetData(true);

                let life = await itemsL.getLife(true);

                for(let k in life) {
                    let items_count = life[k].length;

                    let intervalLoop = timeL.intervalLoop[k];

                    let itemIndex = intervalLoop;

                    if (intervalLoop + 1 > items_count) {
                        itemIndex = (intervalLoop) % items_count;
                    }

                    timeL.intervalLoop[k] = items_count - itemIndex - 1;
                }

                appL.updateIntervalLoop(timeL.intervalLoop);
            }
            
            resolve();
        });
        
    },
    loadIntervalLoops: async function () {
        return new Promise(async (resolve, reject) => {
            let data_dir = await getAppDataDir();

            try {
                let data = await getLocalFile(data_dir, timeL.files.intervalLoop, true);

                if(data) {
                    timeL.intervalLoop = data;
                }
            } catch (e) {
            }

            resolve(timeL.intervalLoop);
        });
    },
    getCount: function(gridIndex) {
        return new Promise(async (resolve, reject) => {
           try {
               let items = await itemsL.getLife();

               resolve(items[gridIndex].length);
           } catch(e) {
                return reject(e);
           }
        });

    },
    getItems: function(gridIndex, direction, item_ids_only) {
        return new Promise(async (resolve, reject) => {
            let items = [];
            let filtered_items = [];

            try {
                items = await itemsL.getLife(null, direction);
                items = items[gridIndex];
            } catch(e) {
                console.error(e);
            }

            for(let item of items) {
                if(item.deleted) {
                    continue;
                }

                if(item_ids_only) {
                    filtered_items.push(item.id);
                } else {
                    filtered_items.push(item);
                }
            }

            return resolve(filtered_items);
        });
    },
    showThumbLife(gridIndex, divOrder) {
        // 1st div
        if(divOrder === 0) {
            // even loop
            if(timeL.intervalLoop[gridIndex] % timeL.divs === 0) {
                return true;
            } else {
                return false;
            }
            //2nd div
        } else {
            //even loop
            if(timeL.intervalLoop[gridIndex] % timeL.divs === 0) {
                return false;
            } else {
                return true;
            }
        }
    },
    resetData: function () {
        module.exports.intervalLoop = [];
    }
}