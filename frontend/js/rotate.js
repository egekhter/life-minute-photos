photosApp.rotate = {
    name: 'rotate',
    viewInt: 0,
    refresh_time: 30, //seconds
    last_updated: null,
    int_keys_ip: {},
    pause_rotate: false,
    transition: {
        time_percent: .8, //of time on screen
        max_duration: 2000 //ms

    },
    init: function() {
        return new Promise(async (resolve, reject) => {
            if(!photosApp.settings.data.rotate) {
                photosApp.rotate.rotateLogic(true);
            }

            resolve();
        });
    },
    async updateTime() {
        if(!photosApp.grid.life.length) {
            return false;
        }

        let current_view_int = ++photosApp.rotate.viewInt;

        devConsole("Updating time, view int: ", current_view_int);

        //start rotate
        let gridIndex = 0;

        for(let row = 0; row < photosApp.grid.life.length; row++) {
            let row_cols = photosApp.grid.life[row];

            for(let col = 0; col < row_cols.length; col++) {
                photosApp.rotate.startTimeout(gridIndex, current_view_int, true);
                gridIndex++;
            }
        }
    },
    getRotateTiming: function (itemsCount) {
        let time_minutes_seconds = photosApp.time.minutes * 60;

        let time_transition_total_seconds = time_minutes_seconds * photosApp.rotate.transition.time_percent;

        let time_transition_each_ms = (time_transition_total_seconds * 1000) / itemsCount;

        if(time_transition_each_ms > photosApp.rotate.transition.max_duration) {
            time_transition_each_ms = photosApp.rotate.transition.max_duration;
            time_transition_total_seconds = (time_transition_each_ms / 1000) * itemsCount;
        }

        let time_screen_total_seconds = time_minutes_seconds -time_transition_total_seconds;

        let time_screen_each_ms = (time_screen_total_seconds * 1000) / itemsCount;

        return {
            transition: time_transition_each_ms,
            screen: time_screen_each_ms
        }
    },
    startTimeout: async function(gridIndex, viewInt, delayStart) {
        function getNextItem() {
            return new Promise(async (resolve, reject) => {
                let intervalRef, next_int;

                intervalRef = photosApp.time.intervalLoop;

                if(gridIndex in intervalRef) {
                    next_int = intervalRef[gridIndex] + 1;
                } else {
                    intervalRef[gridIndex] = 0;
                    next_int = 1;
                }

                item_next = await photosApp.items.getLife(gridIndex, shown_element_order, next_int);

                devConsole({
                    item_next_id: item_next.id
                });

                resolve(item_next);
            });
        }

        let shown_element, opposite_element, all_key_elements, shown_element_order, opposite_image_order, item_shown, item_opposite, item_next, item_id_shown, item_id_opposite;

        if(viewInt !== photosApp.rotate.viewInt || photosApp.app.is_fullscreen || photosApp.slideshow.in_slideshow) {
            return;
        }

        if(!photosApp.app.doRotate() || photosApp.app.update_in_progress) {
            return setTimeout(function () {
                photosApp.rotate.startTimeout(gridIndex, viewInt, delayStart);
            }, 2000);
        }

        let grid = photosApp.grid.getGridByIndex(gridIndex);

        if(grid.count === 1) {
            return setTimeout(function () {
                photosApp.rotate.startTimeout(gridIndex, viewInt, delayStart);
            }, 1000);
        }

        let timing = photosApp.rotate.getRotateTiming(grid.count);

        let element_id = `life-${gridIndex}`;

        try {
            shown_element = document.getElementById(element_id).querySelector('.show');
            shown_element.style.transition = `opacity ${timing.transition}ms ease-in-out`;
        } catch (e) {
        }

        let time_screen_each_ms = timing.screen;

        if(delayStart) {
            time_screen_each_ms += getRndInteger(photosApp.time.intervals.addRandom.min, photosApp.time.intervals.addRandom.max);
        }

        // console.log(timing);

        //timeout 1
        await timeoutAwait(async function () {
            //exit if view int has changed or internal app logic
            if(viewInt !== photosApp.rotate.viewInt) {
                return false;
            }

            if(!photosApp.app.doRotate() || photosApp.app.update_in_progress) {
                photosApp.rotate.startTimeout(gridIndex, viewInt);
                return false;
            }

            try {
                all_key_elements = document.getElementById(element_id).querySelectorAll("[class*='image']");
                shown_element = document.getElementById(element_id).querySelector('.show');
            } catch (e) {
                return photosApp.rotate.startTimeout(gridIndex, viewInt);
            }

            if(!shown_element && all_key_elements.length >= 2) {
                shown_element = all_key_elements[0];
                addClassEl('show', shown_element);
            } else if(!shown_element) {
                return photosApp.rotate.startTimeout(gridIndex, viewInt);
            }

            if(shown_element.parentElement.classList.contains(photosApp.style.classes.display_first)) {
                return photosApp.rotate.startTimeout(gridIndex, viewInt);
            }

            for(let i = 0; i < all_key_elements.length; i++) {
                if(all_key_elements[i] !== shown_element) {
                    opposite_element = all_key_elements[i];
                    opposite_element.style.transition = `opacity ${timing.transition}ms ease-in-out`;
                }
            }

            item_id_shown = shown_element.getAttribute('data-item-id');
            item_id_opposite = opposite_element.getAttribute('data-item-id');

            //do not change if item ids are same
            if(item_id_shown === item_id_opposite) {
                let test_next = await getNextItem();

                if(test_next.id === Number.parseInt(item_id_shown)) {
                    return photosApp.rotate.startTimeout(gridIndex, viewInt);
                }
            }

            //do not change images if both images not loaded
            let do_switch_images = true;

            for(let i = 0; i < all_key_elements.length; i++) {
                let img = all_key_elements[i];

                if(photosApp.cache.itemIds.indexOf(img.getAttribute('data-item-id')) === -1) {
                    do_switch_images = false;
                }
            }

            if(!do_switch_images) {
                photosApp.rotate.startTimeout(gridIndex, viewInt);
                return false;
            }

            // do not switch if not ready
            try {
                shown_element_order = Number.parseInt(shown_element.getAttribute('order'));
            } catch (e) {
                return false;
            }

            //add show class to opposite image
            opposite_image_order = 1;

            if(shown_element_order === 1) {
                opposite_image_order = 0;
            }

            //increment interval loop after transition

            item_shown = await photosApp.items.getData(item_id_shown);
            item_opposite = await photosApp.items.getData(item_id_opposite);

            devConsole({
                item_shown: item_id_shown,
                item_opposite: item_id_opposite,
            });

            //handle transition
            //add class fade to visible img

            shown_element.style.transition = `opacity ${timing.transition}ms ease-in-out`;

            shown_element.setAttribute('fade-start', timeNow(true));
            shown_element.classList.add('fade');

            if(viewInt !== photosApp.rotate.viewInt) {
                return false;
            }

            await timeoutAwait(async function () {
                //exit again if view int has changed
                if(viewInt !== photosApp.rotate.viewInt) {
                    return false;
                }

                //if update in progress
                if(!photosApp.app.doRotate() || photosApp.app.update_in_progress) {
                    photosApp.rotate.startTimeout(gridIndex, viewInt);
                    return false;
                }

                //add show class to opposite image
                opposite_element.classList.add('show');

                await rafAwait();

                //remove all classes from previously shown image
                shown_element.classList.remove('show');
                shown_element.classList.remove('fade');

                photosApp.time.intervalLoop[gridIndex] += 1;

                //change img url of previously shown image to next image
                try {
                    item_next = await getNextItem();
                } catch(e) {
                    console.error(e);
                }

                if(typeof item_next.id === 'undefined') {
                    return;
                }

                let is_portrait = false;

                if(item_next.is_photo && item_next.height > item_next.width) {
                    is_portrait = true;
                }

                if(is_portrait) {
                    shown_element.classList.add(photosApp.style.classes.is_portrait);
                } else {
                    shown_element.classList.remove(photosApp.style.classes.is_portrait);
                }

                shown_element.setAttribute('data-item-id', item_next.id);
                shown_element.setAttribute('data-src', photosApp.image.getUrl(item_next));
                loadGridImage(shown_element);

                // call self to show next image
                photosApp.rotate.startTimeout(gridIndex, viewInt);
            }, timing.transition);
        }, time_screen_each_ms);

        //going into next interval
    },
    setRotate: async function (bool) {
        photosApp.settings.data.rotate = bool;
        photosApp.settings.saveSettings('rotate', bool);

        if(bool) {
            photosApp.rotate.updateTime();
        }
    },
    rotateLogic: function (skip_set) {
        let rotate_el = document.getElementById('rotation-control');

        let play = rotate_el.querySelector('.icon-play');
        let pause = rotate_el.querySelector('.icon-pause');

        toggleElClass(play, 'visible');
        toggleElClass(pause, 'visible');

        if(elHasClass(play, 'visible')) {
            if(!skip_set) {
                photosApp.rotate.setRotate(true);
            }
        } else {
            if(!skip_set) {
                photosApp.rotate.setRotate(false);
            }
        }
    }
};