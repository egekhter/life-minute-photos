photosApp.fullscreen = {
    default_transition: 333,
    open_image_transition: 333,
    spinnerTimeouts: [],
    init_finished: false,
    img_class: 'fullscreen-image',
    events_class: 'slide-events',
    minimumDetectSwipe: 30, //px
    interactTimeout: 1500,
    maxItems: 10,
    num_slides_buffer: 3,
    touchstartx: null,
    touchstarty: null,
    touchstart_int: -1,
    wrapperEl: null,
    currentSlide: null,
    currentImage: null,
    currentBackground: null,
    items: null,
    side_scale_ratio: .2,
    controls: {
        transition: 200,
    },
    item_ids: {
        list: [],
        slides: [],
        current: null
    },
    dimensions: {
        max: 2160,
        maxDefault: 2160
    },
    exit: {
        preventTimeout: 150,
        in_progress: false,
        init_called: false,
        transition_ip: false,
        startX: null,
        startY: null,
        currentY: null,
        swipeDirection: null,
        exit_duration: 400,
        change_threshold: {
            px: 350,
            percent: .5,
            speed: .5
        },
        startThreshold: 30,
    },
    menu: {
        timeouts: []
    },
    pan: {
        transition_duration: 200,
        in_progress: false,
        transition_class: 'pan-transition',
        startX: null,
        startY: null,
        touch_events: [],
        momentum: {
            events_ms_threshold: 100,
            transition_duration: 500,
            max_events: 10,
            deceleration_ratio: .1
        }
    },
    slide: {
        in_progress: false,
        transition_duration: 300,
        events_timeout: 300,
        transition_ip: false,
        change_ip: false,
        direction: null,
        current_wrapper_translate: null,
        tmp_wrapper_translate: null,
        current_slide_translate: null,
        min_translate: null,
        max_translate: null,
        events_ms_threshold: 333,
        change_int: -1, //used to queue slide changes,
        change_queue: [], //works with change_int
        change_threshold: {
            px: 350,
            percent: .5,
            speed: .4
        },
        touch_events: [],
        allow: true
    },
    zoom: {
        in_progress: false,
        toggle_ip: false,
        scale: {
            original: null,
            current: null,
            zoom_start: null,
            distance_start: null,
            startX: null,
            startY: null,
        },
        timeout: 500,
        maxDefault: 3000,
        maxPx: 3000,
        double_click_threshold: 333,
        double_tap_threshold: 100,
        last_click: null,
        pointers: {},
        transition_duration: 350,
        scale_low_duration: 250
    },
    scroll: {
        allow: true
    },
    metadata: {
        ip: {
            deleteItem: {},
        }
    },
    mouse: {
        down: {
            active: false
        }
    },
    open_image_url: null,
    background_change_ints: [],
    open_in_progress: false,
    open: async function (event, context) {
        if(photosApp.fullscreen.open_in_progress || photosApp.fullscreen.exit.in_progress) {
            devConsole({
                prevented_fullscreen_open: {
                    open_in_progress: photosApp.fullscreen.open_in_progress,
                    exit_in_progress: photosApp.fullscreen.exit.in_progress
                }
            });

            return false;
        }

        photosApp.app.els.fullscreen.style.removeProperty('display');

        photosApp.fullscreen.setOpenInProgress(true);

        photosApp.fullscreen.clearBackgroundInts();

        event.preventDefault();
        event.stopPropagation();

        photosApp.app.is_fullscreen = true;

        photosApp.fullscreen.initProps();

        const images = context.querySelectorAll(`[class*='__image']`);

        photosApp.fullscreen.wrapperEl = photosApp.app.els.fullscreen.querySelector('.slides-wrapper');

        let selected_image = null;

        for(let i = 0; i < images.length; i++) {
            let image = images[i];

            let classes = image.classList.value;

            if(classes.indexOf('show') > -1) {
                if(classes.indexOf('fade') === -1) {
                    selected_image = image;
                } else {
                    let time_now = timeNow(true);
                    let fade_start = Number.parseInt(image.getAttribute('fade-start'));
                    let transition_duration = photosApp.time.intervals.transition;

                    let transition_half = transition_duration / 2;

                    let use_other = false;

                    if(time_now - fade_start > transition_half) {
                        use_other = true;
                    }

                    if(use_other) {
                        if(image === images[0]) {
                            selected_image = images[1];
                        } else {
                            selected_image = images[0];
                        }
                    } else {
                        if(image === images[0]) {
                            selected_image = images[0];
                        } else {
                            selected_image = images[1];
                        }
                    }
                }

                break;
            }
        }

        if(!selected_image) {
            selected_image = context.querySelector('.show');
            if(!selected_image) {
                selected_image = context.querySelector('[class*="image"]');
            }
        }

        let item_id = selected_image.getAttribute('data-item-id');

        let item = photosApp.items.local.items[item_id];

        if(!item || !(item_id in photosApp.items.local.variants)) {
            photosApp.fullscreen.setOpenInProgress(false);
            return photosApp.fullscreen.exitFullscreen();
        }

        let image_transition;

        try {
            let item_w = item.width;
            let item_h = item.height;
            let item_r = item_w / item_h;

            let selected_url = urlFromBackgroundImage(selected_image);

            photosApp.fullscreen.open_image_url = selected_url;

            image_transition = document.getElementById('image-transition');

            image_transition.removeAttribute('style');

            removeClassEl('hide-image', image_transition);

            image_transition.style.background = `url('${selected_url}')`;

            let bcr = selected_image.getBoundingClientRect();
            image_transition.style.width = bcr.width + 'px';
            image_transition.style.height = bcr.height + 'px';
            image_transition.style.top = bcr.top + 'px';
            image_transition.style.left = bcr.left + 'px';
            image_transition.style.backgroundSize = 'contain';
            image_transition.style.backgroundRepeat = 'no-repeat';
            image_transition.style.backgroundPosition = 'center';

            let screen_w = photosApp.style.screen.width.current;
            let screen_h = photosApp.style.screen.height.current;
            let screen_r = screen_w / screen_h;

            let h_ratio = screen_h / bcr.height;
            let w_ratio = screen_w / bcr.width;

            let i_ratio;

            if(item_w > item_h) {
                if(item_r > screen_r) {
                    i_ratio = w_ratio;
                } else {
                    i_ratio = h_ratio * item_r;
                }
            } else {
                if(item_r > screen_r) {
                    i_ratio = w_ratio / item_r;
                } else {
                    i_ratio = h_ratio;
                }
            }

            let middle_x = screen_w / 2;
            let middle_y = screen_h / 2;

            // let col_length = Number.parseInt(selected_image.getAttribute('col-length'));
            // let border_w = (col_length - 1) * photosApp.style.border.cols;

            let transform_l = middle_x - bcr.left - (bcr.width) / 2;
            let transform_t = middle_y - bcr.top - (bcr.height) / 2;

            image_transition.style.transition = `${photosApp.fullscreen.open_image_transition}ms transform`;
            photosApp.app.els.fullscreen.style.transition = `${photosApp.fullscreen.open_image_transition}ms opacity, ${photosApp.fullscreen.open_image_transition}ms visibility`;

            await rafAwait(function () {
                addClassEl('black', document.body);
                addClassEl('fullscreen', 'app');
                image_transition.style.transform = `translate3d(${transform_l}px, ${transform_t}px, 0) scale(${i_ratio})`;
            });

            await timeoutAwait(null, photosApp.fullscreen.open_image_transition + 16);
        } catch (e) {

        }

        photosApp.app.hideDateMenu();
        photosApp.fullscreen.setInteract(false);
        photosApp.rotate.viewInt++;

        try {
            await photosApp.fullscreen.setItems();
        } catch (e) {
            console.error(e);
        }

        photosApp.fullscreen.wrapperEl.innerHTML = '';
        photosApp.fullscreen.item_ids.slides = [];
        photosApp.fullscreen.item_ids.current = null;

        photosApp.app.preventScroll(true);

        try {
            await photosApp.fullscreen.slidesInit(item_id);
        } catch (e) {
            console.error(e);
        }

        addClassEl('active', photosApp.app.els.fullscreen);

        photosApp.style.removeFullscreenSheet();
        photosApp.style.addFullscreenSheet();

        requestAnimationFrame(function () {
            addClassEl('none', 'main');

            setTimeout(function () {
                addClassEl('hide-image', image_transition);
                changeElClass(photosApp.app.els.fullscreen, 'show-image', true);
                photosApp.fullscreen.events();
                photosApp.fullscreen.init_finished = true;
                photosApp.fullscreen.setOpenInProgress(false);

            }, 50);
        });
    },
    initProps: function () {
        photosApp.fullscreen.init_finished = false;
        photosApp.fullscreen.mouse.down.active = false;
        photosApp.fullscreen.exit.in_progress = false;
        photosApp.fullscreen.exit.transition_ip = false;
        photosApp.fullscreen.pan.in_progress = false;
        photosApp.fullscreen.slide.in_progress = false;
        photosApp.fullscreen.slide.transition_ip = false;
        photosApp.fullscreen.zoom.in_progress = false;
        photosApp.fullscreen.slide.change_queue = [];
        photosApp.fullscreen.touchstartx = null;
        photosApp.fullscreen.touchstarty = null;

        photosApp.fullscreen.allowSlide(true);
    },
    slidesInit: async function(item_id) {
        return new Promise(async (resolve, reject) => {
            item_id = Number.parseInt(item_id);

            try {
                await photosApp.fullscreen.createSlides(item_id);
            } catch (e) {
                console.error(e);
            }

            photosApp.fullscreen.slideChangeLogic(item_id);

            resolve();
        });

    },
    slideChangeLogic: async function(item_id, prev_item_id, direction) {
        return new Promise(async (resolve, reject) => {
            item_id = Number.parseInt(item_id);

            photosApp.fullscreen.item_ids.current = item_id;

            photosApp.view.fullscreenActions(item_id);

            photosApp.fullscreen.setCurrentEls(item_id);

            let add_num_slides = 0;
            let num_slides_remove = 0;
            let num_slides = photosApp.fullscreen.item_ids.slides.length;
            let item_ids_remove = [];

            if(prev_item_id) { //if we have a previous item, that means we are changing slides
                let slide_index_current = photosApp.fullscreen.item_ids.slides.indexOf(item_id);

                if(direction === 'l') {
                    if(slide_index_current <= photosApp.fullscreen.num_slides_buffer) {
                        add_num_slides = (photosApp.fullscreen.num_slides_buffer - slide_index_current) + 1;
                    }

                    if(add_num_slides > 0) {
                        await photosApp.fullscreen.createSlides(item_id, add_num_slides);
                    }

                    //remove slides at right
                    let all_slides = photosApp.fullscreen.wrapperEl.getElementsByClassName('slide');
                    let new_slide_offset = all_slides.length - num_slides;

                    let slides_right = (all_slides.length - 1) - (slide_index_current + new_slide_offset);

                    if(slides_right > photosApp.fullscreen.num_slides_buffer) {
                        num_slides_remove = slides_right - photosApp.fullscreen.num_slides_buffer;
                    }

                    let highest_index = all_slides.length - 1;

                    for(let i = 0; i < num_slides_remove; i++) {
                        let item_id = photosApp.fullscreen.item_ids.slides[highest_index];
                        item_ids_remove.push(item_id);
                        let slide = photosApp.fullscreen.wrapperEl.querySelector('#slide-' + item_id);

                        await rafAwait(function () {
                            removeMediaSrc(slide.querySelector(`.${photosApp.fullscreen.img_class}`));
                            removeMediaSrc(slide.querySelector('.fullscreen-background'));

                            slide.parentNode.removeChild(slide);
                            highest_index--;
                        });
                    }

                    //remove item_id from slides array
                    for(const i in item_ids_remove) {
                        await rafAwait(function () {
                            let item_id = item_ids_remove[i];
                            photosApp.fullscreen.item_ids.slides.splice(photosApp.fullscreen.item_ids.slides.indexOf(item_id), 1);
                        });
                    }
                } else if(direction === 'r') {
                    if((num_slides - slide_index_current - 1) <= photosApp.fullscreen.num_slides_buffer) {
                        add_num_slides = (photosApp.fullscreen.num_slides_buffer - (num_slides - slide_index_current));
                    }

                    if(add_num_slides > 0) {
                        await photosApp.fullscreen.createSlides(item_id, null, add_num_slides);
                    }

                    let slides_left = slide_index_current;

                    if(slides_left > photosApp.fullscreen.num_slides_buffer) {
                        num_slides_remove = slides_left - photosApp.fullscreen.num_slides_buffer;
                    }

                    let lowest_index = 0;

                    for(let i = 0; i < num_slides_remove; i++) {
                        let item_id = photosApp.fullscreen.item_ids.slides[lowest_index];
                        item_ids_remove.push(item_id);
                        let slide = photosApp.fullscreen.wrapperEl.querySelector('#slide-' + item_id);

                        await rafAwait(function () {
                            removeMediaSrc(slide.querySelector(`.${photosApp.fullscreen.img_class}`));
                            removeMediaSrc(slide.querySelector('.fullscreen-background'));
                            slide.parentNode.removeChild(slide);
                            num_slides_remove--
                            lowest_index++;
                        });
                    }

                    //remove item_id from slides array
                    for(const i in item_ids_remove) {
                        await rafAwait(function () {
                            let item_id = item_ids_remove[i];
                            photosApp.fullscreen.item_ids.slides.splice(photosApp.fullscreen.item_ids.slides.indexOf(item_id), 1);
                        });
                    }
                }
            }

            photosApp.fullscreen.updateTransforms(item_id);

            if(add_num_slides > 0) {
                devConsole("new slides added");
                photosApp.fullscreen.newSlideEvents();
            }

            photosApp.fullscreen.activateDeactivateSlideButtons();


            resolve();
        });
    },
    setCurrentEls: function(item_id) {
        photosApp.fullscreen.setCurrentSlide(item_id);
        photosApp.fullscreen.setCurrentImage();
        photosApp.fullscreen.setCurrentBackground();
    },
    setItems: async function() {
        return new Promise(async (resolve, reject) => {
            photosApp.fullscreen.item_ids.list = [];
            photosApp.fullscreen.items = [];

            let items;

            try {
                let r = await axios.get(`${photosApp.backend.host}fullscreen/items`);
                items = r.data;
            } catch (e) {
                return reject(e);
            }

            for(let id of items) {
                if(id in photosApp.items.local.items) {
                    photosApp.fullscreen.item_ids.list.push(id);
                    photosApp.fullscreen.items.push(photosApp.items.local.items[id]);
                }
            }

            resolve();
        });
    },
    createSlides(item_id, left_of, right_of) {
        function addItemsToArr(items, arr) {
            return new Promise(async (resolve, reject) => {
                for(let k in items) {
                    let slide_4k, slide_url;

                    let item = items[k];

                    let slide_html = null;

                    if(item.is_photo) {
                        try {
                            let sources = await photosApp.image.getSources(item.id, null);
                            slide_url = sources.local;
                        } catch (e) {
                            return reject(e);
                        }

                        //use same image for background as used for entry transition

                        if(item.id === item_id && photosApp.fullscreen.open_image_url) {
                            slide_url = photosApp.fullscreen.open_image_url;

                            //set to null
                            photosApp.fullscreen.open_image_url = null;
                        }

                        try {
                            let sources = await photosApp.image.getSources(item.id, null, true);
                            slide_4k = sources.local;
                        } catch (e) {
                            return reject(e);
                        }

                        let image_calc = photosApp.fullscreen.getImageCalc(item);

                        if(!image_calc.max_height) {
                            devConsole("No height, ", item);
                        }

                        slide_html = `<div class="image-container">
                                            <div data-src="${slide_4k}" class="${photosApp.fullscreen.img_class}" id="image-${item.id}" 
                                                data-item-id="${item.id}" data-scale-original="${image_calc.scale}" data-scale="${image_calc.scale}" data-scale-max="${image_calc.max_scale}"
                                                data-x-original="${image_calc.transform_left}" data-y-original="${image_calc.transform_top}"
                                                data-x="${image_calc.transform_left}" data-y="${image_calc.transform_top}"
                                                style="transform: translate(${image_calc.transform_left}px, ${image_calc.transform_top}px) scale(${image_calc.scale}); 
                                                width: ${image_calc.max_width}px; height: ${image_calc.max_height}px;"></div>
                                            <div
                                                class="fullscreen-background" 
                                                data-src="${slide_url}"
                                                style="
                                                background-image: url('${slide_url}'); 
                                                transform: scale(1);
                                                ">
                                            </div>
                                      </div>
                                    `;
                    }

                    arr.push(`<div id="slide-${item.id}" class="slide" data-item-id="${item.id}" data-item-index="${photosApp.fullscreen.item_ids.list.indexOf(item.id)}">${slide_html}</div>`);
                }

                resolve();
            });
        }

        return new Promise(async (resolve, reject) => {
            //if left of is greater than 0, add slides from that point
            let insert_before = 'afterbegin';
            let insert_after = 'beforeend';

            let startItemsIndex = photosApp.fullscreen.item_ids.list.indexOf(item_id);

            if(startItemsIndex < 0) {
                return resolve();
            }

            let slidesLeftArr = [];
            let slidesRightArr = [];

            let item_center = photosApp.fullscreen.items[startItemsIndex];
            let itemsLeftArr = [];
            let itemsRightArr = [];

            let totalAppItems = photosApp.fullscreen.item_ids.list.length;
            let itemsToAdd = photosApp.fullscreen.maxItems;

            if(left_of) {
                itemsToAdd = left_of;
            } else if(right_of) {
                itemsToAdd = right_of;
            }

            let itemsLeftNum = Math.floor(itemsToAdd / 2);
            let itemsRightNum = itemsToAdd - itemsLeftNum;

            if(left_of) {
                itemsLeftNum = left_of;
                itemsRightNum = 0;
            } else if(right_of) {
                itemsRightNum = right_of;
                itemsLeftNum = 0;
            }

            //indexes
            let itemsLeftStartIndex = startItemsIndex - itemsLeftNum;

            if(itemsLeftStartIndex < 0) {
                itemsLeftStartIndex = 0;
            }

            let itemsRightStartIndex = startItemsIndex + 1;

            while (itemsLeftNum > 0 && itemsLeftStartIndex >= 0 && itemsLeftArr.length <= itemsLeftNum && itemsLeftStartIndex < startItemsIndex) {
                let item = photosApp.fullscreen.items[itemsLeftStartIndex];


                if(item && photosApp.fullscreen.item_ids.slides.indexOf(item.id) === -1) {
                    itemsLeftArr.push(item);
                }

                itemsLeftStartIndex++;
            }

            while (itemsRightNum > 0 && itemsRightStartIndex !== startItemsIndex && itemsRightArr.length <= itemsRightNum && itemsRightStartIndex <= totalAppItems - 1) {
                let item = photosApp.fullscreen.items[itemsRightStartIndex];

                if(item && photosApp.fullscreen.item_ids.slides.indexOf(item.id) === -1) {
                    itemsRightArr.push(item);
                }

                itemsRightStartIndex++;
            }

            if(!left_of && !right_of) {
                if(photosApp.fullscreen.item_ids.slides.indexOf(item_center.id) === -1) {
                    itemsLeftArr.push(item_center);
                }
            }

            for(let i = itemsLeftArr.length - 1; i >= 0; i--) {
                photosApp.fullscreen.item_ids.slides.unshift(itemsLeftArr[i].id);
            }

            for (let item of itemsRightArr) {
                photosApp.fullscreen.item_ids.slides.push(item.id);
            }

            try {
                await addItemsToArr(itemsLeftArr, slidesLeftArr);
                await addItemsToArr(itemsRightArr, slidesRightArr);
            } catch (e) {
                return reject(e);
            }

            let slides_wrapper = photosApp.fullscreen.wrapperEl;

            for(let i = slidesLeftArr.length - 1; i >= 0; i--) {
                slides_wrapper.insertAdjacentHTML(insert_before, slidesLeftArr[i]);
            }

            for(let slide of slidesRightArr) {
                slides_wrapper.insertAdjacentHTML(insert_after, slide);
            }

            resolve();
        });
    },
    events: function() {
        photosApp.fullscreen.preventScrollEvents();
        photosApp.fullscreen.slideEvents();
        photosApp.fullscreen.navigationEvents();
        photosApp.fullscreen.controlEvents();
        photosApp.fullscreen.exitEvents();
        photosApp.fullscreen.newSlideEvents();
    },
    newSlideEvents: function() {
        photosApp.app.addTapEventListeners(photosApp.app.els.fullscreen);
        photosApp.image.fullscreenObserve();
    },
    allowSlide: function(bool) {
        if(bool && photosApp.fullscreen.mouse.down.active) {
            return false;
        }

        photosApp.fullscreen.slide.allow = bool;
    },
    preventExitEvents(event) {
        let rules = {
            touches: event.touches.length >= 2 && !photosApp.fullscreen.exit.in_progress && !photosApp.fullscreen.exit.transition_ip,
            zoom_ip: photosApp.fullscreen.zoom.in_progress,
            pan_ip: photosApp.fullscreen.pan.in_progress,
            zoom_toggle: photosApp.fullscreen.zoom.toggle_ip,
            slide_ip: photosApp.fullscreen.slide.in_progress,
            slide_change_ip: photosApp.fullscreen.slide.change_ip,
            disable_slide: !photosApp.fullscreen.slide.allow
        };

        let allow_exit = true;

        //prevent by rules
        for(let k in rules) {
            let rule = rules[k];
            if(rule) {
                allow_exit = false;
            }
        }

        //prevent with menu open
        let target = event.target;
        let menu_check = target.closest('.context__menu');

        if(menu_check) {
            allow_exit = false;
        }

        return !allow_exit;
    },
    exitEvents: function () {
        let slidesContainer = photosApp.app.els.fullscreen.querySelector('.slides-container');

        if((slidesContainer.getAttribute('_listener'))) {
            return;
        }

        slidesContainer.setAttribute('_listener', true);

        let handleTouchStart = function(event) {
            devConsole("exit touch start");
            photosApp.fullscreen.exit.touch_events = [];

            // Get the original touch position.

            photosApp.fullscreen.exit.startX = event.touches[0].pageX;
            photosApp.fullscreen.exit.startY = event.touches[0].pageY;
        };

        slidesContainer.addEventListener('touchstart', handleTouchStart);

        let handleTouchMove = function(event) {
            if(photosApp.fullscreen.preventExitEvents(event)) {
                return false;
            }

            let currentX = event.touches[0].pageX;
            let currentY = event.touches[0].pageY;

            photosApp.fullscreen.exit.touch_events.push({
                x: currentX,
                y: currentY,
                t: timeNow(true)
            });

            let diffX = photosApp.fullscreen.exit.startX - currentX;
            let diffY = currentY - photosApp.fullscreen.exit.startY;

            if(diffY > 0) {
                photosApp.fullscreen.exit.swipeDirection = 'd';
            } else {
                photosApp.fullscreen.exit.swipeDirection = 'u';
            }

            let do_exit = false;

            if(photosApp.fullscreen.exit.in_progress) {
                do_exit = true;
            } else if(Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) >= photosApp.fullscreen.minimumDetectSwipe) {
                do_exit = true;
            }

            if(do_exit) {
                if(!photosApp.fullscreen.exit.in_progress) {
                    addClassEl('exit-in-progress', photosApp.app.els.fullscreen);
                }

                photosApp.fullscreen.exit.in_progress = true;

                addClassEl('transition-transform-0', photosApp.app.els.fullscreen);

                removeClassEl('none', 'main');
                removeClassEl('black', document.body);

                let opacity = (1 - (Math.abs(diffY) / photosApp.style.screen.height.current));

                slidesContainer.style.transform = `translateY(${diffY}px)`;
                slidesContainer.setAttribute('data-y', diffY);
                setElOpacity(photosApp.app.els.fullscreen, opacity);
            }
        };

        slidesContainer.addEventListener('touchmove', handleTouchMove);

        let handleTouchEnd = async function(event) {
            devConsole("exit touch end");
            if(!photosApp.fullscreen.exit.in_progress) {
                return false;
            }

            if(photosApp.fullscreen.preventExitEvents(event)) {
                devConsole("Exit end prevented");
                return false;
            }

            function returnToOrigin() {
                addClassEl('black', document.body);

                setElOpacity(photosApp.app.els.fullscreen, 'initial');
                slidesContainer.style.transform = `translateY(0)`;
                slidesContainer.setAttribute('data-y', 0);

                setTimeout(function () {
                    slidesContainer.style.removeProperty('transition');
                }, photosApp.fullscreen.exit.exit_duration);
            }

            //enable transition on slides container
            slidesContainer.style.transition = `${photosApp.fullscreen.exit.exit_duration}ms transform`;
            photosApp.fullscreen.exit.transition_ip = true;

            removeClassEl('transition-transform-0', photosApp.app.els.fullscreen);

            function getYAfterMomentum(speed, y_translate) {
                let speed_multiplier = 16 * 1.5;

                if(Math.abs(speed) < .05 || !Number.isFinite(speed)) {
                    return y_translate;
                }

                let deceleration_ratio = photosApp.fullscreen.pan.momentum.deceleration_ratio;

                let y_location_update = y_translate;

                let prev_y = y_location_update;

                while (Math.abs(speed) >= .05) {
                    y_location_update += speed * speed_multiplier;

                    if(Number.isNaN(y_location_update) || !Number.isFinite(speed) || !Number.isFinite(y_location_update)) {
                        y_location_update = prev_y;
                        break;
                    }

                    speed *= (1 - deceleration_ratio);

                }

                return y_location_update;
            }

            //at end of momentum or during momentum, see if we've passed threshold, if passed, exit, otherwise at end of momentum snap back to original
            //add exit momentum

            let events = [];
            let now = timeNow(true);

            for(let i = 0; i < photosApp.fullscreen.exit.touch_events.length; i++) {
                let event = photosApp.fullscreen.exit.touch_events[i];
                if(now - event.t < photosApp.fullscreen.slide.events_ms_threshold) {
                    events.push(event);
                }
            }

            let y_speed = 0;

            if(events.length > 1) {
                let first_event = events[0];
                let last_event = events[events.length - 1];

                let y_diff = last_event.y - first_event.y;
                let t_diff = last_event.t - first_event.t;
                y_speed = y_diff / t_diff;
            }

            if(Number.isNaN(y_speed)) {
                y_speed = 0;
            }

            //determine direction
            let after_momentum_y = getYAfterMomentum(y_speed, Number.parseInt(slidesContainer.getAttribute('data-y')));

            //calculate % of screen
            let screen_h = photosApp.style.screen.height.current;

            let diff_screen = Math.abs(after_momentum_y) / screen_h;

            let exit_fullscreen = false;

            if(Math.abs(y_speed) > photosApp.fullscreen.exit.change_threshold.speed ||
                Math.abs(after_momentum_y) >= photosApp.fullscreen.exit.change_threshold.px ||
                diff_screen >= photosApp.fullscreen.exit.change_threshold.percent) {
                exit_fullscreen = true;
            }

            if(exit_fullscreen) {
                photosApp.fullscreen.exitFullscreen(y_speed);
            } else {
                addClassEl('none', 'main');
                returnToOrigin();
            }
            setTimeout(function () {
                removeClassEl('exit-in-progress', photosApp.app.els.fullscreen);
                photosApp.fullscreen.exit.in_progress = false;
                photosApp.fullscreen.exit.transition_ip = false;
            }, photosApp.fullscreen.exit.exit_duration);
        };

        slidesContainer.addEventListener('touchend', handleTouchEnd);
        slidesContainer.addEventListener('touchcancel', handleTouchEnd);
    },
    exitFullscreen: function (y_speed) {
        if(photosApp.fullscreen.exit.in_progress || photosApp.fullscreen.open_in_progress) {
            return false;
        }

        photosApp.fullscreen.exit.in_progress = true;

        //remove active from any menu
        let active_action = photosApp.app.els.fullscreen.querySelector('.action.active');

        if(active_action) {
            removeClassEl('active', active_action);
        }

        setElOpacity(photosApp.app.els.fullscreen, 0);

        removeClassEl('none', 'main');
        removeClassEl('black', document.body);

        photosApp.style.setStyles();

        photosApp.app.els.fullscreen.querySelector('.item-actions').removeAttribute('data-item-id');

        let slidesContainer = photosApp.app.els.fullscreen.querySelector('.slides-container');

        if(y_speed && y_speed > 0) {
            slidesContainer.style.transform = `translateY(${photosApp.style.screen.height.current}px)`;
        } else {
            slidesContainer.style.transform = `translateY(${-photosApp.style.screen.height.current}px)`;
        }

        slidesContainer.style.removeProperty('transform');

        slidesContainer.style.removeProperty('transition');

        removeClassEl('active', photosApp.app.els.fullscreen);
        removeClassEl('fullscreen', 'app');

        photosApp.app.preventScroll(false);
        photosApp.fullscreen.setInteract(false);
        photosApp.fullscreen.setSpinner(false);

        photosApp.app.is_fullscreen = false;

        photosApp.app.els.fullscreen.style.removeProperty('opacity');

        setTimeout(function () {
            photosApp.fullscreen.exit.in_progress = false;

            photosApp.fullscreen.clearBackgroundInts();
            photosApp.rotate.updateTime();

            photosApp.app.els.fullscreen.style.display = 'none';

        }, photosApp.navigation.transition);
    },
    onResize: function () {
        if(!photosApp.app.is_fullscreen) {
            return false;
        }

        let queue_prop = 'fullscreen_resize_ts';

        if(!photosApp.fullscreen[queue_prop]) {
            photosApp.fullscreen[queue_prop] = [];
        }

        //limit resize event to 100 ms

        function resize() {
            photosApp.fullscreen.updateTransforms(photosApp.fullscreen.item_ids.current);
            photosApp.style.removeFullscreenSheet();
            photosApp.style.addFullscreenSheet();

            let all_slides = photosApp.app.els.fullscreen.getElementsByClassName('slide');

            let prev_scale, prev_original, prev_w, prev_h;

            if(photosApp.fullscreen.currentImage) {
                prev_scale = Number.parseFloat(photosApp.fullscreen.currentImage.getAttribute('data-scale'));
                prev_original = Number.parseFloat(photosApp.fullscreen.currentImage.getAttribute('data-scale-original'));
            }

            for(let i = 0; i < all_slides.length; i++) {
                let slide = all_slides[i];

                let item_id = slide.getAttribute('data-item-id');

                let slide_image = slide.querySelector(`.${photosApp.fullscreen.img_class}`);

                let image_calc;

                if(slide_image) {
                    image_calc = photosApp.fullscreen.getImageCalc(item_id);
                    slide_image.setAttribute('data-scale-max', image_calc.max_scale);
                    slide_image.setAttribute('data-scale-original', image_calc.scale);
                    slide_image.setAttribute('data-scale', image_calc.scale);
                    slide_image.setAttribute('data-x-original', image_calc.transform_left);
                    slide_image.setAttribute('data-x', image_calc.transform_left);
                    slide_image.setAttribute('data-y-original', image_calc.transform_top);
                    slide_image.setAttribute('data-y', image_calc.transform_top);
                    slide_image.style.transform = `translate(${image_calc.transform_left}px, ${image_calc.transform_top}px) scale(${image_calc.scale})`;
                    slide_image.style.width = `${image_calc.max_width}px`;
                    slide_image.style.height = `${image_calc.max_height}px`;
                }
            }

            if(photosApp.fullscreen.currentImage) {
                let calc = photosApp.fullscreen.getImageCalc(photosApp.fullscreen.item_ids.current);
                let scale_ratio = calc.scale / prev_original;
                let new_scale = prev_scale * scale_ratio;

                if(new_scale > calc.max_scale) {
                    new_scale = calc.max_scale;
                }

                photosApp.fullscreen.updateZoom(new_scale, photosApp.style.screen.width.current / 2, photosApp.style.screen.height.current / 2);
            }
        }

        if(!photosApp.fullscreen[queue_prop].length) {
            resize();
        } else {
            for(let i = 0; i < photosApp.fullscreen[queue_prop].length; i++) {
                clearTimeout(photosApp.fullscreen[queue_prop][i]);
            }

            photosApp.fullscreen[queue_prop] = [];

            let t = setTimeout(function () {
                resize();
            }, 100);

            photosApp.fullscreen[queue_prop].push(t);
        }
    },
    getActiveSlide: function() {
        return photosApp.fullscreen.currentSlide;
    },
    setSpinner: function (bool) {
        // console.log({
        //     set_spinner: bool
        // });

        if(bool) {
            addClassEl('show', 'fullscreen-spinner');
        } else {
            removeClassEl('show', 'fullscreen-spinner');
            for(let t of photosApp.fullscreen.spinnerTimeouts) {
                clearTimeout(t);
            }
        }
    },
    deleteLogic: async function (item_id, props) {
        let processIP = item_id;

        if(photosApp.fullscreen.metadata.ip[`${props.ip}Item`][processIP]) {
            return false;
        }

        let item = photosApp.items.local.items[item_id];

        photosApp.app.setSpinner(photosApp.app.els.fullscreen, true);

        photosApp.fullscreen.metadata.ip[`${props.ip}Item`][processIP] = true;

        item[props.field] = props.value;

        try {
            await photosApp.items.updateItem(item, props.field);

            //after new items data

            let cs = photosApp.fullscreen.currentSlide;
            let removed_item_id = photosApp.fullscreen.item_ids.current;

            let index = Number.parseInt(cs.getAttribute('data-item-index'));
            let next_item_id = photosApp.fullscreen.item_ids.list[index + 1];
            let prev_item_id = photosApp.fullscreen.item_ids.list[index - 1];

            //go to next item
            let next_el = document.getElementById('slide-' + next_item_id);
            let prev_el = document.getElementById('slide-' + prev_item_id);

            if(!next_el && !prev_el) {
                //one item only
                try {
                    await photosApp.view.setupTimeViews(true);
                    photosApp.app.setSpinner(photosApp.app.els.fullscreen, false);
                    photosApp.fullscreen.metadata.ip[`${props.ip}Item`][processIP] = false;
                    return photosApp.fullscreen.exitFullscreen();
                } catch(e) {

                }
            } else if(next_el) {
                await photosApp.fullscreen.changeSlide('r');
            } else if(prev_el) {
                await photosApp.fullscreen.changeSlide('l');
            }

            //remove spinner
            photosApp.app.setSpinner(photosApp.app.els.fullscreen, false);

            //on next frame
            requestAnimationFrame(async function () {
                //remove deleted item
                cs.parentNode.removeChild(cs);

                //remove item from slides list
                photosApp.fullscreen.item_ids.slides.splice(photosApp.fullscreen.item_ids.slides.indexOf(removed_item_id), 1);

                //reset fullscreen data
                await photosApp.fullscreen.setItems();

                photosApp.fullscreen.activateDeactivateSlideButtons();

                requestAnimationFrame(async function () {
                    try {
                        await photosApp.view.setupTimeViews(true);
                    } catch (e) {
                    }
                });
            });
        } catch (e) {
            console.error(e);
        }

        photosApp.fullscreen.metadata.ip[`${props.ip}Item`][processIP] = false;
    },
    getImageCalc(item) {
        if(typeof item === 'string' || typeof item === 'number') {
            item = photosApp.items.local.items[item];
        }

        let max_width, max_height, scale, max_scale, itemRatio;

        itemRatio = item.width / item.height;

        let screenRatio = photosApp.style.screen.width.current / photosApp.style.screen.height.current;

        if(itemRatio > screenRatio) {
            //scale to width
            max_width = Math.min(photosApp.fullscreen.dimensions.max, item.width);
            max_height = max_width / itemRatio;

            scale = photosApp.style.screen.width.current / max_width;

            max_scale = photosApp.fullscreen.zoom.maxPx / max_width;
        } else {
            //scale to height
            max_height = Math.min(photosApp.fullscreen.dimensions.max, item.height);
            max_width = max_height * itemRatio;
            scale = photosApp.style.screen.height.current / max_height;
            max_scale = photosApp.fullscreen.zoom.maxPx / max_height;
        }

        let transform_left = (photosApp.style.screen.width.current - max_width * scale) / 2;
        let transform_top = (photosApp.style.screen.height.current - max_height * scale) / 2;

        return {
            scale: scale,
            max_scale: max_scale,
            max_width: max_width,
            max_height: max_height,
            transform_left: transform_left,
            transform_top: transform_top
        };
    },
    updateTransforms: function (current_item_id) {
        current_item_id = Number.parseInt(current_item_id);

        let screen_width = photosApp.style.screen.width.current;
        let num_items = photosApp.fullscreen.item_ids.slides.length;

        let total_width = screen_width * num_items;

        let slides_wrapper = photosApp.fullscreen.wrapperEl;

        let all_slides = slides_wrapper.getElementsByClassName('slide');

        //calculate transform
        let slide_index = photosApp.fullscreen.item_ids.slides.indexOf(current_item_id);
        let transform_x = slide_index * screen_width;
        photosApp.fullscreen.slide.tmp_wrapper_translate = photosApp.fullscreen.slide.current_wrapper_translate = -transform_x;

        //set styles
        slides_wrapper.style.width = total_width + 'px';
        slides_wrapper.style.height = photosApp.style.screen.height.current + 'px';
        slides_wrapper.style.transform = `translate3d(-${transform_x}px, 0, 0)`;

        let slide_transform = photosApp.fullscreen.slide.max_translate = 0;

        for(let i = 0; i < all_slides.length; i++) {
            let slide = all_slides[i];

            if(Number.parseInt(slide.getAttribute('data-item-id')) === current_item_id) {
                photosApp.fullscreen.slide.current_slide_translate = -slide_transform;
            }

            slide.setAttribute('data-x', slide_transform);
            slide.style.transform = `translate3d(${slide_transform}px, 0, 0)`;
            slide_transform += screen_width;
        }

        //we transform with negative numbers
        photosApp.fullscreen.slide.min_translate = -((num_items - 1) * screen_width);
    },
    getDistanceBetweenTouches: function (e) {
        if (e.touches.length < 2) { return null; }
        let x1 = e.touches[0].pageX;
        let y1 = e.touches[0].pageY;
        let x2 = e.touches[1].pageX;
        let y2 = e.touches[1].pageY;
        return Math.sqrt((Math.pow( (x2 - x1), 2 )) + (Math.pow( (y2 - y1), 2 )));
    },
    preventScrollEvents: function() {
        let fullscreen_el = photosApp.app.els.fullscreen;
        if(!fullscreen_el._scroll_listener) {
            fullscreen_el._scroll_listener = true;


            fullscreen_el.addEventListener('scroll', function (e) {
                e.preventDefault();
            });

            fullscreen_el.addEventListener('touchmove', function (e) {
                e.preventDefault();
            });
        }
    },
    slideEvents() {
        function clickLogic(x, y, is_double_click) {
            devConsole("Click logic");

            if(photosApp.fullscreen.exit.in_progress || photosApp.fullscreen.exit.transition_ip || photosApp.fullscreen.pan.in_progress || photosApp.fullscreen.slide.in_progress
                || photosApp.fullscreen.slide.transition_ip || photosApp.fullscreen.slide.change_ip || !photosApp.fullscreen.slide.allow) {
                //do nothing
            } else if(photosApp.fullscreen.zoom.last_click &&
                (timeNow(true) - photosApp.fullscreen.zoom.last_click) < photosApp.fullscreen.zoom.double_click_threshold || is_double_click) {

                //remove classes which effect transition
                let transition_cls = ['pan-transition', 'pan-in-progress', photosApp.fullscreen.events_class];

                for(let cl of transition_cls) {
                    removeClassEl(cl, photosApp.app.els.fullscreen);
                }

                photosApp.fullscreen.toggleZoom(x, y);
            }

            photosApp.fullscreen.zoom.last_click = timeNow(true);
        }

        function onTouchStart(e) {
            let target = e.currentTarget ? e.currentTarget : e.target;

            let touch_start_prevents = {
                not_init_finished: !photosApp.fullscreen.init_finished,
                toggle_ip: photosApp.fullscreen.zoom.toggle_ip,
                exit_in_progress: photosApp.fullscreen.exit.in_progress,
                exit_transition_ip: photosApp.fullscreen.exit.transition_ip,
                not_slide_allow: !photosApp.fullscreen.slide.allow
            };

            for(let k in touch_start_prevents) {
                let bool = touch_start_prevents[k];

                if(bool) {
                    devConsole({
                        touch_start_prevented: k
                    });

                    return false;
                }
            }

            photosApp.fullscreen.touchstart_int++;

            //prevent action on menu
            if(target.closest('.top-bar')) {
                return photosApp.fullscreen.allowSlide(false);
            }

            requestAnimationFrame(function () {
                if (photosApp.fullscreen.currentImage && e.touches && e.touches.length >= 2) {
                    if(photosApp.fullscreen.slide.transition_ip || photosApp.fullscreen.slide.change_ip || photosApp.fullscreen.slide.in_progress) {
                        return false;
                    }

                    photosApp.fullscreen.setZoomInProgress(true);

                    //zoom
                    photosApp.fullscreen.zoom.scale.zoom_start = Number.parseFloat(photosApp.fullscreen.currentImage.getAttribute('data-scale'));
                    photosApp.fullscreen.zoom.scale.distance_start = photosApp.fullscreen.getDistanceBetweenTouches(e);
                    photosApp.fullscreen.zoom.scale.startX = (e.touches[0].pageX + e.touches[1].pageX) / 2;
                    photosApp.fullscreen.zoom.scale.startY = (e.touches[0].pageY + e.touches[1].pageY) / 2;
                    photosApp.fullscreen.setImageEventsClass(true);
                    photosApp.fullscreen.setRecentlyZoomedClass(true);
                } else {
                    photosApp.fullscreen.touchstartx = getEventXFirst(e);
                    photosApp.fullscreen.touchstarty = getEventYFirst(e);

                    if(photosApp.fullscreen.currentImage) {
                        photosApp.fullscreen.pan.startX = Number.parseFloat(photosApp.fullscreen.currentImage.getAttribute('data-x'));
                        photosApp.fullscreen.pan.startY = Number.parseFloat(photosApp.fullscreen.currentImage.getAttribute('data-y'));
                    }

                    photosApp.fullscreen.pan.touch_events = [];
                    photosApp.fullscreen.slide.touch_events = [];

                    //touch only, click event handler is used for mouse
                    if(is_touch_device()) {
                        clickLogic(photosApp.fullscreen.touchstartx, photosApp.fullscreen.touchstarty);
                    }
                }
            });
        }

        let wrapper = photosApp.app.els.fullscreen.querySelector('.slides-wrapper');

        if(!wrapper._zoom_listener) {
            wrapper._zoom_listener = true;

            wrapper.addEventListener('touchstart', function (e) {
                devConsole("slide: " + 'touchstart');

                let target = e.target;
                let menu_check = target.closest('.context__menu');

                if(!menu_check) {
                    onTouchStart(e);
                }
            });

            wrapper.addEventListener('click', function (e) {
                if('ontouchstart' in window) {
                    return false;
                }

                if(!photosApp.fullscreen.init_finished || photosApp.fullscreen.zoom.toggle_ip || photosApp.fullscreen.slide.transition_ip || photosApp.fullscreen.slide.change_ip || !photosApp.fullscreen.slide.allow) {
                    return false;
                }

                devConsole("slide: click");

                if(!photosApp.fullscreen.currentImage) {
                    return;
                }

                clickLogic(e.pageX, e.pageY);
            });

            wrapper.addEventListener('scroll', function (e) {
                e.preventDefault();
            });

            wrapper.addEventListener('mousedown', function (e) {
                if('ontouchstart' in window) {
                    return false;
                }

                devConsole("slide: mousedown");

                let target = e.target;
                let menu_check = target.closest('.top-bar');
                if(!menu_check) {
                    photosApp.fullscreen.mouse.down.active = true;
                    onTouchStart(e);
                }
            });

            function slideMoveLogic(x, y) {
                photosApp.fullscreen.slide.touch_events.push({
                    x: x,
                    y: y,
                    t: timeNow(true)
                });

                let wrapper = photosApp.fullscreen.wrapperEl;

                let x_diff = x - photosApp.fullscreen.touchstartx;

                let transform_left = photosApp.fullscreen.slide.current_wrapper_translate + x_diff;
                photosApp.fullscreen.slide.tmp_wrapper_translate = transform_left;

                wrapper.style.transform = `translate3d(${transform_left}px, 0, 0)`;
            }

            function onTouchMove(e) {
                let touch_move_x = getEventXFirst(e);
                let touch_move_y = getEventYFirst(e);

                if(Math.max(Math.abs(touch_move_x), Math.abs(touch_move_y)) >= photosApp.fullscreen.minimumDetectSwipe) {
                    photosApp.fullscreen.setShowImage(false);
                }

                requestAnimationFrame(function () {
                    photosApp.fullscreen.setShowImage(false);
                });

                //slide swipe already started
                if(photosApp.fullscreen.slide.in_progress) {
                    if(photosApp.fullscreen.slide.transition_ip || photosApp.fullscreen.slide.change_ip) {
                        return;
                    }

                    slideMoveLogic(touch_move_x, touch_move_y);
                    //previously zoomed

                } else if(photosApp.fullscreen.currentImage && e.touches && e.touches.length >= 2) {
                    if(photosApp.fullscreen.slide.transition_ip || photosApp.fullscreen.slide.change_ip) {
                        return false;
                    }

                    let distance_move = photosApp.fullscreen.getDistanceBetweenTouches(e);
                    if(distance_move === null) {
                        return;
                    }

                    //pinch zoom move event
                    requestAnimationFrame(function () {
                        let zoom_start = photosApp.fullscreen.zoom.scale.zoom_start;

                        // add/subtract from original zoom
                        //use distance between current and start, divide by distance at start to get ratio, use ratio to determine how much of original zoom start to use
                        let new_scale = zoom_start + ((distance_move - photosApp.fullscreen.zoom.scale.distance_start) / photosApp.fullscreen.zoom.scale.distance_start) * zoom_start;

                        let min_scale = Number.parseFloat(photosApp.fullscreen.currentImage.getAttribute('data-scale-original'));
                        let max_scale = Number.parseFloat(photosApp.fullscreen.currentImage.getAttribute('data-scale-max'));

                        if (new_scale > max_scale) {
                            new_scale = (max_scale - 1) + (Math.pow( ((new_scale - max_scale) + 1), 0.5 ));
                        }

                        if (new_scale < min_scale) {
                            new_scale = (min_scale + 1) - (Math.pow( ((min_scale - new_scale) + 1), 0.5 ));
                        }

                        photosApp.fullscreen.updateZoom(new_scale, photosApp.fullscreen.zoom.scale.startX, photosApp.fullscreen.zoom.scale.startY);
                    });

                    // panning image
                } else if(photosApp.fullscreen.currentImage && photosApp.fullscreen.zoom.in_progress) {
                    if(photosApp.fullscreen.slide.transition_ip || photosApp.fullscreen.slide.change_ip) {
                        return false;
                    }

                    if(!photosApp.fullscreen.getRecentlyZoomed()) {
                        photosApp.fullscreen.pan.touch_events.push({
                            e: e,
                            t: timeNow(true)
                        });

                        photosApp.fullscreen.setImageEventsClass(true);

                        requestAnimationFrame(function () {
                            photosApp.fullscreen.setPanInProgress(true);
                            photosApp.fullscreen.updatePan(touch_move_x, touch_move_y);
                        });
                    }
                    //starting slide swipe
                } else {
                    requestAnimationFrame(function () {
                        if(!photosApp.fullscreen.exit.in_progress && photosApp.fullscreen.slide.allow) {
                            let x_diff = Math.abs(touch_move_x - photosApp.fullscreen.touchstartx);

                            if(x_diff >= photosApp.fullscreen.minimumDetectSwipe) {
                                //determine axis
                                devConsole("setting slide in progress");
                                photosApp.fullscreen.slide.in_progress = true;
                                photosApp.fullscreen.zoom.last_click = null;

                                slideMoveLogic(getEventXFirst(e), getEventYFirst(e));
                            }
                        }
                    });
                }
            }

            wrapper.addEventListener('touchmove', function (e) {
                let touch_prevent_rules = {
                    init_not_finished: !photosApp.fullscreen.init_finished,
                    toggle_ip: photosApp.fullscreen.zoom.toggle_ip,
                    exit_ip: photosApp.fullscreen.exit.in_progress,
                    slide_transition: photosApp.fullscreen.slide.transition_ip,
                    disallow_slide: !photosApp.fullscreen.slide.allow
                };

                let allow = true;

                for(let k in touch_prevent_rules) {
                    if(touch_prevent_rules[k]) {
                        allow = false;
                        devConsole({
                            prevent_touch_move_rule: k
                        })
                    }
                }

                if(allow) {
                    let target = e.target;
                    let menu_check = target.closest('.context__menu');

                    if(!menu_check) {
                        onTouchMove(e);
                    }
                }
            });

            wrapper.addEventListener('mousemove', function (e) {
                let move_prevent_rules = {
                    touchmove: 'ontouchmove' in window,
                    mouse_not_down: !photosApp.fullscreen.mouse.down.active,
                    init_not_finished: !photosApp.fullscreen.init_finished,
                    toggle_ip: photosApp.fullscreen.zoom.toggle_ip,
                    slide_change: photosApp.fullscreen.slide.change_ip,
                    slide_transition: photosApp.fullscreen.slide.transition_ip,
                    exit_ip: photosApp.fullscreen.exit.in_progress,
                    exit_transition: photosApp.fullscreen.exit.transition_ip,
                    disallow_slide: !photosApp.fullscreen.slide.allow
                };

                let allow = true;

                for(let k in move_prevent_rules) {
                    if(move_prevent_rules[k]) {
                        allow = false;
                    }
                }

                if(allow) {
                    onTouchMove(e);
                }
            });

            async function slideEndLogic(touch_int) {
                devConsole("slide end logic");

                return new Promise(async (resolve_slide_end, reject) => {
                    photosApp.fullscreen.slide.transition_ip = true;

                    addClassEl('slide-transition', photosApp.app.els.fullscreen);

                    function getXAfterMomentum(speed) {
                        let speed_multiplier = 16 * 1.5;

                        devConsole("momentum: ", speed);

                        let x_translate = photosApp.fullscreen.slide.tmp_wrapper_translate;
                        if(Math.abs(speed) < .05 || !Number.isFinite(speed)) {
                            return x_translate;
                        }

                        let deceleration_ratio = photosApp.fullscreen.pan.momentum.deceleration_ratio;

                        let x_location_update = x_translate;

                        let prev_x = x_location_update;

                        while (Math.abs(speed) >= .05) {
                            x_location_update += speed * speed_multiplier;

                            if(Number.isNaN(x_location_update) || !Number.isFinite(speed) || !Number.isFinite(x_location_update)) {
                                x_location_update = prev_x;
                                break;
                            }

                            speed *= (1 - deceleration_ratio);

                        }

                        return x_location_update;
                    }

                    photosApp.fullscreen.setImageEventsClass(false);

                    //at end of momentum or during momentum, see if we've passed threshold, if passed, go to next slide, otherwise at end of momentum snap back to original
                    //add slide momentum

                    let events = [];
                    let now = timeNow(true);

                    for(let i = 0; i < photosApp.fullscreen.slide.touch_events.length; i++) {
                        let event = photosApp.fullscreen.slide.touch_events[i];
                        if(now - event.t < photosApp.fullscreen.slide.events_ms_threshold) {
                            events.push(event);
                        }
                    }

                    let x_speed = 0;

                    if(events.length > 1) {
                        let first_event = events[0];
                        let last_event = events[events.length - 1];

                        let x_diff = last_event.x - first_event.x;
                        let t_diff = last_event.t - first_event.t;
                        x_speed = x_diff / t_diff;
                    }

                    if(Number.isNaN(x_speed)) {
                        x_speed = 0;
                    }

                    let direction = null;

                    //determine direction
                    //compare tmp to current
                    let tmp_wrap_x = photosApp.fullscreen.slide.tmp_wrapper_translate;
                    let current_wrap_x = photosApp.fullscreen.slide.current_wrapper_translate;

                    let after_momentum_x = getXAfterMomentum(x_speed);

                    //calculate % of screen
                    let screen_w = photosApp.style.screen.width.current;

                    let diff = Math.abs(after_momentum_x - current_wrap_x);
                    let diff_screen = diff / screen_w;

                    let change_slide = false;

                    if(Math.abs(x_speed) > photosApp.fullscreen.slide.change_threshold.speed || diff >= photosApp.fullscreen.slide.change_threshold.px || diff_screen > photosApp.fullscreen.slide.change_threshold.percent) {
                        change_slide = true;
                    }

                    //do not do anything if we are at spot we started at
                    if(tmp_wrap_x === current_wrap_x) {
                        devConsole("xs are same");
                        photosApp.fullscreen.slide.in_progress = false;
                        photosApp.fullscreen.slide.transition_ip = false;
                        removeClassEl('slide-transition', photosApp.app.els.fullscreen);
                        return resolve_slide_end();
                    }

                    if(tmp_wrap_x > current_wrap_x) {
                        direction = 'l';
                    } else if(tmp_wrap_x < current_wrap_x) {
                        direction = 'r';
                    }

                    if(direction === 'r' && tmp_wrap_x < photosApp.fullscreen.slide.min_translate) {
                        change_slide = false;
                    }

                    if(direction === 'l' && tmp_wrap_x > photosApp.fullscreen.slide.max_translate) {
                        change_slide = false;
                    }

                    if(change_slide) {
                        await photosApp.fullscreen.changeSlide(direction);
                        devConsole("changed slide");
                    } else {
                        await photosApp.fullscreen.returnToSlideOrigin();
                        devConsole("returned slide to origin");
                        photosApp.fullscreen.slide.in_progress = false;
                        photosApp.fullscreen.slide.transition_ip = false;
                        photosApp.fullscreen.zoom.last_click = null;
                    }

                    return resolve_slide_end();

                });
            }

            function onTouchEnd(e, touch_int) {
                return new Promise(async (resolve_1, reject_1) => {
                    devConsole("on touch end");

                    let pan_bounds = photosApp.fullscreen.getPanBounds();

                    function animatePanImage(animation_start_time, x_speed, y_speed, resolve_re, out_of_bounds) {
                        return new Promise((resolve, reject) => {
                            if(!resolve_re && Math.abs(x_speed) < .20 && Math.abs(y_speed) < .20) {
                                return resolve();
                            }

                            if(!out_of_bounds) {
                                out_of_bounds = 0;
                            }

                            let speed_multiplier = 16 * 1.5;

                            let currentImage = photosApp.fullscreen.currentImage;
                            let x_translate = Number.parseFloat(currentImage.getAttribute('data-x'));
                            let y_translate = Number.parseFloat(currentImage.getAttribute('data-y'));

                            let deceleration_ratio = photosApp.fullscreen.pan.momentum.deceleration_ratio;

                            let current_scale = currentImage.getAttribute('data-scale');
                            resolve = resolve_re ? resolve_re : resolve;

                            let x_location_update = x_translate + x_speed * speed_multiplier;
                            let y_location_update = y_translate + y_speed * speed_multiplier;

                            if(Number.isNaN(x_location_update) || Number.isNaN(y_location_update)) {
                                return resolve();
                            }

                            x_speed *= (1 - deceleration_ratio);
                            y_speed *= (1 - deceleration_ratio);

                            requestAnimationFrame(function () {
                                if(touch_int !== photosApp.fullscreen.touchstart_int) {
                                    return resolve();
                                }

                                //x bounds
                                if(x_location_update > pan_bounds.x.l || x_location_update < pan_bounds.x.r || y_location_update > pan_bounds.y.t || y_location_update < pan_bounds.y.b) {
                                    out_of_bounds++;
                                }

                                if(out_of_bounds > 2) {
                                    return resolve();
                                }

                                currentImage.style.transform = `translate3d(${x_location_update}px, ${y_location_update}px, 0) scale(${current_scale})`;
                                currentImage.setAttribute('data-x', x_location_update);
                                currentImage.setAttribute('data-y', y_location_update);

                                photosApp.fullscreen.setBackgroundTransformFromImage();

                                if(Math.abs(x_speed) >= .05 || Math.abs(y_speed) >= .05) {
                                    animatePanImage(animation_start_time, x_speed, y_speed, resolve, out_of_bounds);
                                } else {
                                    return resolve();
                                }
                            });
                        });
                    }

                    if(photosApp.fullscreen.slide.in_progress || photosApp.fullscreen.slide.change_ip || photosApp.fullscreen.slide.transition_ip || photosApp.fullscreen.slide.change_queue.length) {
                        devConsole("Starting slide end");
                    } else {
                        devConsole("end zoom/pan block");
                        if(!photosApp.fullscreen.currentImage) {
                            //do nothing
                        } else  {
                            await rafAwait(async function () {
                                if(photosApp.fullscreen.slide.transition_ip) {
                                    //do nothing
                                } else {
                                    let current_scale = Number.parseFloat(photosApp.fullscreen.currentImage.getAttribute('data-scale'));
                                    let min_scale = Number.parseFloat(photosApp.fullscreen.currentImage.getAttribute('data-scale-original'));
                                    let max_scale = Number.parseFloat(photosApp.fullscreen.currentImage.getAttribute('data-scale-max'));
                                    let new_scale = Math.max(Math.min(current_scale, max_scale), min_scale);

                                    //determine whether we're in a zoom action
                                    let scale_diff = new_scale - min_scale;
                                    if(scale_diff / min_scale < .25) {
                                        if(current_scale < min_scale) {
                                            photosApp.fullscreen.setScaleTooLow(true);
                                            // await timeoutAwait(null, photosApp.fullscreen.zoom.scale_low_duration);
                                        }

                                        photosApp.fullscreen.updateZoom(new_scale, photosApp.fullscreen.zoom.scale.startX, photosApp.fullscreen.zoom.scale.startY);
                                        photosApp.fullscreen.setZoomInProgress(false);
                                    } else {
                                        if(e.touches && e.touches >= 2 || photosApp.app.els.fullscreen.classList.contains('recently-zoomed')) {
                                            let prev_data = {
                                                x: Number.parseFloat(photosApp.fullscreen.currentBackground.getAttribute('data-x')),
                                                y: Number.parseFloat(photosApp.fullscreen.currentBackground.getAttribute('data-y')),
                                                scale: Number.parseFloat(photosApp.fullscreen.currentBackground.getAttribute('data-scale'))
                                            };

                                            photosApp.fullscreen.updateZoom(new_scale, photosApp.fullscreen.zoom.scale.startX, photosApp.fullscreen.zoom.scale.startY, true);

                                            let data = photosApp.fullscreen.setBackgroundTransformFromImage(true);

                                            await photosApp.animation.transformScale(photosApp.fullscreen.currentBackground, prev_data.x, data.x, prev_data.y, data.y, prev_data.scale, data.scale,
                                                photosApp.fullscreen.default_transition, 'easeOutQuad', photosApp.fullscreen.touchstart_int);

                                        } else {
                                            //panning
                                            let now = timeNow(true);

                                            let events = [];

                                            for(let i = 0; i < photosApp.fullscreen.pan.touch_events.length; i++) {
                                                let event = photosApp.fullscreen.pan.touch_events[i];
                                                if(now - event.t < photosApp.fullscreen.pan.momentum.events_ms_threshold) {
                                                    events.push(event);
                                                }
                                            }

                                            if(events.length > 1) {
                                                let first_event = events[0];
                                                let last_event = events[events.length - 1];

                                                let x_diff = last_event.e.pageX - first_event.e.pageX;
                                                let y_diff = last_event.e.pageY - first_event.e.pageY;
                                                let t_diff = last_event.t - first_event.t;
                                                let x_speed = x_diff / t_diff;
                                                let y_speed = y_diff / t_diff;

                                                try {
                                                    photosApp.fullscreen.setPanTransition(true);
                                                    devConsole("Animate pan image", x_speed, y_speed);
                                                    await animatePanImage(now, x_speed, y_speed);
                                                } catch (e) {
                                                }

                                                photosApp.fullscreen.setPanTransition(false);
                                            }

                                            devConsole("await pan end");
                                            await photosApp.fullscreen.panEnd(e);
                                            devConsole("pan end");
                                        }
                                    }
                                }
                            });
                        }
                    }

                    await slideEndLogic(touch_int);

                    photosApp.fullscreen.setImageEventsClass(false);
                    photosApp.fullscreen.setScaleTooLow(false);
                    photosApp.fullscreen.setRecentlyZoomedClass(false);
                    photosApp.fullscreen.setPanInProgress(false);

                    resolve_1();

                });
            }

            let touch_end_events = ['touchcancel', 'touchend'];

            for(let tee of touch_end_events) {
                wrapper.addEventListener(tee, async function (e) {
                    devConsole("slide: " + tee);

                    if(!photosApp.fullscreen.slide.allow) {
                        devConsole("end: slide not allowed");
                        return photosApp.fullscreen.allowSlide(true);
                    }

                    let rules = {
                        init_finished: !photosApp.fullscreen.init_finished,
                        zoom_toggle: photosApp.fullscreen.zoom.toggle_ip,
                        exit_transition: photosApp.fullscreen.exit.transition_ip,
                        exit_ip: photosApp.fullscreen.exit.in_progress,
                    };

                    let allow = true;

                    for(let k in rules) {
                        if(rules[k]) {
                            allow = false;
                            devConsole("Touch end not allowed: ", k);
                        }
                    }

                    if(allow) {
                        requestAnimationFrame(async function () {
                            await onTouchEnd(e, photosApp.fullscreen.touchstart_int);

                            photosApp.fullscreen.setShowImage(true);
                        });
                    }
                });
            }

            wrapper.addEventListener('mouseup', async function (e) {
                if('ontouchend' in window) {
                    return false;
                }

                devConsole("slide: mouseup");

                photosApp.fullscreen.mouse.down.active = false;

                if(!photosApp.fullscreen.slide.allow) {
                    return photosApp.fullscreen.allowSlide(true);
                }

                if(!photosApp.fullscreen.init_finished || photosApp.fullscreen.zoom.toggle_ip || photosApp.fullscreen.exit.transition_ip
                    || photosApp.fullscreen.exit.in_progress) {
                    return false;
                }

                await onTouchEnd(e, photosApp.fullscreen.touchstart_int);

                photosApp.fullscreen.setShowImage(true);

            });

        }
    },
    changeSlide: async function(direction) {
        devConsole("change slide");
        let change_int = ++photosApp.fullscreen.slide.change_int;

        function isFirstProcess(resolve_re) {
            return new Promise((resolve, reject) => {
                resolve = resolve_re ? resolve_re : resolve;

                if(photosApp.fullscreen.slide.change_queue.indexOf(change_int) !== 0) {
                    requestAnimationFrame(function () {
                        return isFirstProcess(resolve);
                    });
                } else {
                    resolve();
                }
            });
        }

        function finishSteps() {
            photosApp.fullscreen.slide.change_queue.splice(photosApp.fullscreen.slide.change_queue.indexOf(change_int), 1);
            photosApp.fullscreen.slide.change_ip = false;
        }

        photosApp.fullscreen.slide.change_ip = true;
        photosApp.fullscreen.slide.change_queue.push(change_int);

        devConsole(
            JSON.stringify({
                slide_change_queue: photosApp.fullscreen.slide.change_queue,
                background_ints: photosApp.fullscreen.background_change_ints
            }));

        await isFirstProcess();

        return new Promise(async (resolve, reject) => {
            if(!direction) {
                finishSteps();
                return resolve();
            }

            let current_index = photosApp.fullscreen.item_ids.slides.indexOf(photosApp.fullscreen.item_ids.current);

            let new_index = null;

            if(direction === 'l') {
                new_index = current_index - 1;
            } else {
                new_index = current_index + 1;
            }

            let all_slides = photosApp.fullscreen.wrapperEl.getElementsByClassName('slide');

            let new_slide = all_slides[new_index];

            if(!new_slide) {
                finishSteps();
                return resolve();
            }

            let new_x = Number.parseInt(new_slide.getAttribute('data-x'));

            photosApp.fullscreen.resetSlideItem(photosApp.fullscreen.item_ids.current);

            await photosApp.fullscreen.transitionToSlideX(-new_x, true);
            await photosApp.fullscreen.slideChangeLogic(photosApp.fullscreen.item_ids.slides[new_index], photosApp.fullscreen.item_ids.current, direction);

            requestAnimationFrame(async function () {
                finishSteps();

                if(!photosApp.fullscreen.slide.change_queue.length) {
                    photosApp.fullscreen.slide.in_progress = false;
                    photosApp.fullscreen.slide.transition_ip = false;
                    photosApp.fullscreen.zoom.last_click = null;
                }

                resolve();
            });
        });
    },
    returnToSlideOrigin: function() {
        return new Promise(async (resolve, reject) => {
            devConsole("Return to slide origin");
            await photosApp.fullscreen.transitionToSlideX(photosApp.fullscreen.slide.current_wrapper_translate);
            devConsole("returned to origin");
            resolve();
        });
    },
    transitionToSlideX: function(x, is_slide_change) {
        let wrapper = photosApp.fullscreen.wrapperEl;
        let transition_duration = photosApp.fullscreen.slide.events_timeout;
        let time_start = timeNow(true);

        function rafTimeAwait(resolve_re) {
            return new Promise((resolve, reject) => {
                resolve = resolve_re ? resolve_re : resolve;

                //remove transition if queue is greater than 1
                if(photosApp.fullscreen.slide.change_queue.length > 1) {
                    addClassEl('transition-transform-0', wrapper);
                    removeClassEl('transition-transform-0', wrapper);
                    setElementTransition(wrapper, false);
                    return resolve();
                } else if(timeNow(true) - time_start >= transition_duration) {
                    return resolve();
                }

                requestAnimationFrame(function () {
                    rafTimeAwait(resolve);
                });
            });
        }

        return new Promise(async (resolve, reject) => {
            photosApp.fullscreen.slide.tmp_wrapper_translate = x;

            addClassEl('transition-transform-0', wrapper);
            removeClassEl('transition-transform-0', wrapper);
            addClassEl('slide-transition', photosApp.app.els.fullscreen);

            if(is_slide_change) {
                addClassEl('slide-change', photosApp.app.els.fullscreen);
            }

            setElementTransform(wrapper, x, 0, 0);

            await rafTimeAwait();

            removeClassEl('slide-transition', photosApp.app.els.fullscreen);
            removeClassEl('slide-change', photosApp.app.els.fullscreen);

            setElementTransition(wrapper, false);

            resolve();
        });
    },
    toggleZoom: function (x, y) {
        if (photosApp.fullscreen.zoom.toggle_ip) {
            return false;
        }

        photosApp.fullscreen.setRecentlyZoomedClass(true);
        addClassEl('toggle-ip', photosApp.app.els.fullscreen);

        photosApp.fullscreen.zoom.toggle_ip = true;

        photosApp.fullscreen.setZoomInProgress(true);

        requestAnimationFrame(function () {
            photosApp.fullscreen.setInteract(false);
        });

        let currentSlide = photosApp.fullscreen.getActiveSlide();

        let currentImage = currentSlide.querySelector(`.${photosApp.fullscreen.img_class}`);

        let current_scale = Number.parseFloat(currentImage.getAttribute('data-scale'));
        let original_scale = Number.parseFloat(currentImage.getAttribute('data-scale-original'));
        let max_scale = Number.parseFloat(currentImage.getAttribute('data-scale-max'));

        if(current_scale - original_scale < max_scale - original_scale) {
            photosApp.fullscreen.zoomIn(x, y);
        } else {
            photosApp.fullscreen.zoomOut();
        }

        setTimeout(function () {
            removeClassEl('toggle-ip', photosApp.app.els.fullscreen);
            photosApp.fullscreen.zoom.toggle_ip = false;
        }, photosApp.fullscreen.zoom.transition_duration)
    },
    zoomIn: function (x, y) {
        let currentImage = photosApp.fullscreen.currentImage;

        let max_scale = Number.parseFloat(currentImage.getAttribute('data-scale-max'));

        photosApp.fullscreen.setShowImage(false);
        photosApp.fullscreen.updateZoom(max_scale, x, y);
        photosApp.fullscreen.setZoomInProgress(true);

        setTimeout(function () {
            photosApp.fullscreen.setShowImage(true);
        }, photosApp.fullscreen.zoom.transition_duration)
    },
    setShowImage: function(bool) {
        changeElClass(photosApp.app.els.fullscreen, 'show-image', bool);
    },
    zoomOut: function () {
        let currentSlide = photosApp.fullscreen.getActiveSlide();
        let currentImage = currentSlide.querySelector(`.${photosApp.fullscreen.img_class}`);

        let original_scale = Number.parseFloat(currentImage.getAttribute('data-scale-original'));
        let original_x = Number.parseFloat(currentImage.getAttribute('data-x-original'));
        let original_y = Number.parseFloat(currentImage.getAttribute('data-y-original'));

        photosApp.fullscreen.setShowImage(false);

        currentImage.style.transform = `translate3d(${original_x}px, ${original_y}px, 0) scale(${original_scale})`;
        currentImage.setAttribute('data-scale', original_scale);
        currentImage.setAttribute('data-x', original_x);
        currentImage.setAttribute('data-y', original_y);

        photosApp.fullscreen.setBackgroundTransformFromImage();

        setTimeout(function () {
            photosApp.fullscreen.setZoomInProgress(false);
            photosApp.fullscreen.setShowImage(true);
        }, photosApp.fullscreen.zoom.transition_duration);
    },
    updateZoom: function(scale, x, y, exclude_background) {
        let zoom_transform = photosApp.fullscreen.zoomTransform(scale, x, y);

        let currentImage = photosApp.fullscreen.currentImage;

        currentImage.style.transform = `translate3d(${zoom_transform.x}px, ${zoom_transform.y}px, 0) scale(${scale})`;
        currentImage.setAttribute('data-scale', scale);
        currentImage.setAttribute('data-x', zoom_transform.x);
        currentImage.setAttribute('data-y', zoom_transform.y);

        if(!exclude_background) {
            photosApp.fullscreen.setBackgroundTransformFromImage();
        }
    },
    setBackgroundTransformFromImage: function(data_only) {
        let currentImage = photosApp.fullscreen.currentImage;
        let original_scale = Number.parseFloat(currentImage.getAttribute('data-scale-original'));
        let current_scale = Number.parseFloat(currentImage.getAttribute('data-scale'));
        let current_x = Number.parseFloat(currentImage.getAttribute('data-x'));
        let current_y = Number.parseFloat(currentImage.getAttribute('data-y'));
        let original_x = Number.parseFloat(currentImage.getAttribute('data-x-original'));
        let original_y = Number.parseFloat(currentImage.getAttribute('data-y-original'));
        let scale_ratio = current_scale / original_scale;

        let x = current_x - (original_x * scale_ratio );
        let y = current_y - (original_y * scale_ratio);

        if(data_only) {
            return {
                x: x,
                y: y,
                scale: scale_ratio
            }
        }

        let currentBackground = photosApp.fullscreen.currentBackground;
        currentBackground.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale_ratio})`;

        currentBackground.setAttribute('data-x', x);
        currentBackground.setAttribute('data-y', y);
        currentBackground.setAttribute('data-scale', scale_ratio);
    },
    updatePan: function(x, y) {
        let currentImage = photosApp.fullscreen.currentImage;

        let scale = photosApp.fullscreen.currentImage.getAttribute('data-scale');

        let x_diff = x - photosApp.fullscreen.touchstartx;
        let y_diff = y - photosApp.fullscreen.touchstarty;

        let transform_left = photosApp.fullscreen.pan.startX + x_diff;
        let transform_top = photosApp.fullscreen.pan.startY + y_diff;

        currentImage.style.transform = `translate3d(${transform_left}px, ${transform_top}px, 0) scale(${scale})`;

        currentImage.setAttribute('data-x', transform_left);
        currentImage.setAttribute('data-y', transform_top);

        photosApp.fullscreen.setBackgroundTransformFromImage();

    },
    getPanBounds: function(custom_scale) {
        let currentImage = photosApp.fullscreen.currentImage;
        if(!currentImage) {
            return;
        }

        let w = Number.parseFloat(currentImage.style.width.replace('px', ''));
        let h = Number.parseFloat(currentImage.style.height.replace('px', ''));

        let scale = currentImage.getAttribute('data-scale');

        if(custom_scale) {
            scale = custom_scale;
        }

        let prev_image_screen_width = w * scale;
        let prev_image_screen_height = h * scale;

        let original_x = Number.parseFloat(currentImage.getAttribute('data-x-original'));
        let original_y = Number.parseFloat(currentImage.getAttribute('data-y-original'));

        let screen_w = photosApp.style.screen.width.current;
        let screen_h = photosApp.style.screen.height.current;

        //right
        let right_x_bound = screen_w - prev_image_screen_width - original_x;

        //bottom
        let bottom_y_bound = screen_h - prev_image_screen_height - original_y;

        return {
            x: {
                l: original_x,
                r: right_x_bound
            },
            y: {
                t: original_y,
                b: bottom_y_bound
            }
        }
    },
    panEnd: function() {
        return new Promise(async (resolve, reject) => {
            let currentImage = photosApp.fullscreen.currentImage;
            if(!currentImage) {
                return resolve();
            }

            let scale = currentImage.getAttribute('data-scale');

            let current_x = Number.parseFloat(currentImage.getAttribute('data-x'));
            let current_y = Number.parseFloat(currentImage.getAttribute('data-y'));

            let transform_left = current_x;
            let transform_top = current_y;

            let update_x = false;
            let update_y = false;

            let bounds = photosApp.fullscreen.getPanBounds();

            //x bounds
            if(current_x > bounds.x.l) {
                update_x = true;
                transform_left = bounds.x.l;
            }

            if(current_x < bounds.x.r) {
                update_x = true;
                transform_left = bounds.x.r;
            }

            //y bounds
            if(current_y > bounds.y.t) {
                update_y = true;
                transform_top = bounds.y.t;
            }

            if(current_y < bounds.y.b) {
                update_y = true;
                transform_top = bounds.y.b;
            }

            if(update_x || update_y) {
                addClassEl('pan-out-of-bounds', photosApp.app.els.fullscreen);

                let prev_data = photosApp.fullscreen.setBackgroundTransformFromImage(true);

                devConsole(prev_data);

                currentImage.style.transform = `translate3d(${transform_left}px, ${transform_top}px, 0) scale(${scale})`;
                currentImage.setAttribute('data-x', transform_left);
                currentImage.setAttribute('data-y', transform_top);

                let data = photosApp.fullscreen.setBackgroundTransformFromImage(true);

                devConsole(data);

                addClassEl('transition-transform-0', photosApp.fullscreen.currentBackground);

                await photosApp.animation.transformScale(photosApp.fullscreen.currentBackground, prev_data.x, data.x, prev_data.y, data.y, data.scale, data.scale,
                    photosApp.fullscreen.default_transition, 'easeOutQuad', photosApp.fullscreen.touchstart_int);

                removeClassEl('transition-transform-0', photosApp.fullscreen.currentBackground);
                removeClassEl('pan-out-of-bounds', photosApp.app.els.fullscreen);
                resolve();

            } else {
                resolve();
            }
        });
    },
    zoomTransform: function (destination_scale, x, y) {
        let scaled_transform_left, scaled_transform_top;

        let currentImage = photosApp.fullscreen.currentImage;

        let min_scale = Number.parseFloat(currentImage.getAttribute('data-scale-original'));
        let original_x = Number.parseFloat(currentImage.getAttribute('data-x-original'));
        let original_y = Number.parseFloat(currentImage.getAttribute('data-y-original'));

        let w = Number.parseFloat(currentImage.style.width.replace('px', ''));
        let h = Number.parseFloat(currentImage.style.height.replace('px', ''));

        let screen_w = photosApp.style.screen.width.current;
        let screen_h = photosApp.style.screen.height.current;

        let prev_scale = Number.parseFloat(currentImage.getAttribute('data-scale'));

        //needed to hide background image
        if(destination_scale < min_scale) {
            // photosApp.fullscreen.setScaleTooLow(true);
        } else {
            photosApp.fullscreen.setScaleTooLow(false);
        }

        let prev_x = Number.parseFloat(currentImage.getAttribute('data-x'));
        let prev_y = Number.parseFloat(currentImage.getAttribute('data-y'));

        let prev_image_screen_width = w * prev_scale;
        let prev_image_screen_height = h * prev_scale;

        let prev_x_start = x - prev_x;
        let prev_y_start = y - prev_y;

        let prev_image_x_ratio = prev_x_start / prev_image_screen_width;
        let prev_image_y_ratio = prev_y_start / prev_image_screen_height;

        let image_scale_w = destination_scale * w;
        let image_scale_h = destination_scale * h;

        let scale_x_point = image_scale_w * prev_image_x_ratio;
        let scale_y_point = image_scale_h * prev_image_y_ratio;

        //get this point of image to be in same exact spot as our x, y

        //prevent zooming on black
        let screen_image_diff_x = prev_image_screen_width - screen_w;
        let screen_image_diff_y = prev_image_screen_height - screen_h;

        let use_center_x = false;
        let use_center_y = false;

        if(original_x > 1 && screen_image_diff_x < 0) {
            //left
            if(Math.abs(screen_image_diff_x / 2) > x) {
                use_center_x = true;
            }

            //right
            if(Math.abs(screen_image_diff_x / 2) + prev_image_screen_width < x) {
                use_center_x = true;
            }
        }

        if(use_center_x) {
            return photosApp.fullscreen.zoomTransform(destination_scale, screen_w / 2, y);
        } else {
            scaled_transform_left = x - scale_x_point;
        }

        if(original_y > 1 && screen_image_diff_y < 0) {
            //left
            if(Math.abs(screen_image_diff_y / 2) > y) {
                use_center_y = true;
            }

            //right
            if(Math.abs(screen_image_diff_y / 2) + prev_image_screen_height < y) {
                use_center_y = true;
            }
        }

        if(use_center_y) {
            return photosApp.fullscreen.zoomTransform(destination_scale, x, screen_h / 2);
        } else {
            scaled_transform_top = y - scale_y_point;
        }

        //zoom bounds
        if(destination_scale.toFixed(4) === min_scale.toFixed(4)) {
            return {
                x: original_x,
                y: original_y
            }
        } else if(destination_scale < min_scale) {
            return {
                x: Math.max(scaled_transform_left, original_x),
                y: Math.max(scaled_transform_top, original_y)
            }
        } else {
            let bounds = photosApp.fullscreen.getPanBounds(destination_scale);

            //x bounds
            if(scaled_transform_left > bounds.x.l) {
                scaled_transform_left = bounds.x.l;
            } else if(scaled_transform_left < bounds.x.r) {
                scaled_transform_left = bounds.x.r;
            }

            //y bounds
            if(scaled_transform_top > bounds.y.t) {
                scaled_transform_top = bounds.y.t;
            } else if(scaled_transform_top < bounds.y.b) {
                scaled_transform_top = bounds.y.b;
            }

            return {
                x: scaled_transform_left,
                y: scaled_transform_top
            }
        }
    },
    setCurrentSlide(item_id) {
        photosApp.fullscreen.currentSlide = document.getElementById('slide-' + item_id);
    },
    setCurrentImage() {
        let current_slide = photosApp.fullscreen.getActiveSlide();

        try {
            photosApp.fullscreen.currentImage = current_slide.querySelector(`.${photosApp.fullscreen.img_class}`);
        } catch(e) {
        }
    },
    setCurrentBackground() {
        let current_slide = photosApp.fullscreen.getActiveSlide();
        photosApp.fullscreen.currentBackground = current_slide.querySelector('.fullscreen-background');
    },
    setImageEventsClass(bool) {
        if(bool) {
            addClassEl(photosApp.fullscreen.events_class, photosApp.app.els.fullscreen);
        } else {
            removeClassEl(photosApp.fullscreen.events_class, photosApp.app.els.fullscreen);
        }
    },
    setScaleTooLow: function (bool) {
        let cl = 'scale-too-low';
        let t_prop = 'scaleTooLowTs';

        if(bool) {
            addClassEl(cl, photosApp.app.els.fullscreen);
            photosApp.fullscreen.setInteract(false);
        } else {
            if(!photosApp.fullscreen[t_prop]) {
                photosApp.fullscreen[t_prop] = [];
            }

            for(let stlt of photosApp.fullscreen[t_prop]) {
                clearTimeout(stlt);
            }

            let t = setTimeout(function () {
                if(photosApp.app.els.fullscreen.classList.contains(photosApp.fullscreen.events_class)) {
                    return photosApp.fullscreen.setScaleTooLow(false);
                } else {
                    removeClassEl(cl, photosApp.app.els.fullscreen);
                }
            }, photosApp.fullscreen.zoom.scale_low_duration);

            photosApp.fullscreen[t_prop].push(t);
        }
    },
    setPanInProgress: function(bool) {
        let cl = 'pan-in-progress';
        let t_prop = 'panInProgressTs';

        if(bool) {
            photosApp.fullscreen.pan.in_progress = true;
            addClassEl(cl, photosApp.app.els.fullscreen);
            photosApp.fullscreen.setInteract(false);
        } else {
            photosApp.fullscreen.pan.in_progress = false;

            if(!photosApp.fullscreen[t_prop]) {
                photosApp.fullscreen[t_prop] = [];
            }

            for(let stlt of photosApp.fullscreen[t_prop]) {
                clearTimeout(stlt);
            }

            let t = setTimeout(function () {
                if(photosApp.app.els.fullscreen.classList.contains(photosApp.fullscreen.events_class)) {
                    return photosApp.fullscreen.setPanInProgress(false);
                } else {
                    removeClassEl(cl, photosApp.app.els.fullscreen);
                }
            }, 500);

            photosApp.fullscreen[t_prop].push(t);
        }
    },
    setPanTransition: function(bool) {
        let cl = 'pan-transition';

        let cl2 = 'recently-panned'; //use to hide background image
        let t_prop = 'panTransitionTs';

        if(bool) {
            addClassEl(cl, photosApp.app.els.fullscreen);
            addClassEl(cl2, photosApp.app.els.fullscreen);
            photosApp.fullscreen.setInteract(false);
        } else {
            if(!photosApp.fullscreen[t_prop]) {
                photosApp.fullscreen[t_prop] = [];
            }

            for(let stlt of photosApp.fullscreen[t_prop]) {
                clearTimeout(stlt);
            }

            let t = setTimeout(function () {
                if(photosApp.app.els.fullscreen.classList.contains('pan-in-progress')) {
                    return photosApp.fullscreen.setPanTransition(false);
                } else {
                    removeClassEl(cl, photosApp.app.els.fullscreen);
                    removeClassEl(cl2, photosApp.app.els.fullscreen);
                }
            }, 500);

            photosApp.fullscreen[t_prop].push(t);
        }
    },
    setSlideInMomentum: function(bool) {
        let cl = 'slide-in-momentum';

        let cl2 = 'recently-slide'; //use to hide background image

        let t_prop = 'slideInMomentumTs';

        if(bool) {
            addClassEl(cl, photosApp.app.els.fullscreen);
            addClassEl(cl2, photosApp.app.els.fullscreen);
        } else {
            if(!photosApp.fullscreen[t_prop]) {
                photosApp.fullscreen[t_prop] = [];
            }

            for(let stlt of photosApp.fullscreen[t_prop]) {
                clearTimeout(stlt);
            }

            let t = setTimeout(function () {
                if(photosApp.app.els.fullscreen.classList.contains(photosApp.fullscreen.events_class)) {
                    return photosApp.fullscreen.setSlideInMomentum(false);
                } else {
                    removeClassEl(cl, photosApp.app.els.fullscreen);
                    removeClassEl(cl2, photosApp.app.els.fullscreen);
                }
            }, 500);

            photosApp.fullscreen[t_prop].push(t);
        }
    },
    setRecentlyZoomedClass: function (bool) {
        let cl = 'recently-zoomed';
        let t_prop = 'recentlyZoomedTs';

        if(bool) {
            addClassEl(cl, photosApp.app.els.fullscreen);
            photosApp.fullscreen.setInteract(false);
        } else {
            if(!photosApp.fullscreen[t_prop]) {
                photosApp.fullscreen[t_prop] = [];
            }

            for(let stlt of photosApp.fullscreen[t_prop]) {
                clearTimeout(stlt);
            }

            let t = setTimeout(function () {
                if(photosApp.app.els.fullscreen.classList.contains(photosApp.fullscreen.events_class)) {
                    return photosApp.fullscreen.setRecentlyZoomedClass(false);
                } else {
                    removeClassEl(cl, photosApp.app.els.fullscreen);
                }
            }, photosApp.fullscreen.default_transition);

            photosApp.fullscreen[t_prop].push(t);
        }
    },
    getRecentlyZoomed: function() {
        return photosApp.app.els.fullscreen.classList.contains('recently-zoomed');
    },
    setInteract: function (bool, toggle) {
        if(photosApp.app.els.fullscreen.classList.contains('recently-zoomed')) {
            return;
        }

        if(toggle) {
            bool = !photosApp.app.els.fullscreen.classList.contains('interact');
        }

        if(bool) {
            let t_prop = 'setInteractTs';

            if(!photosApp.fullscreen[t_prop]) {
                photosApp.fullscreen[t_prop] = [];
            }

            for(let stlt of photosApp.fullscreen[t_prop]) {
                clearTimeout(stlt);
            }

            if(photosApp.fullscreen.pan.in_progress) {
                devConsole("Prevent interact, ", `pan: ${photosApp.fullscreen.pan.in_progress}`);
                return false;
            }

            let t = setTimeout(function () {
                if(photosApp.fullscreen.pan.in_progress) {
                    devConsole("Prevent interact, ", `pan: ${photosApp.fullscreen.pan.in_progress}`);
                    return false;
                }

                addClassEl('interact', photosApp.app.els.fullscreen);
            }, 0);

            photosApp.fullscreen[t_prop].push(t);

        } else {
            removeClassEl('interact', photosApp.app.els.fullscreen);
        }
    },
    resetSlideItem: function (item_id) {
        let prev_slide = document.getElementById('slide-' + item_id);

        let prev_img = prev_slide.querySelector(`.${photosApp.fullscreen.img_class}`);
        let prev_bg = prev_slide.querySelector('.fullscreen-background');

        if(prev_img) {
            //x, y, scale
            let x_original = prev_img.getAttribute('data-x-original');
            let y_original = prev_img.getAttribute('data-y-original');
            let scale_original = prev_img.getAttribute('data-scale-original');
            prev_img.style.transform = `translate3d(${x_original}px, ${y_original}px, 0px) scale(${scale_original})`;
            prev_img.setAttribute('data-x', x_original);
            prev_img.setAttribute('data-y', y_original);
            prev_img.setAttribute('data-scale', scale_original);

            prev_bg.style.transform = `scale(1)`;
        }
    },
    navigationEvents() {
        let prev = document.getElementById('slide-prev');
        let next = document.getElementById('slide-next');

        if(!prev._navigation_listener) {
            prev._navigation_listener = true;

            prev.addEventListener(click_handler, function (e) {
                e.preventDefault();
                e.stopPropagation();
                photosApp.fullscreen.changeSlide('l');
                photosApp.fullscreen.allowSlide(true);
            });
        }

        if(!next._navigation_listener) {
            next._navigation_listener = true;

            next.addEventListener(click_handler, function (e) {
                e.preventDefault();
                e.stopPropagation();
                photosApp.fullscreen.changeSlide('r');
                photosApp.fullscreen.allowSlide(true);
            });
        }
    },
    controlEvents() {
        let els = [document.getElementById('slide-prev'),
            document.getElementById('slide-next'),
            photosApp.app.els.fullscreen.querySelector('.top-bar')
        ];

        if(!is_touch_device()) {
            for(let i = 0; i < els.length; i++) {
                let el = els[i];

                if(!el._control_listener) {
                    el._control_listener = true;

                    el.addEventListener('mouseenter', function (e) {
                        addClassEl('show-controls', photosApp.app.els.fullscreen);
                    });

                    el.addEventListener('mouseleave', function (e) {
                        removeClassEl('show-controls', photosApp.app.els.fullscreen);
                    });
                }
            }
        }
    },
    activateDeactivateSlideButtons() {
        let prev_button = document.getElementById('slide-prev');
        let next_button = document.getElementById('slide-next');

        let cur = photosApp.fullscreen.currentSlide;
        let id = cur.getAttribute('data-item-id');
        id = Number.parseInt(id);

        if(photosApp.fullscreen.item_ids.list.indexOf(id) === 0) {
            addClassEl('disable', prev_button);
        } else {
            removeClassEl('disable', prev_button);
        }

        if(photosApp.fullscreen.item_ids.list.indexOf(id) === photosApp.fullscreen.item_ids.list.length - 1) {
            addClassEl('disable', next_button);
        } else {
            removeClassEl('disable', next_button);
        }
    },
    setZoomInProgress(bool) {
        photosApp.fullscreen.zoom.in_progress = bool;
    },
    clearBackgroundInts() {
        for(let int of photosApp.fullscreen.background_change_ints) {
            clearInterval(int);
        }

        photosApp.fullscreen.background_change_ints = [];
    },
    setOpenInProgress(bool) {
        photosApp.fullscreen.open_in_progress = bool;

        if(bool) {
            addClassEl(photosApp.style.classes.fullscreen_open_ip, photosApp.app.els.fullscreen);
        } else {
            removeClassEl(photosApp.style.classes.fullscreen_open_ip, photosApp.app.els.fullscreen);
        }
    }
};