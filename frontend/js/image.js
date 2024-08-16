let variantNames = {
    thumb: 'thumb',
    device: 'device'
};

photosApp.image = {
    prevent_load: false,
    preloadHeights: 1.5,
    variants: {
        device: variantNames.device,
        thumb: variantNames.thumb
    },
    variantOrder: {
        thumb: [variantNames.thumb],
        grid: {
            '1k': [variantNames.thumb, variantNames.device],
            '2k': [variantNames.thumb, variantNames.device],
        },
        full: {
            '4k': [variantNames.device, variantNames.thumb],
        }
    },
    threshold: {
        '2k': 720,
        '4k': 1200
    },
    getUrl(item, gridcols, fullscreen) {
        let col_width;

        if(typeof (item) === 'string' || typeof (item) === 'number') {
            item = photosApp.items.local.items[item];
        }

        if(!item) {
            return photosApp.placeholderImg;
        }

        let url;
        let variant_order = photosApp.image.variantOrder.grid['1k'];
        let device_multiplier = window.devicePixelRatio ? window.devicePixelRatio : 1;

        if(gridcols) {
            gridcols = Number.parseInt(gridcols);
            col_width = (photosApp.style.screen.width.current * device_multiplier) / gridcols;
        }

        if(fullscreen || (col_width && col_width >= photosApp.image.threshold['4k'])) {
            variant_order = photosApp.image.variantOrder.full['4k'];
        } else if((col_width && col_width >= photosApp.image.threshold['2k'])) {
            variant_order = photosApp.image.variantOrder.grid['2k'];
        }

        for(let k in variant_order) {
            let variant = variant_order[k];

            if(item.id in photosApp.items.local.variants && variant in photosApp.items.local.variants[item.id]) {
                if(photosApp.items.local.variants[item.id][variant]['local_url']) {
                    url = photosApp.items.local.variants[item.id][variant]['local_url'];
                }
            }

            if(url) {
                break;
            }
        }

        if(url) {
            url = photosApp.image.normalizeUrl(url);
            return url;
        }

        return photosApp.placeholderImg;
    },
    normalizeUrl: function(url) {
        if(!url) {
            return null;
        }

        if(url.includes('data:')) {
            return url;
        }

        if(is_windows) {
            url = getWindowsPath(url, true);
        }

        return url;
    },
    timeObserve(el) {
        if(typeof el === 'string') {
            el = document.getElementById(el);
        }
        const images = el.querySelectorAll(`[class*='__image']`);

        photosApp.observer = [];

        const options = {
            // If the image gets within px in the Y axis, start the download.
            root: el, // Page as root
            rootMargin: photosApp.style.screen.height.current * photosApp.image.preloadHeights + 'px',
            threshold: 0
        };

        const handleIntersection = (entries, observer) => {
            // devConsole(entries, observer);
            entries.forEach(entry => {
                if(entry.isIntersecting) {
                    loadGridImage(entry.target);
                }
            })
        };

        const observer = new IntersectionObserver(handleIntersection, options);

        images.forEach(img => {
            observer.observe(img);
        });
    },
    getDeviceSrc: function (item_id) {
        return new Promise(async(resolve, reject) => {
            let device_src, filename, item, device_variant;

            try {
                //check if in cache
                if(item_id in photosApp.items.local.variants && photosApp.items.local.variants[item_id][photosApp.image.device_variant_name]) {
                    device_src = photosApp.items.local.variants[item_id][photosApp.image.device_variant_name].local_url;

                    return resolve(photosApp.image.normalizeUrl(device_src));
                }

                let r = await axios.get(`${photosApp.backend.host}items/${item_id}/device`);

                let data = r.data;

                item = data.item;

                if(!item) {
                    return resolve(null);
                }

                return resolve(data.device_src);
            } catch (e) {
                return reject(e);
            }
        });
    },
    level3Observe: function (id) {
        const images = document.getElementById(id).querySelectorAll("[class*='image']");

        const options = {
            // If the image gets within px in the Y axis, start the download.
            root: document.getElementById('level-3-content'), // Page as root
            rootMargin: photosApp.style.screen.height.current * photosApp.image.preloadHeights + 'px',
            threshold: 0
        };

        const handleIntersection = (entries, observer) => {
            entries.forEach(entry => {
                if(entry.isIntersecting) {
                    // devConsole(entry.intersectionRatio);
                    loadMetadataImage(entry.target)
                }
            })
        };

        const observer = new IntersectionObserver(handleIntersection, options);

        images.forEach(img => {
            observer.observe(img);
        })
    },
    fullscreenObserve: function () {
        const images = photosApp.app.els.fullscreen.querySelectorAll(`.${photosApp.fullscreen.img_class}`);

        const options = {
            // If the image gets within px in the X axis, start the download.
            root: photosApp.app.els.fullscreen, // Page as root
            rootMargin: photosApp.style.screen.width.current * 2 + 'px',
            threshold: 0
        };

        const handleIntersection = (entries, observer) => {
            entries.forEach(entry => {
                if(entry.isIntersecting) {
                    // devConsole(entry.intersectionRatio);
                    loadFullscreenImage(entry.target)
                }
            })
        };

        const observer = new IntersectionObserver(handleIntersection, options);

        images.forEach(img => {
            observer.observe(img);
        })
    },
    getSources: function (item_id, num_cols, is_fullscreen) {
        return new Promise(async (resolve, reject) => {
            let skip_backend = false;

            let sources = {
                local: null
            }

            if(item_id in photosApp.items.local.items && item_id in photosApp.items.local.variants && Object.keys(photosApp.items.local.variants[item_id]).length) {
                skip_backend = true;
            }

            if(!skip_backend) {
                try {
                    let r = await axios.get(`${photosApp.backend.host}items/${item_id}/sources?num_cols=${num_cols}&is_fullscreen=${is_fullscreen}`);
                    sources = r.data;
                } catch (e) {
                    return reject(e);
                }

            } else {
                sources.local = photosApp.image.getUrl(item_id, num_cols, is_fullscreen);
            }

            resolve(sources);
        });
    },
};

function fetchImage (url) {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.src = photosApp.image.normalizeUrl(url);

        image.onload = function () {
            resolve(url);
        };

        image.onerror = function () {
            reject();
        };
    });
}

async function loadMetadataImage(image, skip_fetch) {
    let src = image.dataset.src;

    src = photosApp.image.normalizeUrl(src);

    if(skip_fetch) {
        image.style.backgroundImage = `url("${src}")`;
        return;
    }

    try {
        await fetchImage(src);
        image.style.backgroundImage = `url("${src}")`;
    } catch(e) {
        devConsole("could not fetch metadata image: " + src);
    }
}

function imageProcessLogic (image, files) {
    return new Promise(async(resolve, reject) => {
        let urls = ``;

        for(const index in files) {
            let file = files[index];

            if (!file.url) {
                continue;
            }

            try {
                if(image.tagName === 'IMG' && image.src === file.url) {
                    //do nothing
                } else if(image.style.backgroundImage.indexOf(file.url) > -1) {
                    // do nothing
                } else {
                    await fetchImage(file.url);
                }
            } catch (e) {
                continue;
            }

            urls += `url('${file.url}')`;

            if((index + 1) < files.length) {
                urls += ', ';
            }
        }

        if(!urls) {
            return reject();
        }

        if(image.tagName === 'IMG') {
            image.src = file.url;
        } else {
            if(image.style.backgroundImage.indexOf(urls) === -1) {
                image.style.backgroundImage = urls;
            }
        }

        resolve();
    });
}

function loadGridImage(image) {
    return new Promise(async (resolve, reject) => {
        let sources, num_cols;

        if(photosApp.image.prevent_load) {
            return resolve();
        }

        const item_id = image.getAttribute('data-item-id');

        if(!item_id) {
            devConsole("No item id loading grid image", image);
            return ;
        }

        num_cols = Number.parseInt(image.getAttribute('col-length'));

        try {
            sources = await photosApp.image.getSources(item_id, num_cols);
        } catch (e) {
            return reject(e);
        }

        //do not update to prevent flicker if previously loaded
        if(photosApp.cache.itemIds.indexOf(item_id) > -1) {
            let existingStyleSrc = image.getAttribute('style');

            if(existingStyleSrc) {
                if(existingStyleSrc.indexOf(sources.local) > -1) {
                    photosApp.view.removeDisplayFirst(image);

                    return false;
                }
            }
        }

        if(!sources.local && !sources.thumb) {
            return false;
        }

        let load_order = [
            [{url: sources.local, isLocal: true}], //1st
        ];

        for(const index in load_order) {
            let srcs = load_order[index];

            try {
                await imageProcessLogic(image, srcs);

                if(photosApp.cache.itemIds.indexOf(item_id) === -1) {
                    photosApp.cache.itemIds.push(item_id);
                }

                photosApp.view.removeDisplayFirst(image);

                break;
            } catch (e) {
                if(e) {
                    devConsole(e);
                }
            }
        }
    });
}

async function loadFullscreenImage(image) {
    return new Promise(async(resolve, reject) => {
        let device_src, sources;

        const item_id = image.getAttribute('data-item-id');

        try {
            device_src = await photosApp.image.getDeviceSrc(item_id);
        } catch (e) {
            // console.error(e);
        }

        if(!item_id) {
            devConsole("No item id fullscreen", image);
            return ;
        }

        try {
            sources = await photosApp.image.getSources(item_id, null, true);
        } catch (e) {
            return reject(e);
        }

        let load_order = [
            [{url: device_src, isLocal: true}], //1st
            [{url: sources.local, isLocal: true}], //2nd
        ];

        let break_loop = false;

        for(const index in load_order) {
            if(break_loop) {
                break;
            }

            let srcs = load_order[index];

            try {
                let src = await imageProcessLogic(image, srcs);
                break_loop = true;
                removeClassEl('hq-loading', image.closest('.slide').querySelector('.fullscreen-background'));
                return resolve(src);
            } catch (err) {
                if(err) {
                    devConsole(err);
                }
            }
        }
    });
}



