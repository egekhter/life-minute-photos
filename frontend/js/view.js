photosApp.view = {
    setupTimeViews(force_refresh, on_chronology) {
        return new Promise(async (resolve, reject) => {
            async function afterCreate(response, parse) {

                if(photosApp.app.processes.timeView.indexOf(startTime) === -1) {
                    return reject();
                }

                if(photosApp.app.processes.timeView.length > 1) {
                    let lastProcessTime = photosApp.app.processes.timeView[photosApp.app.processes.timeView.length - 1];

                    if(startTime !== lastProcessTime) {
                        let processIndex = photosApp.app.processes.timeView.indexOf(startTime);
                        photosApp.app.processes.timeView.splice(processIndex, 1);
                        return reject();
                    }
                }

                if(response) {
                    let life_el = document.getElementById('life');

                    life_el.innerHTML = response;

                    photosApp.style.setStyles();

                    await photosApp.style.updateCalculations(true);

                    requestAnimationFrame(async function () {
                        //an extra frame to load initially
                        if(!photosApp.app.hasItems()) {
                            await rafAwait();
                        }

                        photosApp.image.timeObserve('life');

                        photosApp.app.addTapEventListeners('time');

                        for(let k in photosApp.app.processes.timeView) {
                            let process_time = photosApp.app.processes.timeView[k];

                            if(process_time <= startTime) {
                                photosApp.app.processes.timeView.splice(k, 1);
                            }
                        }

                        resolve();
                    });
                } else {
                    resolve();
                }

                requestAnimationFrame(function () {
                    if(photosApp.app.init_finished) {
                        photosApp.app.removeLoadingScreen();
                    } else {
                        setTimeout(function () {
                            photosApp.app.removeLoadingScreen();
                            photosApp.app.init_finished = true;
                            photosApp.setInit(false);

                            resolve();
                        }, 100);
                    }

                    photosApp.app.updateFullscreenBackground();
                });
            }

            let startTime = timeNow(true);

            photosApp.app.processes.timeView.push(startTime);

            devConsole("update time views");

            photosApp.app.setNoItems(false);

            let view_data = await photosApp.view.getBackendView('life', {
                intervalLoop: photosApp.time.intervalLoop,
                on_chronology: on_chronology
            });

            try {
                await afterCreate(view_data.life);
                photosApp.time.intervalLoop = view_data.intervalLoop;
            } catch(e) {
            }

            photosApp.style.updateCalculations(false);
        });
    },
    addOrganizeGridItemsHTML: function () {
        let level3id = 'organize-all';

        let level3el = document.getElementById(level3id);

        //start with all selected
        let selected_all = level3el
            .querySelectorAll('.grid_item_container.selected');

        //previously set
        if(photosApp.organize.selected.items !== null) {
            //remove overlay if not key in items
            for (let k = 0; k <selected_all.length; k++) {
                let item = selected_all[k];
                if(!(item.getAttribute('data-item-id') in photosApp.organize.selected.items)) {
                    removeClassEl('selected', item);
                }
            }
        } else {
            //do nothing
        }

        let selector_class = 'select';
        let l3title = document.getElementById('level-3-title');
        let selected_text = `${Object.keys(photosApp.organize.selected.items).length} <br>Selected`;
        if (!l3title.querySelector(`.${selector_class}`)) {
            l3title.innerHTML += `<div class="${selector_class}">
                                             <div class="total-selected">${selected_text}</div>
                                              <div class="section-title">Batch Organize</div>
                                            <div class="btn-sm-default select-all">Select All</div>
                                           </div>`;

            l3title.querySelector('.select-all').addEventListener(click_handler, function () {
                let els = document.getElementById('organize-all').getElementsByClassName('grid_item_container');

                let select_all = false;

                if(Object.keys(photosApp.organize.selected.items).length < (els.length / 2)) {
                    select_all = true;
                }

                let select_text = 'Select All';

                if(select_all) {
                    select_text = 'Unselect All';
                }

                this.innerHTML = select_text;

                if(select_all) {
                    let date, date_str;

                    let organize_menu = document.getElementById('organize-menu');

                    let update_date = false;
                    if(organize_menu.querySelector('.date.selected') && photosApp.organize.calendar_instance && photosApp.organize.calendar_instance.latestSelectedDateObj) {
                        update_date = true;
                        date = moment(photosApp.organize.calendar_instance.latestSelectedDateObj);
                        date_str = `${date.year()}-${formatNumberLength(date.month() + 1, 2)}-${formatNumberLength(date.date(), 2)}`;
                    }

                    for (let i = 0; i < els.length; i++) {
                        let el = els[i];
                        addClassEl('selected', el);
                        let item_id = el.getAttribute('data-item-id');
                        photosApp.organize.selected.items[item_id] = true;

                        if(update_date) {
                            photosApp.organize.items[item_id] = {
                                year: date.year(),
                                month: formatNumberLength(date.month() + 1, 2),
                                date: formatNumberLength(date.date(), 2)
                            };

                            el.parentNode.querySelector('.date.new').innerHTML = date_str;
                        }
                    }
                } else {
                    for (let i = 0; i < els.length; i++) {
                        let el = els[i];
                        removeClassEl('selected', el);
                        el.parentNode.querySelector('.date.new').innerHTML = '';
                    }

                    photosApp.organize.items = {};
                    photosApp.organize.selected.items = {};
                }

                photosApp.time.updateOrganizeGridItemsCount();
            });
        }
    },
    updateDirCount: function () {
        let count = photosApp.local.getSelectedDirCount();

        document.getElementById('manage-folders-count').innerHTML = `(${count})`;
    },
    updateManageDirectories: function () {
        let html = ``;

        let level2Height = photosApp.style.view.level2.height;

        let level2HeaderHeight = document.getElementById('manage-folders')
            .querySelector('.header-folders').getBoundingClientRect().height;

        let availableHeight = level2Height - level2HeaderHeight;

        let dirs = photosApp.local.listFolders();

        let createRows = Object.keys(dirs).length;

        for(let i = 0; i < createRows; i++) {
            let row_class = 'odd';

            if(i % 2 !== 0) {
                row_class = 'even';
            }

            let dir_html = ``, dir_key;

            //lookup folder by index
            dir_key = Object.keys(dirs)[i];

            if(dir_key) {
                dir_html = `<div class="dir-name">
                    ${dirs[dir_key]}
                </div>

                <div class="delete-dir" data-dir-key="${dir_key}">
                    <i class="">${iconTrash()}</i>
                </div>`;
            }

            html += `<div class="dir-row ${row_class}">
                                ${dir_html}
                            </div>`;

        }

        document.getElementById('manage-folders')
            .querySelector('.folder-list').style.height = `${availableHeight}px`;

        document.getElementById('manage-folders')
            .querySelector('.folder-list')
            .querySelector('.container').innerHTML = html;

        photosApp.events.deleteFoldersDir();
    },
    showDateMenu: async function (context) {
        context.preventDefault();
        context.stopPropagation();

        //close notifications if open
        photosApp.events.closeConditionally(context);

        let target = context.target;

        let adjustment = {
            x: 0,
            y: 0
        };

        let time_el = photosApp.app.els.time.querySelector('.time-period.display');
        let parent = target.closest('.date__column');
        let date_id = parent.getAttribute('id');
        let gridIndex = parent.getAttribute('grid-index');
        photosApp.app.dateMenu.gridIndex = gridIndex;

        let current_row = target.closest('.date__row');
        let current_row_top = Number.parseInt(current_row.style.top.replace('px', ''));

        let current_row_group = target.closest('.row-group');
        let current_row_group_top = Number.parseInt(current_row_group.style.top.replace('px', ''));

        if(!isNumeric(current_row_group_top)) {
            current_row_group_top = 0;
        }

        let all_rows = current_row_group.getElementsByClassName('date__row');
        let last_row = all_rows[all_rows.length - 1];
        let last_row_top = Number.parseInt(last_row.style.top.replace('px', ''));

        let menus = time_el.getElementsByClassName('context__menu');
        let menu_count = menus.length;

        for(let m = menu_count - 1; m >= 0; m--) {
            let menu = menus[m];
            menu.remove();
        }

        let date_items_count = await photosApp.time.getCount(gridIndex);

        let menu_str = `        <div class="items">
                                   ${numberWithCommas(date_items_count)} Item${date_items_count > 1 ? 's' : ''}
                                   <i class="close" on${click_handler}="photosApp.app.hideDateMenu(event)">
                                        ${iconX()}
                                    </i>
                                </div>
                                    
                                    <div class="organize"
                                        onclick="photosApp.app.showDateLevel3(event, 'organize-all')"
                                    >
                                        <i class="organize-icon">${iconOrganize()}</i>
                                        <span>Organize</span>
                                    </div>
                    `;

        let menu = createEl('div', null, ['context__menu', 'date__menu']);
        menu.setAttribute('date-id', date_id);

        menu.innerHTML = menu_str;

        let menu_left = (target.getBoundingClientRect().x - photosApp.style.grid.menu.width + photosApp.style.grid.circle.width + adjustment.x);

        if(menu_left > (photosApp.style.screen.width.current - photosApp.style.grid.menu.width)) {
            menu_left = photosApp.style.screen.width.current - photosApp.style.grid.menu.width;
        } else if(menu_left < 0) {
            menu_left = 0;
        }

        let menu_top = current_row_top + current_row_group_top + adjustment.y;

        let col_height = photosApp.style.screen.height.current / current_row.getElementsByClassName('date__column').length;
        let menu_top_max = last_row_top + current_row_group_top + col_height - photosApp.style.grid.menu.height;

        if(menu_top > menu_top_max ) {
            menu_top = menu_top_max;
        }

        menu.style.top = menu_top + 'px';

        menu.style.left = menu_left + 'px';

        time_el.appendChild(menu);

        addClassEl('show', menu);

        photosApp.app.dateMenu.open = true;

        photosApp.app.addTapEventListeners(menu);
    },
    updateOrganizeGridItemsView: function (gridIndex) {
        return new Promise(async(resolve, reject) => {
            function afterCreate(response, parse) {
                if(response) {
                    if(parse) {
                        response = JSON.parse(response);
                    }

                    level3el.innerHTML = response;
                    photosApp.events.addOrganizeMenuHandler();
                    photosApp.app.displayGroupsConditionally('level-3-content', true);
                    photosApp.view.addOrganizeGridItemsHTML();
                    photosApp.app.addTapEventListeners('level-3-content');
                    photosApp.image.level3Observe(level3id);
                }

                resolve();
            }

            function selectFirstVisibleDate(d) {
                d.setDate(`${d.currentYear}-${d.currentMonth+1}-01`, true);
            }

            let level3id = 'organize-all';
            let level3el = document.getElementById(level3id);
            let level3footer = document.getElementById('level-3-footer');
            level3el.innerHTML = '';
            level3el.setAttribute('data-grid-index', gridIndex);

            //confirm button
            document.getElementById('level-3-confirm').innerHTML = photosApp.organize.tab_classes[photosApp.organize.last_menu].button_text;

            function showHidePlaceholder() {
                let placeholder_class = 'placeholder';
                let el = document.getElementById('organize-date-input');
                let parent = el.parentElement;

                if(el.value) {
                    removeClassEl(placeholder_class, parent);
                } else {
                    addClassEl(placeholder_class, parent);
                }
            }

            //date event handlers
            let organize_date_el = level3footer.querySelector('#organize-date');
            organize_date_el.value = '';
            let fpinput = level3footer.querySelector('.flatpickr-input');

            if(fpinput) {
                fpinput.value = '';
            }

            showHidePlaceholder();

            let fp = photosApp.organize.calendar_instance = flatpickr("#organize-date-input", {
                // allowInput: true
            });

            if(photosApp.organize.last_date.year) {
                let last_year = photosApp.organize.last_date.year;
                let last_month = photosApp.organize.last_date.month;
                let last_day = photosApp.organize.last_date.day;
                fp.setDate(`${last_year}-${last_month}-${last_day}`);
            }

            fp.config.onOpen.push(function () {
                photosApp.organize.isCalendarOpen = true;

                let date = new Date();

                if(photosApp.organize.last_date.year) {
                    let last_year = photosApp.organize.last_date.year;
                    let last_month = photosApp.organize.last_date.month;
                    let last_day = photosApp.organize.last_date.day;

                    date = `${last_year}-${last_month}-${last_day}`;
                }

                fp.setDate(date);
            });

            fp.config.onClose.push(function () {
                photosApp.organize.isCalendarOpen = false;
                showHidePlaceholder();
            });

            fp.config.onMonthChange.push(function (s,t,u) {
                selectFirstVisibleDate(u);
            });

            fp.config.onYearChange.push(function (s,t, u) {
                selectFirstVisibleDate(u);
            });

            fp.config.onChange.push(function (s, t) {
                let year = t.substring(0, 4);
                let month = t.substring(5, 7);
                let day = t.substring(8);

                photosApp.organize.last_date.year = year;
                photosApp.organize.last_date.month = month;
                photosApp.organize.last_date.day = day;

                for(let item_id in photosApp.organize.selected.items) {
                    if(!(item_id in photosApp.organize.items)) {
                        photosApp.organize.items[item_id] = {};
                    }

                    photosApp.organize.items[item_id].year = year;
                    photosApp.organize.items[item_id].month = month;
                    photosApp.organize.items[item_id].date = day;
                }

                //update html

                for(let item_id in photosApp.organize.items) {
                    let dn = document.getElementById('gridorganizeitem' + item_id).querySelector('.date.new');
                    dn.innerHTML = t;
                }

                showHidePlaceholder();
            });

            let r = await photosApp.view.getBackendView('organize-grid', {
                metadata: photosApp.style.metadata,
                selected: photosApp.organize.selected.items,
                gridIndex: gridIndex || photosApp.app.dateMenu.gridIndex
            });

            if(!r || !r.html) {
                return afterCreate();
            }

            if(photosApp.organize.selected.items === null) {
                photosApp.organize.selected.items = {};
            }

            afterCreate(r.html);
        });
    },
    fullscreenActions: function (item_id) {
        item_id = Number.parseInt(item_id);

        let item_actions_el = photosApp.app.els.fullscreen.querySelector('.item-actions');

        let prev_item_id = item_actions_el.getAttribute('data-item-id');

        if(Number.parseInt(prev_item_id) === item_id) {
            return false;
        }

        item_actions_el.setAttribute('data-item-id', item_id);

        let previousInputObj = {};

        let item = photosApp.items.local.items[item_id];

        let date_el = item_actions_el.querySelector('.action.date');
        let file_el = item_actions_el.querySelector('.action.file');
        let slideshow_el = item_actions_el.querySelector('.action.slideshow');
        let locate_el = item_actions_el.querySelector('.action.locate');

        let delete_el = item_actions_el.querySelector('.action.delete');

        function onDateInputChange(e, input, pm_value, on_pm_change) {
            devConsole("on date input change");

            if(input) {
                e = {
                    target: input
                };
            } else if(e) {
                e.preventDefault();
                e.stopPropagation();
            }

            if(!('inputType' in e)) {
                e.inputType = "";
            }

            let target = e.currentTarget ? e.currentTarget : e.target;

            let elGroup = target.closest('.date-group');

            let value = Number.parseInt(target.value);

            item_id = photosApp.fullscreen.item_ids.current;

            if(!(item_id in previousInputObj)) {
                previousInputObj[item_id] = {
                    year: null,
                    month: null,
                    day: null,
                    hour: null,
                    minute: null,
                    second: null
                };
            }

            let previousInput = previousInputObj[item_id];

            for (let k in previousInput) {
                let v = previousInput[k];

                if(v !== null && v !== "") {
                    previousInput[k] = Number.parseInt(v);
                }
            }

            if(elGroup.classList.contains('date-year')) {
                if(e.inputType.indexOf('delete') > -1) {
                    previousInput.year = target.value;
                    return false;
                }

                if(!photosApp.time.isValidYear(value)) {
                    target.value = photosApp.items.getYear(item_id);
                }

                previousInput.year = target.value;
            } else if(elGroup.classList.contains('date-month')) {
                if(e.inputType.indexOf('delete') > -1) {
                    previousInput.month = target.value;
                    return false;
                }

                if(previousInput.month === "" && [0,1].indexOf(value) > -1) {
                    previousInput.month = target.value;
                    return false;
                }

                if(photosApp.time.isValidMonth(value)) {
                    value = formatNumberLength(value, 2);
                } else if(value < 0) {
                    value = 12;
                } else if(value === 0) {
                    //do nothing
                } else if(value >= 13) {
                    value = 1;
                } else {
                    value = photosApp.items.getMonth(item_id);
                }

                if(value === 0) {
                    target.value = 0;
                } else {
                    target.value = formatNumberLength(value, 2);
                }

                previousInput.month = value;
            } else if(elGroup.classList.contains('date-day')) {
                if(e.inputType.indexOf('delete') > -1) {
                    previousInput.day = target.value;
                    return false;
                }

                let year = elGroup.closest('.dates').querySelector('.date-year').querySelector('input').value;
                let month = elGroup.closest('.dates').querySelector('.date-month').querySelector('input').value;
                month = formatNumberLength(month, 2);
                let days_in_month = moment(`${year}-${month}`, "YYYY-MM").daysInMonth();

                let months_arr = [0,1,2];
                if(days_in_month >= 30) {
                    months_arr.push(3);
                }

                if(previousInput.day === "" && months_arr.indexOf(value) > -1) {
                    previousInput.day = target.value;
                    return false;
                }

                if(Number.isNaN(value)) {
                    value = photosApp.items.getDay(item_id);
                } else if(value < 0) {
                    value = days_in_month;
                } else if(value === 0) {
                    //do nothing
                } else if(value > days_in_month) {
                    value = 1;
                }

                if(value === 0) {
                    target.value = 0;
                } else {
                    target.value = formatNumberLength(value, 2);
                }

                previousInput.day = value;
            } else if(elGroup.classList.contains('date-hour')) {
                if(e.inputType.indexOf('delete') > -1) {
                    previousInput.hour = target.value;
                    return false;
                }

                if(previousInput.hour === "" && [0,1].indexOf(value) > -1) {
                    previousInput.hour = target.value;
                    return false;
                }

                let was_pm = elGroup.querySelector('.pm').innerHTML.toLowerCase().indexOf('pm') > -1;

                let switch_pm_to_am = false;

                if((pm_value && pm_value === 12) || (value === 0 && previousInput.hour === 13)) {
                    value = 12;
                } else if(value === 0 && previousInput.hour === 1 && was_pm) {
                    value = 12;
                } else if(value === 12 && previousInput.hour === 23 && was_pm) {
                    value = 12;
                    switch_pm_to_am = true;
                } else if(value >= 13 && previousInput.hour === 12 && !was_pm) {
                    value = 1;
                } else if(value === 0 && !was_pm && previousInput.hour === 1) {
                    value = 12;
                    switch_pm_to_am = true;
                } else if(value === 0 || value === 1 || (value === 12 && was_pm)) {
                    //do nothing
                } else if(was_pm && value === 13) {
                    //do nothing
                } else if(value === 12 && previousInput.hour === 23) {
                    if(was_pm) {
                        value += 12;
                    }
                } else if(was_pm && previousInput.hour !== 12) {
                    value += 12;
                } else if(was_pm && previousInput.hour === 12 && value !== 13 && value !== 11) {
                    value += 12;
                } else if(!was_pm && previousInput.hour === 12) {
                    value += 12;
                } else if(!was_pm && previousInput.hour === 0 && value === 13) {
                    value -= 12;
                } else if(!was_pm && previousInput.hour === 0 && value === 11) {
                    value += 12;
                }

                if(Number.isNaN(value)) {
                    value = photosApp.items.getHour(item_id);
                } else {
                    if(value === 0) {
                        //do nothing
                    } else if(value > 23) {
                        value = 0;
                    } else if(value < 0) {
                        value = 23;
                    }
                }

                let pm = 'AM';

                if(!switch_pm_to_am) {
                    if(value >= 12 || was_pm && value === 1) {
                        pm = 'PM';
                    }
                }

                let prev_hour = value;

                if(value === 1 && was_pm) {
                    prev_hour = 13;
                }

                previousInput.hour = prev_hour;

                if(value > 12) {
                    value = value - 12;
                }

                // if(value === 0 && pm === 'AM') {
                //     value = 12;
                // }
                if(value === 0) {
                    target.value = 0;
                } else if (value === 1) {
                    target.value = '01';
                } else {
                    target.value = formatNumberLength(value, 2);
                    elGroup.querySelector('.pm').innerHTML = pm;
                }

            } else if(elGroup.classList.contains('date-minute')) {
                if(e.inputType.indexOf('delete') > -1) {
                    previousInput.minute = target.value;
                    return false;
                }

                if(previousInput.minute === "" && [0,1,2,3,4,5].indexOf(value) > -1) {
                    previousInput.minute = target.value;
                    return false;
                }

                if(Number.isNaN(value)) {
                    value = photosApp.items.getMinute(item_id);
                } else if(value < 0) {
                    value = 59;
                } else if(value > 59) {
                    value = 0;
                }

                target.value = formatNumberLength(value, 2);
                previousInput.minute = value;
            } else if(elGroup.classList.contains('date-second')) {
                if(e.inputType.indexOf('delete') > -1) {
                    previousInput.second = target.value;
                    return false;
                }

                if(previousInput.second === "" && [0,1,2,3,4,5].indexOf(value) > -1) {
                    previousInput.second = target.value;
                    return false;
                }

                if(Number.isNaN(value)) {
                    value = photosApp.items.getSecond(item_id);
                } else if(value < 0) {
                    value = 59;
                } else if(value > 59) {
                    value = 0;
                }

                target.value = formatNumberLength(value, 2);
                previousInput.second = value;
            }
        }

        async function onDateInputBlur(e, input, on_pm_change, on_arrow) {
            devConsole("Date input blur");

            item_id = photosApp.fullscreen.item_ids.current;

            if(!(item_id in previousInputObj)) {
                previousInputObj[item_id] = {
                    year: null,
                    month: null,
                    day: null,
                    hour: null,
                    minute: null,
                    second: null
                };
            }

            let previousInput = previousInputObj[item_id];

            let year, month, day, hour, minute, second;

            if(!input) {
                e.preventDefault();
                e.stopPropagation();
                input = e.currentTarget ? e.currentTarget : e.target;
            }

            let elGroup = input.closest('.date-group');

            let value = Number.parseInt(input.value);

            let isValid = true;

            let days_in_month;

            if(elGroup.classList.contains('date-year')) {
                if(!photosApp.time.isValidYear(value)) {
                    input.value = photosApp.items.getYear(item_id);
                    isValid = false;
                }
            } else if(elGroup.classList.contains('date-month')) {
                if(value <= 0) {
                    value = 12;
                } else if(value >= 13) {
                    value = 1;
                }

                elGroup.closest('.date').querySelector('.date-month').querySelector('input').value = formatNumberLength(value, 2);

                if(!photosApp.time.isValidMonth(value)) {
                    input.value = photosApp.items.getMonth(item_id);
                    isValid = false;
                }

                //look at day and change accordingly
                year = elGroup.closest('.dates').querySelector('.date-year').querySelector('input').value;
                month = formatNumberLength(value, 2);
                let dayInput = elGroup.closest('.dates').querySelector('.date-day').querySelector('input');
                day = dayInput.value;
                day = Number.parseInt(day);

                days_in_month = moment(`${year}-${month}`, "YYYY-MM").daysInMonth();
                if(day > days_in_month) {
                    day = days_in_month;
                    dayInput.value = day;
                    dayInput.setAttribute('value', day);
                }
            } else if(elGroup.classList.contains('date-day')) {
                year = elGroup.closest('.date').querySelector('.date-year').querySelector('input').value;
                month = elGroup.closest('.date').querySelector('.date-month').querySelector('input').value;
                month = formatNumberLength(month, 2);

                days_in_month = moment(`${year}-${month}`, "YYYY-MM").daysInMonth();

                if(value <= 0) {
                    value = days_in_month;
                } else if(value > days_in_month) {
                    value = 1
                }

                elGroup.closest('.date').querySelector('.date-day').querySelector('input').value = formatNumberLength(value, 2);

                if(!photosApp.time.isValidDay(year, month, value)) {
                    input.value = photosApp.items.getDay(item_id);
                    isValid = false;
                }
            } else if(elGroup.classList.contains('date-hour') && !on_pm_change) {
                let was_pm = elGroup.querySelector('.pm').innerHTML.toLowerCase().indexOf('pm') > -1;

                let switch_pm_to_am = false;

                if(value === 0 && previousInput && previousInput.hour === 13) {
                    value = 12;
                } else if(value === 0 && on_arrow) {
                    switch_pm_to_am = true;
                    value = 12;
                } else if(value === 13 && on_arrow && !was_pm) {
                    value = 1;
                } else if(value === 1) {
                    //do nothing
                } else if(value === 12 && was_pm && previousInput && previousInput.hour === 23) {
                    switch_pm_to_am = true;
                } else if(value === 12 && !was_pm && previousInput && previousInput.hour === 11) {

                } else if(value === 0 && !was_pm) {
                    //do nothing
                } else if(was_pm && value === 13) {
                    //do nothing
                } else if(value === 12 && previousInput && previousInput.hour === 23) {
                    if(was_pm) {
                        value += 12;
                    }
                } else if(was_pm && previousInput && previousInput.hour !== 12) {
                    value += 12;
                } else if(was_pm && previousInput && previousInput.hour === 12 && value !== 13 && value !== 11) {
                    value += 12;
                } else if(!was_pm && previousInput && previousInput.hour === 12) {
                    value += 12;
                } else if(!was_pm && previousInput && previousInput.hour === 0 && value === 13) {
                    value -= 12;
                } else if(!was_pm && previousInput && previousInput.hour === 0 && value === 11) {
                    value += 12;
                }

                if(Number.isNaN(value)) {
                    value = photosApp.items.getHour(item_id);
                } else {
                    if(value === 0) {
                        //do nothing
                    } else if(value > 23) {
                        value = 0;
                    } else if(value < 0) {
                        value = 23;
                    }
                }

                let pm = 'AM';

                if(!switch_pm_to_am) {
                    if(value >= 12 || was_pm && value === 1) {
                        pm = 'PM';
                    }
                }

                let prev_hour = value;

                if(value === 1 && was_pm) {
                    prev_hour = 13;
                }

                previousInput.hour = prev_hour;

                if(value > 12) {
                    value = value - 12;
                }

                // if(value === 0 && pm === 'AM') {
                //     value = 12;
                // }
                if(value === 0) {
                    input.value = 0;
                } else if (value === 1) {
                    input.value = '01';
                } else {
                    input.value = formatNumberLength(value, 2);
                    elGroup.querySelector('.pm').innerHTML = pm;
                }

                if(!photosApp.time.isValidHour(value)) {
                    input.value = photosApp.items.getHour(item_id);
                    isValid = false;
                }
            } else if(elGroup.classList.contains('date-minute')) {
                if(!photosApp.time.isValidMinute(value)) {
                    input.value = photosApp.items.getMinute(item_id);
                    isValid = false;
                }
            } else if(elGroup.classList.contains('date-second')) {
                if(!photosApp.time.isValidSecond(value)) {
                    input.value = photosApp.items.getSecond(item_id);
                    isValid = false;
                }
            }

            if(isValid) {
                year = elGroup.closest('.date').querySelector('.date-year').querySelector('input').value;
                month = elGroup.closest('.date').querySelector('.date-month').querySelector('input').value;
                day = elGroup.closest('.date').querySelector('.date-day').querySelector('input').value;
                hour = elGroup.closest('.date').querySelector('.date-hour').querySelector('input').value;

                if(elGroup.closest('.date').querySelector('.pm').innerHTML.toLowerCase().indexOf('pm') > -1) {
                    if(Number.parseInt(hour) !== 12) {
                        hour = Number.parseInt(hour) + 12;
                    }
                } else if (Number.parseInt(hour) === 12) {
                    hour = 0;
                }

                if(hour > 23) {
                    hour = '23';
                    minute = '59';
                    hour = '59';
                }

                minute = elGroup.closest('.date').querySelector('.date-minute').querySelector('input').value;
                second = elGroup.closest('.date').querySelector('.date-second').querySelector('input').value;

                //update local obj
                let field_name = 'master_item_date';

                try {
                    await photosApp.items.updateDateTime(item_id, {
                        year: year,
                        month: month,
                        day: day,
                        hour: hour,
                        minute: minute,
                        second: second
                    });
                } catch (e) {
                    console.error(e);
                    return;
                }

                //update fullscreen date
                let date_str = photosApp.items.local.items[item_id].master_item_date.substring(0, 10);

                date_el.querySelector('.action-name').innerHTML = date_str;

                //update local data
                let item = photosApp.items.local.items[item_id];

                try {
                    await photosApp.items.updateItem(item, field_name);
                } catch (e) {
                    console.error(e);
                }

                //update grid view
                try {
                    await photosApp.view.setupTimeViews(true);
                } catch(e) {
                }
            }
        }

        function updateDate() {
            let date_time = getMasterDate(item);

            let dateObj = moment(date_time);
            let date_str = date_time.substring(0, 10);

            //update date in top bar
            date_el.querySelector('.action-name').innerHTML = date_str;

            let hour = dateObj.hour();

            let pm = 'AM';

            if(hour >= 12) {
                pm = 'PM';
            }

            if(hour > 12) {
                hour = hour - 12;
            }

            if(hour === 0 && pm === 'AM') {
                hour = 12;
            }

            let hour_str = formatNumberLength(hour, 2);

            //els
            let year_el = date_el.querySelector('.date-year').querySelector('input');
            let month_el = date_el.querySelector('.date-month').querySelector('input');
            let day_el = date_el.querySelector('.date-day').querySelector('input');
            let hour_el = date_el.querySelector('.date-hour').querySelector('input');
            let pm_el = date_el.querySelector('.pm');
            let minute_el = date_el.querySelector('.date-minute').querySelector('input');
            let second_el = date_el.querySelector('.date-second').querySelector('input');

            year_el.value = dateObj.year();
            month_el.value = formatNumberLength(dateObj.month() + 1, 2);
            day_el.value = formatNumberLength(dateObj.date(), 2);
            hour_el.value = hour_str;
            pm_el.innerHTML = pm;
            minute_el.value = formatNumberLength(dateObj.minute(), 2);
            second_el.value = formatNumberLength(dateObj.second(), 2);

            //events
            let date_inputs = date_el.getElementsByTagName('input');

            for(let i2 = 0; i2 < date_inputs.length; i2++) {
                let input = date_inputs[i2];

                if(!(input.getAttribute('listener'))) {
                    input.setAttribute('listener', true);

                    input.addEventListener(click_handler, function (e) {
                        e.stopPropagation();
                    });

                    input.addEventListener('input', function (e) {
                        onDateInputChange(e);
                    });

                    input.addEventListener('focusout', function (e) {
                        try {
                            onDateInputBlur(e);
                        } catch(e) {
                        }
                    });
                }
            }

            let date_rows = date_el.getElementsByClassName('date-row');

            for(let i = 0; i < date_rows.length; i++) {
                let date_row = date_rows[i];
                if(!(date_row.getAttribute('listener'))) {
                    date_row.setAttribute('listener', true);
                    date_row.addEventListener(click_handler, function (e) {
                        e.stopPropagation();
                    });
                }
            }

            let arrows = date_el.getElementsByClassName('arrow');

            for(let i = 0; i < arrows.length; i++) {
                let arrow = arrows[i];

                if(!(arrow.getAttribute('listener'))) {
                    arrow.setAttribute('listener', true);

                    arrow.addEventListener(click_handler, function (e) {
                        e.stopPropagation();

                        let target = e.currentTarget ? e.currentTarget : e.target;

                        let input = target.closest('.date-group').querySelector('input');

                        let value = Number.parseInt(input.value);

                        if(target.classList.contains('arrow-up')) {
                            value++;

                        } else if(target.classList.contains('arrow-down')) {
                            value--;
                        }

                        input.value = value;
                        input.setAttribute('value', value);

                        // onDateInputChange(null, input);
                        onDateInputBlur(null, input, null, true);
                    });
                }
            }

            let pms = date_el.getElementsByClassName('pm');

            for(let i = 0; i < pms.length; i++) {
                let pm = pms[i];

                if(!(pm.getAttribute('listener'))) {
                    pm.setAttribute('listener', true);

                    pm.addEventListener(click_handler, function (e) {
                        e.stopPropagation();

                        let target = e.currentTarget ? e.currentTarget : e.target;

                        let input = target.closest('.date-group').querySelector('input');
                        let value = Number.parseInt(input.value);

                        let was_pm = target.innerHTML.toLowerCase().indexOf('pm') > -1;

                        if(was_pm) {
                            target.innerHTML = 'AM';

                            // if(value > 12) {
                            //     value -= 12;
                            // }
                            //
                            // if (value < 0) {
                            //     value = 12;
                            // }
                        } else {
                            target.innerHTML = 'PM';
                            // if(value < 12) {
                            //     value += 12;
                            // }
                        }

                        // input.value = value;

                        // onDateInputChange(null, input, value, was_pm);

                        onDateInputBlur(null, input, true);

                    });
                }
            }
        }

        function updateFileInfo() {
            let name_el = file_el.querySelector('.info.name');
            let res_el = file_el.querySelector('.info.resolution');
            let size_el = file_el.querySelector('.info.size');

            name_el.querySelector('.value').innerHTML = item.filename;
            res_el.querySelector('.value').innerHTML = `${item.width} x ${item.height}`;
            size_el.querySelector('.value').innerHTML = `${getSizeMB(item.size, 1)} MB`;
        }

        function updateSlideshow() {
            if(!slideshow_el._event_listener) {
                slideshow_el._event_listener = true;

                slideshow_el.addEventListener(click_handler, function (e) {
                    e.stopPropagation();
                    photosApp.slideshow.startSlideShow(photosApp.fullscreen.item_ids.current, photosApp.fullscreen.item_ids.list);
                });
            }
        }

        async function updateLocate() {
            if(!locate_el._event_listener) {
                locate_el._event_listener = true;

                locate_el.addEventListener(click_handler, async function (e) {
                    e.stopPropagation();

                    let _item = photosApp.items.local.items[photosApp.fullscreen.item_ids.current];

                    photosApp.items.showLocal(e, _item.id);
                });
            }

            locate_el.setAttribute('data-item-id', photosApp.fullscreen.item_ids.current);
            locate_el.querySelector('.action-name').innerHTML = 'Locate';
        }

        function updateDelete() {
            if(!delete_el._event_listener) {
                delete_el._event_listener = true;

                delete_el.addEventListener(click_handler, function (e) {
                    e.stopPropagation();

                    photosApp.app.openConfirm(
                        null,
                        'fullscreen-delete-item',
                        'Would you like to delete this item?',
                        photosApp.fullscreen.item_ids.current
                    );
                });
            }
        }

        updateDate();

        updateFileInfo();

        updateSlideshow();

        updateLocate();

        updateDelete();
    },
    currentTimeHeight: function () {
        return document.getElementById('time').querySelector('.display.time-period').scrollHeight;
    },
    getBackendView(view_route, add_params) {
        return new Promise(async (resolve, reject) => {
            let params = {
                width: photosApp.style.screen.width.current,
                height: photosApp.style.screen.height.current,
                click_handler: click_handler
            }

            if(add_params) {
                for(let k in add_params) {
                    params[k] = add_params[k];
                }
            }

            try {
                let r = await axios.put(`${photosApp.backend.host}views/${view_route}`, params);
                resolve(r.data);
            } catch (e) {
                console.error(e);
                resolve();
            }
        });
    },
    removeDisplayFirst(image) {
        requestAnimationFrame(function () {
            //used to prevent swapping images when first loaded

            if(image && image.classList.contains('show')) {
                removeClassEl(photosApp.style.classes.display_first, image.parentElement);
            }
        });
    },
};