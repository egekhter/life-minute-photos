let items = {
    app: [],
    table_names: {
        items: 'items',
        variants: 'items_variants'
    },
    md5s: {},
    data: {},
    variants: {},
    new: {
        items: [],
        variants: []
    },
    updated: {
        items: [],
        variants: []
    },
    wsItems: null
};

function getLife(ret_array, dir) {
    return new Promise(async (resolve, reject) => {
        let items;

        if(!ret_array) {
            if(!dir && !isObjectEmpty(cacheL.life.obj)) {
                return resolve(cacheL.life.obj);
            }
        } else {
            if(cacheL.life.arr.length) {
                return resolve(cacheL.life.arr);
            }
        }

        if(!dir) {
            dir = settingsL.data.feature.chronology;
        }

        try {
            items = await cacheL.getItems(dir);
        } catch(e) {
            console.error(e);
        }

        let items_split = chunkArray(items, settingsL.data.feature.parallel);

        for(let i = 0; i < settingsL.data.feature.parallel; i++) {
            cacheL.life.obj[i] = items_split[i];
        }

        if(!ret_array) {
            return resolve(cacheL.life.obj);
        }

        let arr = [];

        for(let k in cacheL.life.obj) {
            let items = cacheL.life.obj[k];
            arr.push(items);
        }

        arr = arr.reverse();

        cacheL.life.arr = arr;

        return resolve(arr);
    });
}

function getLifeItem(gridIndex, divOrder, intervalLoop) {
    return new Promise(async (resolve, reject) => {
        let items;
        let gridItems;
        let indexInc = 0;

        try {
            items = await itemsL.getLife();
        } catch(e) {
            console.error(e);
        }

        if (gridIndex in items) {
            gridItems = items[gridIndex];
        } else {
            return resolve(false);
        }

        let itemsCount = gridItems.length;

        if(typeof intervalLoop === 'undefined') {
            intervalLoop = timeL.intervalLoop[gridIndex];
        }

        let itemIndex = intervalLoop;

        if (intervalLoop + 1 > itemsCount) {
            itemIndex = (intervalLoop) % itemsCount;
        }

        // 1st div
        if(divOrder === 0) {
            //even loop
            if(intervalLoop % timeL.divs === 0) {
                indexInc = 0;
            } else {
                indexInc = 1;
            }
            //2nd div
        } else {
            //even loop
            if(intervalLoop % timeL.divs === 0) {
                indexInc = 1;
            } else {
                indexInc = 0;
            }
        }

        itemIndex += indexInc;

        if(itemIndex < 0 || itemIndex >= itemsCount) {
            itemIndex = 0;
        }

        let item = gridItems[itemIndex];

        return resolve(item);
    });
}

function addUpdateItem(item, action) {
    items[action].items.push(item);
    items.data[item.id] = item;

    if(item.md5) {
        items.md5s[item.md5] = item;
    }
}

function addUpdateVariant(variant, action) {
    items[action].variants.push(variant);

    if(!variant) {
        return;
    }

    if(!(variant.item_id in items.variants)) {
        items.variants[variant.item_id] = {};
    }

    if(!variant.variant_type) {
        return;
    }

    items.variants[variant.item_id][variant.variant_type] = variant;
}

function createImageThumb(i, o, resize) {
    return new Promise(async(resolve, reject) => {
        let gm = getGM();

        let cmd = gm(`${i}[0]`)
            .autoOrient();

        if(resize) {
            cmd = cmd.resize(resize);
        }

        cmd.quality(90).write(o, (err) => {
            if(err) {
                return reject(err);
            }

            return resolve();
        });
    });
}

function getThumbDirPath(url, variant_type) {
    return new Promise(async (resolve, reject) => {
        let app_dir;

        try {
            app_dir = await getAppDataDir();
        } catch (e) {
            debugL.error(e);
            return reject(e);
        }

        let thumb_dir = joinPaths(app_dir, 'thumbs');

        try {
            await createDirectoryIfNotExistsRecursive(thumb_dir);
        } catch (e) {
            debugL.error(e);
        }

        let pure_name = pathL.basename(url).replace(/\.[^/.]+$/, "");

        pure_name = pure_name.replace('#', 'no').replace(/\s+/g,"_").replace(/['"]/g, '');

        pure_name += `_${timeNow(true)}`;

        let thumb_name = `${pure_name}_${variant_type}.jpg`;

        resolve(joinPaths(thumb_dir, thumb_name));
    });
}

function createThumbnail(item) {
    return new Promise(async(resolve, reject) => {
        let thumb_data = {}, thumb_path;

        try {
            thumb_path = await getThumbDirPath(item.local_url, filesL.thumb_name);
        } catch (e) {
            debugL.error(e);
            return reject(e);
        }

        try {
            if(item.is_photo) {
                await createImageThumb(item.local_url, thumb_path, filesL.thumb.height);
            }
        } catch (e) {
            return reject(e);
        }

        thumb_data.file = thumb_path;

        try {
            thumb_data.md5 = await getMD5(thumb_path);
            thumb_data.bytes = await getFileSize(thumb_path);
        } catch (e) {
            debugL.log(item.local_url, e);
            return reject();
        }

        resolve(thumb_data);
    });
}

function flushProcessing(data_only) {
    //data only used in renderer to determine whether to update view on items received

    return new Promise(async(resolve, reject) => {
        let items_count = items.new.items.length;
        let variants_count = items.new.variants.length;

        let new_items = items.new.items.splice(0, items_count);
        let new_variants = items.new.variants.splice(0, variants_count);

        // save items and variants partitions
        try {
            await insertPartitionSingle(dbL.partition.items.schema_name, new_items);
            await insertPartitionMulti(dbL.partition.items_variants.schema_name, new_variants, true);
        } catch (e) {
            debugL.error(e);
        }

        let updated_count = items.updated.items.length;
        let updated_variants_count = items.updated.variants.length;
        let updated_items = items.updated.items.splice(0, updated_count);
        let updated_variants = items.updated.variants.splice(0, updated_variants_count);

        if(updated_items.length) {
            try {
                await updatePartitionSingle(dbL.partition.items.schema_name, updated_items);
            } catch (e) {
                debugL.error(e);
            }
        }

        if(updated_variants.length) {
            try {
                await updateVariantPartitions(dbL.partition.items_variants.schema_name, updated_variants);
            } catch (e) {
                debugL.error(e);
            }
        }

        // save file keys
        try {
            await filesL.saveFileKeys();
        } catch (e) {
            debugL.error(e);
        }

        //update view
        if(new_items.length || new_variants.length || updated_items.length || updated_variants.length) {
            appL.updateItems(new_items.concat(updated_items), new_variants.concat(updated_variants), data_only);
        }

        resolve();
    });
}

function updateItem(item_id, data) {
    return new Promise(async(resolve, reject) => {
        let item = items.data[item_id];

        let updated_fields = [];

        for(let k in data) {
            let v = data[k];
            let prev_v = item[k];
            if(prev_v === v) {
                continue;
            }

            if(k in item) {
                //validate data
                if(k === 'master_item_date' && v) {
                    let date_split = v.split('-');

                    if(date_split[0].length > 4) {
                        return reject("Year needs to be 4 digits or less");
                    }
                }

                item[k] = v;
                updated_fields.push(k);
            }
        }

        //clear cache on item update
        cacheL.resetData();

        try {
            await updatePartitionSingle(dbL.partition.items.schema_name, [item]);
        } catch (e) {
            debugL.error(e);
        }

        resolve();
    });
}

function flushIf() {
    if(!itemsL.last_flush || timeNow(true) - itemsL.last_flush > appL.threshold) {
        itemsL.last_flush = timeNow(true);
        itemsL.flushProcessing();
    }
}

function hasLocalVariant(item) {
    return new Promise(async (resolve, reject) => {
        let has_local = false;

        if (item && item.id in items.variants) {
            let variants = items.variants[item.id];

            for(let k in variants) {
                let variant = variants[k];

                if(variant && variant.local_url) {
                    //check if path is still valid

                    let is_valid = await checkIfPathExists(variant.local_url);

                    if(!is_valid) {
                        return resolve(false);
                    }

                    has_local = true;
                    break;
                }
            }
        }

        return resolve(has_local);
    });

}

function mergeData() {
    return new Promise(async (resolve, reject) => {
        let items_data = items.data;

        let merged_items = [];

        for(let k in items_data) {
            let item = items_data[k];

            if(!(itemsL.includeLogic(item))) {
                continue;
            }

            if(item.id in itemsL.variants) {
                //is referenced image in same location
                // if(!(await hasLocalVariant(item) ) ) {
                //     continue;
                // }

                merged_items.push(item);
            }
        }

        cacheL.setItems(merged_items);

        resolve(merged_items);
    });
}

function getItems() {
    return new Promise(async(resolve, reject) => {
        let partitions;
        
        try {
            partitions = await dbL.loadPartitionFiles(items.table_names.items);
        } catch (e) {
            return reject();
        }

        for (let k in partitions) {
            let partition = partitions[k];
            items.data = Object.assign(items.data, partition);
        }

        let values = Object.values(items.data);

        for(let i = 0; i < values.length; i++) {
            let item = values[i];

            //md5s
            if(item.md5) {
                items.md5s[item.md5] = item;
            }
        }

        resolve();

    });
}

function getVariants() {
    return new Promise(async(resolve, reject) => {
        let partitions = await dbL.loadPartitionFiles(items.table_names.variants);

        for(let k in partitions) {
            let partition = partitions[k];
            items.variants = Object.assign(items.variants, partition);

        }

        resolve();
    });
}

function getItem(item_id) {
    return items.data[item_id];
}

function getDeviceSrc(item_id) {
    return new Promise(async (resolve, reject) => {
        let item = itemsL.getItem(item_id);

        let data = {
            device_src: null,
            item: item
        };

        if(!item) {
            return resolve(data);
        }

        if(item.id in itemsL.variants && itemsL.variants[item.id][imageL.device_variant_name]) {
            data.device_src = itemsL.variants[item.id][imageL.device_variant_name].local_url;
            data.device_src = imageL.normalizeUrl(data.device_src);

            return resolve(data);
        }

        //create
        try {
            let variant = await filesL.getFullScreenImage(item_id);

            if(variant && variant.local_url) {
                data.device_src = variant.local_url;
            }
        } catch (e) {
            return reject(e);
        }

        resolve(data);
    });
}

function getCount() {
    let count = 0;

    for(let item_id in itemsL.data) {
        count++;
    }

    return count;
}

function includeLogic(item) {
    if(!item || item.deleted) {
        return false;
    }

    if(!item.width && !item.height) {
        return false;
    }

    if(item.width < 500 && item.height < 500) {
        return false;
    }

    return true;
}

function resetData() {
    items.app = [];
    items.md5s = {};
    items.data = {};
    items.variants = {};
    items.new.items = [];
    items.new.variants = [];
    items.updated.items = [];
    items.updated.variants = [];

    module.exports.last_flush = null;
    module.exports.data = items.data;
    module.exports.variants = items.variants;
    module.exports.md5s = items.md5s;
    module.exports.new = items.new;
    module.exports.updated = items.updated;
}

module.exports = {
    last_flush: null,
    data: items.data,
    variants: items.variants,
    md5s: items.md5s,
    new: items.new,
    updated: items.updated,
    wsItems: items.wsItems,
    getItem: getItem,
    getItems: getItems,
    getVariants: getVariants,
    addUpdateItem: addUpdateItem,
    addUpdateVariant: addUpdateVariant,
    createThumbnail: createThumbnail,
    createImageThumb: createImageThumb,
    flushProcessing: flushProcessing,
    updateItem: updateItem,
    getThumbDirPath: getThumbDirPath,
    flushIf: flushIf,
    mergeData: mergeData,
    getLife: getLife,
    getLifeItem: getLifeItem,
    getDeviceSrc: getDeviceSrc,
    resetData: resetData,
    getCount: getCount,
    includeLogic: includeLogic
};