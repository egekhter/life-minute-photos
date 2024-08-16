let variants = {
    device: 'device',
    thumb: 'thumb'
};

module.exports = {
    variants: {
        device: variants.device,
        thumb: variants.thumb
    },
    placeholderImg: './img/vhs.png',
    device_variant_name: 'device',
    processing: {
        max_queue: 2,
        queue: [],
        finished: {}
    },
    variantOrder: {
        thumb: [variants.thumb],
        grid: {
            '1k': [variants.thumb, variants.device],
            '2k': [variants.thumb, variants.device]
        },
        full: {
            '4k': [variants.device, variants.thumb],
        }
    },
    threshold: {
        '4k': 1200,
        '2k': 720
    },
    getThumb: function (item) {
        return new Promise(async (resolve, reject) => {
            if(typeof (item) === 'string' || typeof (item) === 'number') {
                item = itemsL.data[item];
            }

            let url;

            for(let k in imageL.variantOrder.thumb) {
                let variant = imageL.variantOrder.thumb[k];

                try {
                    if(item.id in itemsL.variants && variant in itemsL.variants[item.id]) {
                        if(itemsL.variants[item.id][variant]['local_url']) {
                            url = itemsL.variants[item.id][variant]['local_url'];
                        }
                    }
                } catch (e) {
                }

                if(url) {
                    break;
                }
            }

            if(url) {
                url = imageL.normalizeUrl(url);
            }

            return resolve(url);
        });
    },
    normalizeUrl: function(url) {
        if(url) {
            if(is_windows) {
                url = getWindowsPath(url, true);
            }

            return url;
        }

        return null;
    },
    getUrl(item, gridcols, fullscreen) {
        let col_width;

        if(typeof (item) === 'string' || typeof (item) === 'number') {
            item = itemsL.data[item];
        }

        if(!item) {
            return imageL.placeholderImg;
        }

        let url;
        let variant_order = imageL.variantOrder.grid['1k'];

        let device_multiplier = styleL.screen.devicePixelRatio ? styleL.screen.devicePixelRatio : 1;

        if(gridcols) {
            gridcols = Number.parseInt(gridcols);
            col_width = (styleL.screen.width.current * device_multiplier) / gridcols;
        }

        if(fullscreen || (col_width && col_width >= imageL.threshold['4k'])) {
            variant_order = imageL.variantOrder.full['4k'];
        } else if((col_width && col_width >= imageL.threshold['2x'])) {
            variant_order = imageL.variantOrder.grid['2k'];
        }

        for(let k in variant_order) {
            let variant = variant_order[k];

            if(item.id in itemsL.variants && variant in itemsL.variants[item.id]) {
                if(itemsL.variants[item.id][variant]['local_url']) {
                    url = itemsL.variants[item.id][variant]['local_url'];
                }
            }

            if(url) {
                break;
            }
        }

        if(url) {
            url = imageL.normalizeUrl(url);
            return url;
        }

        return imageL.placeholderImg;
    },
    getSources(item_id, num_cols, is_fullscreen) {
        num_cols = Number.parseInt(num_cols);

        return new Promise(async (resolve, reject) => {
            let sources = {
                local: null
            }

            sources.local = imageL.getUrl(item_id, num_cols, is_fullscreen);

            resolve(sources);
        });
    },
    resetData: function () {
        module.exports.processing.queue = [];
        module.exports.processing.finished = {};
    }
}