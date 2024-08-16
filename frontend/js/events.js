let mouse_memory = {
    target: {
        down: null,
        up: null
    }
};

// isScrolling variable
let lastScrollTop = {};

photosApp.events = {
    init_called: false,
    init: function () {
        photosApp.initLastStep = 'events';

        return new Promise((resolve, reject) => {
            if(photosApp.events.init_called) {
                return resolve();
            }

            photosApp.events.init_called = true;

            window.addEventListener("keydown", handleKeyDown, false);
            window.addEventListener("keyup", handleKeyUp, false);
            window.addEventListener("mousedown", onMouseDown, false);
            window.addEventListener("mouseup", onMouseUp, false);

            window.addEventListener("beforeunload", handleBeforeUnload, false);

            photosApp.app.els.app = document.getElementById('app');
            photosApp.app.els.header = document.getElementById('header');
            photosApp.app.els.footer = document.getElementById('footer');
            photosApp.app.els.navigation = document.getElementById('navigation');
            photosApp.app.els.level2 = document.getElementById('view-level-2');
            photosApp.app.els.level3 = document.getElementById('navigation-level-3');
            photosApp.app.els.time = document.getElementById('time');
            photosApp.app.els.confirmAction = document.getElementById('confirm-action');
            photosApp.app.els.confirmMessage = document.getElementById('confirm-message');
            photosApp.app.els.fullscreen = document.getElementById('fullscreen');
            photosApp.app.els.slideshow = document.getElementById('slideshow');
            photosApp.app.els.notifications = document.getElementById('notifications');
            photosApp.app.els.sideButtons = document.getElementById('side-buttons');
            photosApp.app.els.featureTimeInput = document.getElementById('feature-time-input');
            photosApp.app.els.featureTimeRange = document.getElementById('feature-time-range');
            photosApp.app.els.featureParallelInput = document.getElementById('feature-parallel-input');
            photosApp.app.els.featureParallelRange = document.getElementById('feature-parallel-range');
            photosApp.app.els.featureChronologySwap = document.getElementById('feature-chronology-swap');
            photosApp.app.els.featureManageFolders = document.getElementById('feature-manage-folders');

            //for life view
            let time_el =  document.getElementById('time');
            let life_el = document.getElementById('life');

            let life_els = [time_el, life_el];

            for(let el of life_els) {
                el.addEventListener('scroll', _.throttle(function (e) {
                    if(photosApp.app.is_fullscreen) {
                        return false;
                    }

                    photosApp.navigation.scrollTop = el.scrollTop;
                }, 100));

                el.addEventListener('scroll', _.throttle(function (e) {
                    onTimeScrollLogic('life');
                }, 300));
            }

            // to show navigation
            window.addEventListener('mousemove', _.throttle(function (e) {
                if(!e.clientY || photosApp.app.els.app.classList.contains('onboarding')) {
                    return;
                }

                //bottom navigation
                let min_to_show = photosApp.style.screen.height.current - photosApp.style.fullNavigationHeight;

                if(e.clientY >= min_to_show || photosApp.navigation.forceShow) {
                    if(!(photosApp.app.els.app.classList.contains(photosApp.style.classes.show_navigation))) {
                        addClassEl(photosApp.style.classes.show_navigation, photosApp.app.els.app);
                    }
                } else {
                    if(photosApp.app.els.app.classList.contains(photosApp.style.classes.show_navigation)) {
                        devConsole("mouse move remove nav");
                        removeClassEl(photosApp.style.classes.show_navigation, photosApp.app.els.app);
                    }
                }

                //side buttons
                let min_side_show = photosApp.style.screen.width.current - 100;

                if(e.clientX >= min_side_show && !elHasClass(photosApp.app.els.app, photosApp.style.classes.hide_side_buttons)) {
                    addClassEl('show', photosApp.app.els.sideButtons);
                } else {
                    removeClassEl('show', photosApp.app.els.sideButtons);
                }
            }, 200));

            photosApp.events.featuresHandler();
            photosApp.events.fullscreenMouseMove();
            photosApp.events.slideshowMouseMove();
            photosApp.events.bodyClickHandler();
            photosApp.app.notificationHandler();
            photosApp.events.level3Handler();
            photosApp.events.confirmActionHandler();
            photosApp.events.preventDocumentScroll();
            photosApp.events.headerControlHandler();
            photosApp.events.rotateControlHandler();
            photosApp.events.controlsControlHandler();
            photosApp.events.footerControlHandler();
            photosApp.events.recordScreenHandler();

            photosApp.slideshow.events();


            resolve();
        });
    },
    onDivColumnClick: function (event) {
        devConsole("Open item fullscreen");
        photosApp.fullscreen.open(event, event.currentTarget);
    },
    onGridMenuClick: function(event) {
        photosApp.view.showDateMenu(event);
    },
    bodyClickHandler() {
        document.querySelector('body').addEventListener(click_handler, function (e) {
            e = e || window.event;

            photosApp.events.closeConditionally(e);
        });

        document.querySelector('html').addEventListener('mouseup', function (e) {
            if(photosApp.app.is_fullscreen && photosApp.fullscreen.mouse.down.active) {
                devConsole("html mouseup");
                let evt = document.createEvent("MouseEvents");
                evt.initEvent("mouseup", true, true);
                photosApp.app.els.fullscreen.querySelector('.slides-wrapper').dispatchEvent(evt);
            }
        });
    },
    level3Handler: function () {
        async function organizeUpdate() {
            let organize_menu = document.getElementById('organize-menu');

            //do not show if no items selected
            let items_selected_count = Object.keys(photosApp.organize.selected.items).length;

            if(!items_selected_count) {
                photosApp.app.setLevel3IP(false);
                return false;
            }

            if(organize_menu.querySelector('.date.selected')) {
                try {
                    await photosApp.organize.onBatchDateSubmit();
                } catch (e) {
                    console.error(e);
                }
            } else if(organize_menu.querySelector('.delete.selected')) {
                photosApp.app.openConfirm(null, 'batch-delete', `Would you like to delete ${items_selected_count} item${items_selected_count > 1 ? 's' : ''}?`);
            }

            photosApp.app.setLevel3IP(false);
        }

        document.getElementById('level-3-confirm')
            .addEventListener(click_handler, async function (e) {
                if(photosApp.navigation.level3.updateIP) {
                    return false;
                }

                photosApp.app.setLevel3IP(true);

                if(photosApp.app.views.level2.active === 'grid' && photosApp.navigation.level3.current === 'organize-all') {
                    organizeUpdate();
                }
            });
    },
    confirmActionHandler: function () {
        document.getElementById('confirm-yes').addEventListener(click_handler, async function (e) {
            e.preventDefault();
            e.stopPropagation();

            if(photosApp.app.confirmIP) {
                return false;
            }

            photosApp.app.confirmIP = true;

            removeClassEl('error', photosApp.app.els.confirmMessage);

            let action = document.getElementById('confirm-action').getAttribute('data-action');

            photosApp.app.setSpinner(photosApp.app.els.confirmAction, true);

            let dataId = photosApp.app.els.confirmAction.getAttribute('data-id');

            if(action === 'fullscreen-delete-item') {
                photosApp.app.hideConfirm();

                photosApp.fullscreen.deleteLogic(dataId, {
                    ip: 'delete',
                    field: 'deleted',
                    value: timeNow()
                });
            } else if(action === 'batch-delete') {
                photosApp.organize.onBatchDeleteConfirm('delete');
            }
        });

        document.getElementById('confirm-no').addEventListener(click_handler, function (e) {
            photosApp.app.hideConfirm();
            e.preventDefault();
            e.stopPropagation();
        });
    },
    selectGridItem: function (event) {
        let item_id = event.currentTarget.getAttribute('data-item-id');

        let obj = null;

        let context = '';

        if(document.getElementById('organize-all').classList.contains('active')) {
            obj = photosApp.organize.selected.items;
            context = 'Organize';
        }

        let adding_item = false;

        if(item_id in obj) {
            delete obj[item_id];
            removeClassEl('selected', event.currentTarget.firstChild);
            addDeselectedClass(event.currentTarget.firstChild);
        } else {
            obj[item_id] = true;
            addClassEl('selected', event.currentTarget.firstChild);
            removeClassEl('deselected', event.currentTarget.firstChild);
            adding_item = true;
        }

        photosApp.time[`update${context}GridItemsCount`]();

        //handle actions for batch organize
        if(context === 'Organize') {
            let gi = document.getElementById('gridorganizeitem' + item_id)
            let dn = gi.querySelector('.date.new');

            if(adding_item) {
                let organize_menu = document.getElementById('organize-menu');

                if(organize_menu.querySelector('.date.selected') && photosApp.organize.calendar_instance && photosApp.organize.calendar_instance.latestSelectedDateObj) {
                    let date = moment(photosApp.organize.calendar_instance.latestSelectedDateObj);
                    if(!(item_id in photosApp.organize.items)) {
                        photosApp.organize.items[item_id] = {};
                    }

                    let oi = photosApp.organize.items[item_id];
                    oi.year = date.year();
                    oi.month = formatNumberLength(date.month() + 1, 2);
                    oi.date = formatNumberLength(date.date(), 2);

                    dn.innerHTML = `${oi.year}-${oi.month}-${oi.date}`;
                }
            } else {
                delete photosApp.organize.items[item_id];
                dn.innerHTML = '';
            }
        }
    },
    onItems: async function () {
        return new Promise(async (resolve, reject) => {
            let data;

            try {
                let r = await axios.get(`${photosApp.backend.host}ws/items`);
                data = r.data;
            } catch(e) {
                console.error(e);
                return reject(e);
            }

            let items = data.items;
            let variants = data.variants;
            let grid = data.grid;
            let data_only = data.data_only;

            for(let k in items) {
                let item = items[k];
                photosApp.items.local.items[item.id] = item;
            }

            for(let k in variants) {
                let variant = variants[k];

                if(!variant) {
                    continue;
                }

                if(!(variant.item_id in photosApp.items.local.variants)) {
                    photosApp.items.local.variants[variant.item_id] = {};
                }

                if(!variant.variant_type) {
                    continue;
                }

                photosApp.items.local.variants[variant.item_id][variant.variant_type] = variant;
            }

            photosApp.grid.life = grid;

            if(items.length && !data_only) {
                try {
                    let life_columns = document.getElementsByClassName('life__column');

                    if(!life_columns.length || life_columns.length !== photosApp.settings.data.feature.parallel) {
                        await photosApp.app.updateHtml(true, true);
                    }
                } catch (e) {

                }
            }

            photosApp.time.updateChronologyFromTo();

            resolve();
        });
    },
    onNotification: function (args) {
        let key = args.key;
        let data = args.data;
        let new_notifications_count = args.new_notifications_count;

        if(key && data) {
            if(!(key in photosApp.notifications)) {
                photosApp.notifications[key] = {
                    data: data,
                    timestamp: data.timestamp ? data.timestamp : timeNow(),
                    started: data.started ? data.started : timeNow()
                };
            } else {
                photosApp.notifications[key].data =  data;
                photosApp.notifications[key].timestamp = data.timestamp ? data.timestamp : timeNow();

                //set new count to 0 since key already exists
                new_notifications_count = 0;
            }

            if(data.remove_notification) {
                delete photosApp.notifications[key];
            }

            photosApp.app.updateNotifications();
        }

        if(new_notifications_count > 0) {
            devConsole(photosApp.notifications);
        }

        //calc
        let update_count = photosApp.app.notificationCount;

        if(new_notifications_count && new_notifications_count > update_count) {
            update_count = new_notifications_count;
        }

        photosApp.app.updateNotificationsCount(update_count);
    },
    onIntervalLoop: function (args) {
        photosApp.time.intervalLoop = args.interval_loop;
    },
    onFullscreenVariant: function (args) {
        let variant = args.data;

        let fullscreen_el = document.getElementById('image-' + variant.item_id);

        if(fullscreen_el) {
            let url = variant.local_url;
            fullscreen_el.style.backgroundImage = `url('${url}')`;

            devConsole({
                url: url,
                background: fullscreen_el.style.backgroundImage
            })
        }
    },
    onNotificationsClick: async function() {
        let url = `${photosApp.backend.host}notifications/seen`;

        photosApp.app.updateNotificationsCount(0);

        try {
            await axios.put(url, {
                notification_keys: Object.keys(photosApp.notifications)
            });
        } catch (e) {
            console.error(e);
        }
    },
    closeConditionally: function (e) {
        let target = e.target || e.srcElement;

        if(document.getElementById('app').classList.contains('onboarding')) {
            return  false;
        }

        if(photosApp.organize.isCalendarOpen) {
            if(e.key === 'Escape') {
                photosApp.organize.calendar_instance.close();
            }
            return false;
        }

        if(photosApp.slideshow.in_slideshow) {
            if(is_touch_device()) {
                photosApp.slideshow.setInteract(null, true);
            }

            if(e.key === 'Escape') {
                photosApp.slideshow.exitSlideShow();
            }
        } else if(photosApp.app.is_fullscreen) {
            let active_dropdown = photosApp.app.els.fullscreen.querySelector('.action.active');

            if(is_touch_device()) {
                if(active_dropdown && active_dropdown.contains(target)) {
                    return false;
                } else if(active_dropdown) {
                    removeClassEl('active', active_dropdown);
                    e.stopPropagation();
                } else {
                    //before toggling interact, see if double tap initiated zoom
                    let int_start = timeNow(true);

                    let int = setInterval(function () {
                        if(timeNow(true) - int_start >= photosApp.fullscreen.zoom.double_tap_threshold) {
                            clearInterval(int);

                            photosApp.fullscreen.setInteract(null, true);
                        } else if (photosApp.fullscreen.zoom.toggle_ip) {
                            clearInterval(int);
                        }
                    }, 16);
                }
            } else {
                if(e.key === 'Escape') {
                    if(active_dropdown) {
                        removeClassEl('active', active_dropdown);
                    } else if (photosApp.fullscreen.zoom.in_progress) {
                        photosApp.fullscreen.toggleZoom();
                        photosApp.fullscreen.allowSlide(true);
                    } else {
                        photosApp.fullscreen.exitFullscreen();
                    }
                } else if(active_dropdown && active_dropdown.contains(target)) {
                    return false;
                } else if(active_dropdown) {
                    removeClassEl('active', active_dropdown);
                }
            }
        } else if(photosApp.app.levels["2"].open) {
            if (!photosApp.app.els.level2.contains(target)) {
                photosApp.app.hideLevel2();
            }
        } else if(elHasClass(photosApp.app.els.notifications, 'show')) {
            if (!photosApp.app.els.notifications.contains(target)) {
                removeClassEl('show', photosApp.app.els.notifications);
                return false;
            }
        } else if(photosApp.app.dateMenu.open) {
            try {
                if(photosApp.app.els.time.querySelector('.time-period.display').querySelector('.context__menu').contains(target)) {
                    return false;
                }
            } catch (e) {
            }

            return photosApp.app.hideDateMenu();
        }
    },
    addOrganizeMenuHandler: function () {
        devConsole("add organize menu handler");

        let organize_menu = document.getElementById('organize-menu');
        let level3 = photosApp.app.els.level3;

        let tab_els = organize_menu.getElementsByClassName('tab');

        let tab_classes = photosApp.organize.tab_classes;

        for(let class_name in tab_classes) {
            let el = organize_menu.querySelector(`.tab.${class_name}`);

            el.addEventListener(click_handler, function (e) {
                e.preventDefault();
                e.stopPropagation();

                removeClassEls('selected', tab_els);
                addClassEl('selected', this);

                for(let cn in tab_classes) {
                    removeClassEl(cn, level3);
                    removeClassEl(cn, organize_menu);
                }

                document.getElementById('level-3-confirm').innerHTML = tab_classes[class_name].button_text;

                addClassEl(class_name, level3);
                addClassEl(class_name, organize_menu);

                photosApp.organize.last_menu = class_name;
            });
        }
    },
    preventDocumentScroll() {
        document.addEventListener('scroll', function (e) {
            e.preventDefault();
        });
    },
    headerControlHandler() {
        let control_el = document.getElementById('header-control');

        control_el.addEventListener(click_handler, function (e) {
            e.preventDefault();
            e.stopPropagation();

            photosApp.style.headerVisibleLogic();
        });
    },
    rotateControlHandler() {
        let rotate_el = document.getElementById('rotation-control');

        rotate_el.addEventListener(click_handler, function (e) {
            e.preventDefault();
            e.stopPropagation();

            photosApp.rotate.rotateLogic();
        });
    },
    controlsControlHandler() {
        let control_el = document.getElementById('controls-control');

        control_el.addEventListener(click_handler, function (e) {
            e.preventDefault();
            e.stopPropagation();

            photosApp.style.controlsLogic();
        });
    },
    footerControlHandler() {
        let control_el = document.getElementById('footer-control');

        control_el.addEventListener(click_handler, function (e) {
            e.preventDefault();
            e.stopPropagation();

            photosApp.style.footerVisibleLogic();
        });
    },
    featuresHandler: function () {
        photosApp.app.els.featureTimeRange.addEventListener('input', function (e) {
            let val = this.value;

            if(!isNumeric(val)) {
                return;
            }

            photosApp.app.els.featureTimeInput.value = val;

            photosApp.time.setMinutes(parseFloat(val));
        });

        photosApp.app.els.featureTimeInput.addEventListener('blur', function (e) {
            e.preventDefault();

            let prev_value = photosApp.app.els.featureTimeRange.value;

            let value = this.value;

            if(!isNumeric(value)) {
                photosApp.app.els.featureTimeInput.value = prev_value;

                return false;
            }

            if(value < .1) {
                value = .1;
                photosApp.app.els.featureTimeInput.value = value;
            }

            photosApp.app.els.featureTimeRange.value = value;

            photosApp.time.setMinutes(parseFloat(value));
        });

        photosApp.app.els.featureParallelRange.addEventListener('input', function (e) {
            let val = this.value;

            if(!isNumeric(val)) {
                return;
            }

            photosApp.app.els.featureParallelInput.value = val;

            photosApp.grid.setParallel(parseInt(val));
        });

        photosApp.app.els.featureParallelInput.addEventListener('blur', function (e) {
            e.preventDefault();

            let prev_value = photosApp.app.els.featureParallelRange.value;

            let value = this.value;

            if(!isNumeric(value)) {
                photosApp.app.els.featureParallelInput.value = prev_value;
                return false;
            }

            if(parseFloat(value) > photosApp.grid.maxParallel) {
                value = photosApp.grid.maxParallel;
            } else if(parseFloat(value) < 1) {
                value = 1;
            }

            photosApp.app.els.featureParallelInput.value = value;

            photosApp.app.els.featureParallelRange.value = value;

            photosApp.grid.setParallel(parseInt(value));
        });

        photosApp.app.els.featureChronologySwap.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            photosApp.time.swapChronology();
        });

        photosApp.app.els.featureManageFolders.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            photosApp.view.updateManageDirectories();

            photosApp.app.showLevel2('folders');
        });

        document.getElementById('close-folders').addEventListener('click', function (e) {
            e.preventDefault();
            photosApp.app.hideLevel2();
        });

        photosApp.local.onAddFolder();
    },
    deleteFoldersDir: function () {
        let delete_els = document.getElementById('manage-folders').getElementsByClassName('delete-dir');

        for(let i = 0; i < delete_els.length; i++) {
            let el = delete_els[i];

            if(!el._listener) {
                el._listener = true;

                el.addEventListener(click_handler, function (e) {
                    e.stopPropagation();

                    let dir = this.getAttribute('data-dir-key');

                    let row = this.closest('.dir-row');

                    row.parentNode.removeChild(row);

                    photosApp.local.removeFolder(dir);
                });
            }
        }
    },
    fullscreenMouseMove() {
        let fullscreenTs = [];

        photosApp.app.els.fullscreen.addEventListener('mousemove', _.throttle(function (e) {
            e.preventDefault();

            if(is_touch_device()) {
                return false;
            }

            for(let t of fullscreenTs) {
                clearTimeout(t);
            }

            let fst = setTimeout(function () {
                removeClassEl('interact', photosApp.app.els.fullscreen);
            }, photosApp.fullscreen.interactTimeout);

            fullscreenTs.push(fst);

            addClassEl('interact', photosApp.app.els.fullscreen);

        }, 200));
    },
    slideshowMouseMove() {
        let slideshowTs = [];

        photosApp.app.els.slideshow.addEventListener('mousemove', _.throttle(function (e) {
            e.preventDefault();

            if(is_touch_device()) {
                return false;
            }

            for(let t of slideshowTs) {
                clearTimeout(t);
            }

            addClassEl('interact', photosApp.app.els.slideshow);

            let fst = setTimeout(function () {
                if(!e.target.closest('.slideshow-controls')) {
                    removeClassEl('interact', photosApp.app.els.slideshow);
                }
            }, photosApp.slideshow.interactTimeout);

            slideshowTs.push(fst);

        }, 200));
    },
    recordScreenHandler: function () {
        let start_record_el = document.getElementById('record-screen');

        if(start_record_el._listener) {
            return;
        }

        start_record_el._listener = true;

        start_record_el.addEventListener('click', async function (e) {
            e.preventDefault();
            e.stopPropagation();

            let r = await photosApp.app.ipcRenderer.invoke('capture-window-id', {
            });

            photosApp.capture.recordWindow(r);
        });
    }
};


function onMouseUp(e) {
    mouse_memory.target.up = e.target;
}

function onMouseDown(e) {
    mouse_memory.target.down = e.target;
}

async function onResume() {
    devConsole("on resume");

    if(photosApp.app) {
        photosApp.local.getPhotos();

        photosApp.rotate.updateTime();
    }
}

function onTimeScrollLogic(time_section) {
    if(photosApp.app.levels["2"].open || photosApp.navigation.in_progress
        || photosApp.app.is_fullscreen) {
        return false;
    }

    let st = photosApp.navigation.scrollTop;

    if(Math.abs(lastScrollTop[time_section] - st) < 20) {
        return false;
    }

    if (st > lastScrollTop[time_section] && photosApp.view.currentTimeHeight() > (photosApp.style.contentHeight - photosApp.style.footerHeight)){
        // downscroll code
        photosApp.navigation.setScrollingDown(true);
        removeClassEl(photosApp.style.classes.show_navigation, photosApp.app.els.app);
    } else {
        // upscroll code
        photosApp.navigation.setScrollingDown(false);
    }

    lastScrollTop[time_section] = st <= 0 ? 0 : st;
}