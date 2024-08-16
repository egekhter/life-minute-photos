window['photosApp'] = {
    init: null,
    initIP: null,
    initLastStep: null,
    dev: {},
    version: null,
    backend: null,
    items: null,
    local: null,
    app: null,
    db: null,
    cache: null,
    capture: null,
    onboarding: null,
    rotate: null,
    grid: null,
    slideshow: null,
    fullscreen: null,
    image: null,
    navigation: null,
    style: null,
    time: null,
    placeholderImg: null,
    is_onboarded: false,
    notifications: {},
    reset: function (hard_reset) {
        photosApp.grid.life = [];

        console.log("Reset grid init");

        if(hard_reset) {
            photosApp.time.intervalLoop = [];
        }
    },
    setInit: function (bool) {
        if(bool) {
            addClassEl('init', 'app');
        } else {
            removeClassEl('init', 'app');
        }

        photosApp.initIP = bool;
    },
};

photosApp.app = {
    ipcRenderer: null,
    is_fullscreen: null,
    items: [],
    init_called: false,
    init_finished: false,
    update_in_progress: false,
    scrollingDown: true,
    confirmOpen: false,
    notificationCount: 0,
    timeouts: {
        level2: [],
        level3: []
    },
    levels: {
        '2': {
            open: null
        },
        '3': {
            open: null
        }
    },
    dateMenu: {
        open: false,
        gridIndex: null
    },
    processes: {
        timeView: [],
    },
    views: {
        level2: {
            active: null
        }
    },
    els: {
        app: null,
        header: null,
        footer: null,
        navigation: null,
        level2: null,
        level3: null,
        time: null,
        confirmAction: null,
        confirmMessage: null,
        fullscreen: null,
        slideshow: null,
        notifications: null,
        sideButtons: null,
        featureTimeInput: null,
        featureTimeRange: null,
        featureParallelInput: null,
        featureParallelRange: null,
        featureChronologySwap: null,
        featureManageFolders: null
    },
    init: function () {
        photosApp.initLastStep = 'app';

        return new Promise(async(resolve, reject) => {
            if(photosApp.app.init_called) {
                if(!photosApp.app.hasItems()) {
                    return resolve();
                }

                devConsole("app init already called, update again");

                try {
                    await photosApp.app.updateHtml(true, true);
                    resolve();
                } catch(e) {

                }

                return;
            }

            devConsole("app init");

            photosApp.app.init_called = true;

            await photosApp.app.setAppVersion();

            photosApp.style.setStyles();

            photosApp.navigation.handler();

            photosApp.app.desktopListener();

            try {
                await photosApp.local.getPhotos();
            } catch(e) {

            }

            try {
                await axios.put(`${photosApp.backend.host}app/init`);
            } catch(e) {
                console.error(e);
            }

            try {
                await photosApp.app.updateHtml(true, true);
            } catch (e) {
                console.error(e);
            }

            requestAnimationFrame(function () {
                if(elHasClass('app', 'onboarding')) {
                    if(photosApp.app.isOnboarded() || !photosApp.app.init_finished) {
                        removeClassEl('onboarding', 'app');
                    }
                }

                photosApp.app.init_finished = true;

                resolve();
            });
        });
    },
    setAppVersion: function () {
        return new Promise(async (resolve, reject) => {
            try {
                let d = await axios.get(`${photosApp.backend.host}version`);
                photosApp.version = d.data.version;
            } catch (e) {
                console.error(e);
            }

            return resolve();
        });
    },
    doRotate: function () {
        return photosApp.settings.data.rotate &&
            !photosApp.app.is_fullscreen &&
            !photosApp.app.levels['2'].open;
    },
    updateHtml: function (update_rotate, force_refresh, on_chronology) {
        return new Promise(async (resolve, reject) => {
            // console.log("update html");

            if(!photosApp.app.init_called) {
                photosApp.app.init();
                return reject();
            } else {
                if(photosApp.app.update_in_progress && !force_refresh) {
                    return resolve(false);
                }

                photosApp.app.update_in_progress = true;

                try {
                    await photosApp.view.setupTimeViews(force_refresh, on_chronology);

                    if (update_rotate) {
                        setTimeout(photosApp.rotate.updateTime, 200);
                    }

                    photosApp.app.update_in_progress = false;
                    return resolve();
                } catch(e) {
                    reject();
                }
            }
        });
    },
    removeLoadingScreen: function () {
        removeClassEl('loading', document.body);
    },
    hideDateMenu: function(event) {
        try {
            let date_menus = photosApp.app.els.time.getElementsByClassName('context__menu');

            for (let i = 0; i < date_menus.length; i++) {
                let menu = date_menus[i];
                removeClassEl('show', menu);

            }
        } catch (e) {
        }

        if(event) {
            event.stopPropagation();
        }

        photosApp.app.dateMenu.open = false;
        photosApp.app.dateMenu.gridIndex = null;
    },
    showDateLevel3: async function(event, action_id) {
        photosApp.app.clearLevel3();

        photosApp.app.clearTimeouts(photosApp.app.timeouts.level2);
        photosApp.app.clearTimeouts(photosApp.app.timeouts.level3);

        event.stopPropagation();

        //set menu to life if no navigation is selected to prevent gap
        let selected_footer_menu = photosApp.app.els.footer.querySelector('.nav-item.active');

        if(!selected_footer_menu) {
            photosApp.app.selectNavigation('life-nav');
        }

        let grid_index = photosApp.app.dateMenu.gridIndex;
        let header = document.getElementById('level-3-header');
        let footer = document.getElementById('level-3-footer');
        let title_el = header.querySelector('#level-3-title');
        title_el.innerHTML = '';

        let confirm_el = footer.querySelector('#level-3-confirm');
        let level_3_content = document.getElementById('level-3-content');
        level_3_content.scrollTo(0, 0);
        photosApp.navigation.level3.current = action_id;

        addClassEl('active', action_id);

        //remove scrolling down class to enforce shown bottom menu
        photosApp.navigation.setScrollingDown(false);

        if(action_id === 'organize-all') {
            confirm_el.innerHTML = 'Update';
        }

        //set level 3 content height
        photosApp.style.setLevel3Height();

        if(action_id === 'organize-all') {
            photosApp.organize.items = {};

            photosApp.organize.setSelectedGridIndex(grid_index);

            try {
                await photosApp.view.updateOrganizeGridItemsView(grid_index);
                photosApp.app.showLevel2('grid');
                photosApp.app.showLevel3(true, true, true);
                addClassEl(photosApp.organize.last_menu, photosApp.app.els.level3);
            } catch(e) {
                console.error(e);
            }
        }
    },
    showLevel2: function(view) {
        photosApp.app.views.level2.active = view;

        let remove_classes = ['folders', 'grid'];

        for(let cl of remove_classes) {
            removeClassEl(photosApp.app.els.level2, cl);
        }

        addClassEl(view, photosApp.app.els.level2);

        photosApp.app.clearTimeouts(photosApp.app.timeouts.level2);
        photosApp.app.levels['2'].open = true;
        addClassEl('visible', photosApp.app.els.level2);
        addClassEl('active', 'film-overlay');
        addClassEl(photosApp.style.classes.level2shown, 'app');
    },
    showLevel3: function (position_top, remove_transition, show_organize_menu) {
        let classes_to_remove = ['date', 'delete'];

        for(let cl of classes_to_remove) {
            removeClassEl(cl, photosApp.app.els.level3);
        }

        if(show_organize_menu) {
            addClassEl('organize-all', photosApp.app.els.level3);
        } else {
            removeClassEl('organize-all', photosApp.app.els.level3);
        }

        photosApp.app.clearTimeouts(photosApp.app.timeouts.level3);

        photosApp.app.levels['3'].open = true;
        addClassEl('show', photosApp.app.els.level3);
        addClassEl(photosApp.style.classes.level3shown, 'app');

        photosApp.app.els.level3.style.transform = 'initial';

        if(position_top) {
            photosApp.app.els.level3.style.top = '0';
        } else {
            photosApp.app.els.level3.style.top = 'initial';
        }

        if(remove_transition) {
            photosApp.app.els.level3.style.transition = 'initial';
        } else {
            photosApp.app.els.level3.style.removeProperty('transition');
        }

        //remove footer messages
        let message_els = document.getElementById('level-3-footer').getElementsByClassName('message');

        for(let i = 0; i < message_els.length; i++) {
            let message_el = message_els[i];
            message_el.innerHTML = '';
            removeClassEl('error', message_el);
        }
    },
    hideLevel3: function (close) {
        photosApp.app.levels['3'].open = false;
        photosApp.style.setLevel3TransformHidden(close);

        let t = setTimeout(function () {
            _.forEach(photosApp.app.els.level3.getElementsByClassName('level-3-content'), function (el) {
                removeClassEl('active', el);
            });

            removeClassEl('show', photosApp.app.els.level3);
            removeClassEl(photosApp.style.classes.level3shown, 'app');


        }, photosApp.style.navigation.level3.transition);

        photosApp.app.timeouts.level3.push(t);
    },
    hideLevel2: function () {
        photosApp.app.views.level2.active = null;
        photosApp.app.levels['2'].open = false;
        removeClassEl('visible', photosApp.app.els.level2);
        removeClassEl('active', 'film-overlay');
        removeClassEl(photosApp.style.classes.level2shown, 'app');

        let t = setTimeout(function () {
            photosApp.app.hideLevel3(true);
        }, photosApp.style.navigation.level2.transition);

        photosApp.app.timeouts.level2.push(t);

        photosApp.app.preventScroll(false);
        photosApp.rotate.updateTime();
        removeClassFromAllEls('active', photosApp.app.els.navigation);
    },
    preventScroll: function (bool) {
        if(bool) {
            addClassEl('no-scroll-body', document.body);
        } else {
            removeClassEl('no-scroll-body', document.body);
        }
    },
    displayGroupsConditionally: function (el, reset_scroll, compareScroll) {
        let selector_class = 'row-group';
        let active_class = 'active';

        if(typeof el === 'string') {
            el = document.getElementById(el);
        }

        let id = el.getAttribute('id');

        let is_level_3 = false;

        if(el.closest('#navigation-level-3')) {
            is_level_3 = true;
        }

        if(!compareScroll) {
            compareScroll = el.scrollTop;
        }

        if(!compareScroll) {
            compareScroll = 0;
        }

        function showHideGroups() {
            let height = photosApp.style.screen.height.current;
            if(is_level_3) {
                height = photosApp.style.view.level2.height;
            }

            let threshold = height * photosApp.image.preloadHeights ;
            if(Number.isNaN(threshold)) {
                console.error("Threshold is not a number");
            }

            let range_min = compareScroll - threshold;
            if(range_min < 0) {
                range_min = 0;
            }

            let range_max = compareScroll + threshold;

            let groups = el.getElementsByClassName(selector_class);

            //find active row-group by comparing scroll to top
            let active_row = null;

            for(let g = 0; g < groups.length; g++) {
                let group = groups[g];

                let top = Number.parseInt(group.getAttribute('top'));

                if(compareScroll >= top) {
                    active_row = group;
                }
            }

            //add/remove classes

            for(let g = 0; g < groups.length; g++) {
                let group = groups[g];

                let top = Number.parseInt(group.getAttribute('top'));

                if(top >= range_min && top <= range_max) {
                    if(!(group.classList.contains(active_class))) {
                        group.classList.add(active_class);
                    }
                } else {
                    if(group.classList.contains(active_class)) {
                        //remove group by index except if current position would be removed
                        if(group !== active_row) {
                            group.classList.remove(active_class);
                        }
                    }
                }
            }

            //show one additional group before and after
            let found_first, last;

            for(let g = 0; g < groups.length; g++) {
                if(g > 0 && !found_first && groups[g].classList.contains(active_class)) {
                    let prev_el = groups[g - 1];
                    if(!(prev_el.classList.contains(active_class))) {
                        prev_el.classList.add(active_class);
                    }
                    found_first = true;
                }

                if(groups[g].classList.contains(active_class)) {
                    last = g;
                }
            }

            if(last + 1 < groups.length) {
                groups[(last+1)].classList.add(active_class);
            }
        }

        if(!(el.getAttribute('listener'))) {
            el.setAttribute('listener', true);

            el.addEventListener('scroll', _.throttle(function (e) {
                compareScroll = this.scrollTop;
                showHideGroups();
            }, 200));
        }

        showHideGroups();
    },
    addTapEventListeners: function (el) {
        if(click_handler !== 'tap') {
            return;
        }

        if(typeof el === 'string') {
            el = document.getElementById(el);
        }

        let tap_els = el.querySelectorAll("[ontap]");

        if(!tap_els.length) {
            return;
        }

        for (let k = 0; k < tap_els.length; k++) {
            let tap_el = tap_els[k];

            if((tap_el.getAttribute('listener'))) {
                continue;
            }

            tap_el.setAttribute('listener', true);

            let fn_str = tap_el.getAttribute('ontap');
            let properties = fn_str.split('.');

            let fn = window;

            for (let i = 0; i < properties.length; i++) {
                let property = properties[i];
                let paran_index = property.indexOf('(');

                if(paran_index > -1) {
                    property = property.substr(0, paran_index);
                }

                fn = fn[property];
            }

            tap_el.addEventListener('tap', function (e) {
                fn(e);
            });

        }
    },
    saveInterval: function() {
        return new Promise(async (resolve, reject) => {
            try {
                await axios.put(`${photosApp.backend.host}save/interval`, {
                    intervalLoop: photosApp.time.intervalLoop
                });
            } catch(e) {

            }

            resolve();
        });

    },
    hideConfirm: function () {
        removeClassEl('show', photosApp.app.els.confirmAction);
        removeClassEl('error', photosApp.app.els.confirmMessage);
        photosApp.app.confirmOpen = false;
        photosApp.app.confirmIP = false;
        photosApp.app.setSpinner(photosApp.app.els.confirmAction, false);
    },
    setSpinner: function (el, bool) {
        if(!el) {
            el = 'spinner-default';
        }

        if(typeof el === 'string') {
            el = document.getElementById(el);
        }

        let spinner = el.querySelector('.spinner');

        if(bool) {
            addClassEl('show', spinner);
        } else {
            removeClassEl('show', spinner);
        }
    },
    setLevel3IP: function(bool) {
        photosApp.navigation.level3.updateIP = bool;
        photosApp.app.setSpinner(photosApp.app.els.level2, bool);
    },
    selectNavigation: function (class_selector) {
        fireClick(photosApp.app.els.navigation.querySelector(`.${class_selector}`));
    },
    openConfirm: function (event, action, message, data_id) {
        if(event) {
            event.preventDefault();
            event.stopPropagation();
        }

        photosApp.app.confirmOpen = true;

        //show confirm screen
        let confirmModal = photosApp.app.els.confirmAction;
        confirmModal.setAttribute('data-action', action);
        confirmModal.setAttribute('data-id', data_id);
        confirmModal.querySelector('.title').innerHTML = message;
        addClassEl('show', confirmModal);
    },
    desktopListener: function () {
        let ipcRenderer = photosApp.app.ipcRenderer;

        ipcRenderer.on('window-activate', function (event, args) {
            onResume();
        });

        ipcRenderer.on('restart-app', function (event, args) {
            window.location.reload();
        });
    },
    notificationHandler() {
        photosApp.app.els.notifications.querySelector('.notification-icon').addEventListener(click_handler, function (e) {
            e.stopPropagation();

            if(photosApp.app.init_finished) {
                photosApp.app.updateNotifications();

                addClassEl('show', photosApp.app.els.notifications);

                photosApp.events.onNotificationsClick();
            }
        });

        photosApp.app.els.notifications.querySelector('.exit').addEventListener(click_handler, function (e) {
            removeClassEl('show', photosApp.app.els.notifications);
            e.stopPropagation();
        });
    },
    deleteNotification: function(key) {
        if(key in photosApp.notifications) {
            let notification = photosApp.notifications[key];

            if(notification) {
                notification.remove_notification = true;
                notification.seen = true;

                if(photosApp.app.notificationCount > 0) {
                    photosApp.app.notificationCount--;
                }
            }
        }
    },
    updateNotifications: function () {
        let notifications = _.orderBy(photosApp.notifications, ['timestamp'], ['desc']);

        let notifications_html = ``;

        let now = timeNow();

        for (let k in notifications) {
            let notification = notifications[k];

            let notification_time = notification.timestamp;
            let time_diff = now - notification_time;
            let when = '';

            if(time_diff < 60) {
                when = 'Now';
            } else if(time_diff >= 60 && time_diff < 3600) {
                when = Math.floor(time_diff / 60);
                when += 'm ago';
            } else if(time_diff >= 3600 && time_diff < 3600 * 24) {
                when = Math.floor(time_diff / 3600);
                when += 'h ago';
            } else {
                when = Math.floor(time_diff / (3600 * 24));
                when += 'd ago';
            }

            notifications_html += `<div class="notification">
                                            <div class="when">${when}</div>
                                            <div class="title">${notification.data.title}</div>
                                            <div class="description">${notification.data.description}</div>
                                          </div>`;

        }

        photosApp.app.els.notifications.querySelector('.notifications').innerHTML = notifications_html;
    },
    clearTimeouts(timeouts) {
        let new_timeouts = timeouts.splice(0, timeouts.length);

        for(let t of new_timeouts) {
            clearTimeout(t);
        }
    },
    setNoItems: function (no_items) {
        if(!photosApp.app.init_finished) {
            return;
        }

        let no_items_class = 'no-items-time';

        if(no_items) {
            addClassEl('show', document.getElementById('no-items-time'));
            addClassEl(no_items_class, 'app');
        } else {
            removeClassEl('show', document.getElementById('no-items-time'));
            removeClassEl(no_items_class, 'app');
        }
    },
    hasItems: function () {
        let has_items = false;

        for(let item_id in photosApp.items.local.items) {
            if(item_id in photosApp.items.local.variants && Object.keys(photosApp.items.local.variants[item_id]).length) {
                has_items = true;
                break;
            }
        }

        return has_items;
    },
    updateFullscreenBackground: async function () {
        let background_int;

        function finish() {
            clearInterval(background_int);
            removeArrItem(photosApp.fullscreen.background_change_ints, background_int);
        }

        async function updateWork() {
            let item_id = photosApp.fullscreen.item_ids.current;

            //remove interval if not fullscreen or not current item id
            if(!photosApp.app.is_fullscreen || !item_id) {
                return finish();
            }

            if(!photosApp.fullscreen.slide.change_queue.length) {
                devConsole("updating fullscreen");

                if(!photosApp.app.init_called) {
                    await photosApp.fullscreen.setItems();
                }
                3
                try {
                    await photosApp.fullscreen.slidesInit(item_id, true);
                } catch (e) {
                    console.error(e);
                }

                return finish();
            } else {
                devConsole("not updating, slide change in progress");
            }
        }

        //remove any previously created intervals
        photosApp.fullscreen.clearBackgroundInts();

        background_int = setInterval(function () {
            updateWork();
        }, 50);

        photosApp.fullscreen.background_change_ints.push(background_int);

        updateWork();
    },
    updateNotificationsCount: function (count) {
        let el = photosApp.app.els.notifications.querySelector('.notifications-count');

        let notifications_visible = elHasClass(photosApp.app.els.notifications, 'show');

        if(!notifications_visible && count && count > 0) {
            addClassEl('show', el)
            el.innerHTML = count;
            photosApp.app.notificationCount = count;
        } else {
            removeClassEl('show', el);
            el.innerHTML = 0;
            photosApp.app.notificationCount = 0;
        }
    },
    clearLevel3() {
        let all_actions = ['organize-all'];

        for(let a of all_actions) {
            removeClassEl(a, photosApp.app.els.level3);
        }
    },
    setOnboarded: function () {
        return new Promise(async(resolve, reject) => {
            devConsole("set onboarded");

            try {
                await axios.post(`${photosApp.backend.host}onboarded`);
            } catch (e) {
                console.error(e);
            }

            photosApp.onboarding.isFinished();

            photosApp.app.els.navigation.style.removeProperty('transform');

            resolve();
        });
    },
    getOnboarded: function () {
        return new Promise(async (resolve, reject) => {
            try {
                let r = await axios.get(`${photosApp.backend.host}onboarded`);

                photosApp.is_onboarded = r.data;
            } catch (e) {
                console.error(e);
            }

            resolve();
        });
    },
    isOnboarded: function () {
        return photosApp.is_onboarded;
    }
};