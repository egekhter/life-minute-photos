let view_processes = {
    time: []
}

let rows_per_group = 10;

function getClassListStr(input) {
    if(!input.length) {
        return '';
    }

    return `class="${input.join(' ')}"`;
}

function getAttributesStr(input) {
    let attributes_list = '';

    let attribute_keys = Object.keys(input);

    for(const aki in attribute_keys) {
        if(aki > 0) {
            attributes_list += ' ';
        }

        let attr_name = attribute_keys[aki];
        let attr_value = input[attr_name];
        attributes_list += `${attr_name}="${attr_value}"`;
    }

    return attributes_list;
}

function getEventsStr(input) {
    let events_list = '';

    if(input.length) {
        for(const el in input) {
            if(el > 0) {
                events_list += ' ';
            }

            let event_keys = Object.keys(input[el]);

            for(const eki in event_keys) {
                if(eki > 0) {
                    events_list += ' ';
                }

                let event_name = event_keys[eki];

                let event_value = input[el][event_name].toString();
                events_list += `on${event_name}="${event_value}"`;
            }
        }
    }

    return events_list;
}

function processViewPart(part) {
    function processChildren(children) {

        for(const ci in children) {
            let child = children[ci];
            let class_str = getClassListStr(child.classList);
            let attributes_str = getAttributesStr(child.attributes);
            let events_str = getEventsStr(child.events);
            let child_html = `<${child.type} ${class_str} ${attributes_str} ${events_str}>`;

            if(child.innerHTML) {
                child_html += child.innerHTML;
            }

            html += child_html;

            if(child.children.length) {
                processChildren(child.children);
            }

            html += `</${child.type}>`;
        }
    }

    let class_str = getClassListStr(part.classList);
    let attributes_str = getAttributesStr(part.attributes);
    let events_str = getEventsStr(part.events);

    let html = `<${part.type} ${class_str} ${attributes_str} ${events_str}>`;

    if(part.innerHTML) {
        html += part.innerHTML;
    }

    processChildren(part.children);
    html += `</${part.type}>`;

    return html;
}

function calculateMargin(percent_of_width) {
    let space_width = screenWidth * percent_of_width;

    let content_width = screenWidth - space_width;
    let max_metadata_row = Math.floor(content_width / style_metadata.wh);

    if(max_metadata_row < style_metadata.minMetadataRow) {
        max_metadata_row = style_metadata.minMetadataRow;
    }

    let extra_space = content_width - (max_metadata_row * style_metadata.wh);

    if(extra_space < 0) {
        extra_space = 0;
    }

    let total_space = space_width + extra_space;

    let margin = total_space / (max_metadata_row + 1);

    return {
        margin: margin,
        max_metadata_row: max_metadata_row
    };
}

global.setGlobalViewParams = function (params) {
    if(params.width) {
        viewsL.screenWidth = global.screenWidth = params.width;
    }

    if(params.height) {
        viewsL.screenHeight = global.screenHeight = params.height;
    }

    if(params.click_handler) {
        global.click_handler = params.click_handler;
    }

    if(params.metadata) {
        global.style_metadata = params.metadata;
    }
}

function getLife(params) {
    return new Promise(async (resolve, reject) => {
        let app_items;

        setGlobalViewParams(params);

        appL.reset();

        await itemsL.mergeData();

        try {
            await itemsL.getLife();
        } catch(e) {
            console.error(e);
        }

        try {
            app_items = await cacheL.getItems(settingsL.data.feature.chronology);
            app_items = app_items.slice();
        } catch(e) {

        }

        //handle no items
        if(!app_items.length) {
            return resolve(null);
        }

        let startTime = timeNow(true);

        view_processes.time.push(startTime);

        //init intervalLoops to 0
        await timeL.initIntervalLoops(params.on_chronology);

        try {
            let data = await createLifeView(app_items);

            return resolve(data);
        } catch (e) {
            debugL.error(e);
            reject();
        }
    });
}

function createLifeView(items) {

    return new Promise(async (resolve, reject) => {
        let viewObj = {
            process: null,
            html: '',
            class: 'life'
        };

        if(!items.length) {
            return resolve(viewObj);
        }

        function processDate() {
            return new Promise(async (resolve2, reject) => {
                let dateGrid;

                let divDate = viewsL.createEl('div', null, [viewObj.class, 'row-group']);

                //container
                let dateContainer = viewsL.createEl('div', null, `${viewObj.class}__container`);

                //grid
                try {
                    dateGrid = await gridL.getLife();
                } catch(e) {
                    console.error(e);
                }

                let row_height = 0;

                //used to stretch view to fill screen, for calc purposes only, handled on frontend.
                let pre_adjust_height = 0;

                let gridIndex = 0;

                //loop rows
                for (let r = 0; r < dateGrid.length; r++) {
                    let divRow = viewsL.createEl('div', null, [`${viewObj.class}__row`, `row-${dateGrid.length}`, `row-cols-${dateGrid[r].length}`, 'date__row']);
                    let num_cols = dateGrid[r].length;
                    let total_borders = (num_cols - 1) * viewsL.border.cols;

                    let height = (screenWidth - total_borders) / num_cols;

                    if (num_cols === 1) {
                        // height = screenWidth / 2;
                    }

                    viewsL.addStyles(divRow, {
                        top: row_height,
                        height: height
                    });

                    row_height += (height + viewsL.border.rows);

                    pre_adjust_height += height;

                    //loop columns
                    for (let c = 0; c < dateGrid[r].length; c++) {
                        let dateDetail = dateGrid[r][c];

                        let divColumn = viewsL.createEl('div', null, [`${viewObj.class}__column`, `col-${num_cols}`, `col-index-${c}`, 'date__column', viewsL.classes.display_first]);

                        let col_width = height;

                        viewsL.addStyles(divColumn, {
                            width: col_width,
                            height: height
                        });

                        divColumn.attributes['id'] = `life-${gridIndex}`;

                        divColumn.attributes['grid-index'] = gridIndex;

                        // handle navigation to full screen
                        let dc_event = {};

                        dc_event[click_handler] = 'photosApp.events.onDivColumnClick(event)';

                        divColumn.events.push(dc_event);

                        // add menu selector
                        let dm_event = {}, divDateMenu;

                        divDateMenu = viewsL.createEl('div', null, ['dots-icon']);

                        divDateMenu.innerHTML = iconDots();

                        dm_event[click_handler] = 'photosApp.events.onGridMenuClick(event)';

                        divDateMenu.events.push(dm_event);
                        divColumn.children.push(divDateMenu);

                        // navigate button section
                        let divTimeButtonContainer = viewsL.createEl('div', null, 'life-button-container');
                        let divTimeButtonBackground = viewsL.createEl('div', null, 'life-button-background');
                        let divTimeButtonDescription = viewsL.createEl('div', null, ['life-description', settingsL.data.feature.chronology]);
                        
                        let year_earliest = timeL.getYearOfDate(dateDetail.earliest);
                        let month_earliest = timeL.getMonthOfDate(dateDetail.earliest, true);
                        let year_latest = timeL.getYearOfDate(dateDetail.latest);
                        let month_latest = timeL.getMonthOfDate(dateDetail.latest, true);

                        let buttonHTML = '';

                        let dash_str = '-';

                        if(settingsL.data.feature.chronology === 'asc') {
                            buttonHTML = `<div class="from">
                                                <div class="month">${month_earliest}</div>
                                                <div class="year">${year_earliest}</div>
                                           </div>
                                            
                                           <div class="dash">${dash_str}</div>
                                            
                                           <div class="to">
                                                <div class="month">${month_latest}</div>
                                                <div class="year">${year_latest}</div>
                                           </div>`;
                        } else {
                            buttonHTML = `<div class="to">
                                                <div class="month">${month_latest}</div>
                                                <div class="year">${year_latest}</div>
                                           </div>
                                            
                                           <div class="dash">${dash_str}</div>
                                            
                                           <div class="from">
                                                <div class="month">${month_earliest}</div>
                                                <div class="year">${year_earliest}</div>
                                           </div>`;
                        }

                        if(year_earliest == year_latest) {
                            let months_str = `${month_latest} - ${month_earliest}`;

                            if(settingsL.data.feature.chronology === 'asc') {
                                months_str = `${month_earliest} - ${month_latest}`;
                            }

                            if(month_latest == month_earliest) {
                                months_str = month_latest;
                            }

                            buttonHTML = `<div class="from single">
                                                <div class="months">${months_str}</div>
                                                <div class="year">${year_latest}</div>
                                          </div>`;
                        }

                        divTimeButtonDescription.innerHTML = buttonHTML;

                        let dtbc_event = {};

                        divTimeButtonContainer.events.push(dtbc_event);

                        divTimeButtonContainer.attributes['period'] = viewObj.class;
                        divTimeButtonContainer['children'].push(divTimeButtonDescription);
                        divTimeButtonContainer['children'].push(divTimeButtonBackground);
                        divColumn['children'].push(divTimeButtonContainer);

                        for (let y = 0; y < timeL.divs; y++) {
                            let classes = [`${viewObj.class}__image`, `date__image`, `order-${y}`];

                            let itemDate;

                            if(timeL.showThumbLife(gridIndex, y)) {
                                classes.push('show');
                            }

                            try {
                                itemDate = await itemsL.getLifeItem(gridIndex, y);
                            } catch(e) {
                                console.error(e);
                            }

                            //is portrait
                            if(itemDate.is_photo && itemDate.height > itemDate.width) {
                                classes.push(viewsL.classes.is_portrait);
                            }

                            let divDateDetail = viewsL.createEl('div', null, classes);

                            divDateDetail.attributes['order'] = y;

                            try {
                                divDateDetail.attributes['data-item-id'] = itemDate['id'];
                            } catch (e) {
                                continue;
                            }

                            divDateDetail.attributes['col-length'] = dateGrid[r].length;

                            divColumn.children.push(divDateDetail);
                        }

                        divRow.children.push(divColumn);

                        gridIndex++;
                    }

                    dateContainer.children.push(divRow);
                } // end of row loop

                divDate.children.push(dateContainer);

                viewObj.process = divDate;

                resolve2();
            });
        }
        
        try {
            await processDate();

            viewObj.html = processViewPart(viewObj.process);

            return resolve(viewObj.html);
        } catch(e) {
            reject(e);
        }
    });
}

module.exports = {
    getLife: getLife,
    time: {
        section: {
            padding: {
                top: 10,
                bottom: 14
            }
        },
        spacer: {
            top: 20
        }
    },
    fonts: {
        default: {
            style: '"Wigrum", sans-serif',
            size: 32
        },
        test_el: null
    },
    breakpoints_list: [720],
    breakpoints: {
        '720': {
            title: {
                padding: {
                    bottom: 14,
                    top: 20
                },
                height: 25
            },
            grid: {
                button: {
                    width: 100,
                    max_width_percent: .4, //percent of column
                    height_percent: .333, //percent of width
                    padding: {
                        top: 8,
                        bottom: 8,
                        left: 5,
                        right: 5
                    },
                    max_font: 22,
                    height_adjustment: .16 //percent
                }
            }
        }
    },
    headerHeight: null,
    footerHeight: null,
    fullNavigationHeight: null,
    screenHeight: null,
    screenWidth: null,
    calculations: {},
    sheets: {
        customIndex: null,
        customSheet: null,
        lastInsertedInex: null,
        lastInsertedSheet: null
    },
    classes: {
        display_first: 'display_first',
        is_portrait: 'is_portrait'
    },
    border: {
        rows: 2,
        cols: 2
    },
    title: {
        padding: {
            bottom: 20,
            top: 20
        },
        height: 32
    },
    grid: {
        button: {
            width: 110,
            max_width_percent: .4, //percent of column
            height_percent: .3, //percent of width
            padding: {
                top: 8,
                bottom: 8,
                left: 5,
                right: 5
            },
            max_font: 24,
            height_adjustment: .16 //percent
        }
    },
    addStyles: function (el, styles) {
        let style_string = '';

        for(let property in styles) {
            let style = styles[property];

            if (Number.isInteger(style) || isFloat(style)) {
                style += 'px';
            }

            style_string += `${property}: ${style}; `;
        }

        el.attributes['style'] = style_string;

        return el;
    },
    createEl: function (type, id, class_list) {
        let el = {
            type: type,
            events: [],
            classList: [],
            children: [],
            attributes: {}
        };

        if(id) {
            el.attributes['id'] = id;
        }

        if(class_list) {
            if(Array.isArray(class_list)) {
                for(let i = 0 ; i < class_list.length; i++) {
                    if(class_list[i] && el.classList.indexOf(class_list[i]) === -1) {
                        el.classList.push(class_list[i]);
                    }
                }
            } else {
                if(class_list && el.classList.indexOf(class_list) === -1) {
                    el.classList.push(class_list);
                }
            }
        }

        return el;
    },
    organizeGrid(params) {
        return new Promise(async (resolve, reject) => {
            setGlobalViewParams(params);

            let selected = params.selected;
            let gridIndex = params.gridIndex;

            let items = [];

            if(gridIndex) {
                try {
                    items = await timeL.getItems(gridIndex, settingsL.data.feature.chronology);
                } catch(e) {
                    console.error(e);
                }
            }

            if(!items.length) {
                return resolve({
                    html: null,
                    item_ids: null
                });
            }

            let view = {
                parts: [],
                html: ''
            };

            let items_filtered = [];
            let item_ids = [];

            for(let item of items) {
                let item_id = item.item_id ? item.item_id : item.id;

                let thumb = await imageL.getThumb(item_id);

                if(!thumb) {
                    continue;
                }

                if(thumb) {
                    items_filtered.push({
                        item_id: item_id,
                        thumb: thumb,
                        date: getMasterDate(item)
                    });

                    item_ids.push(item_id);
                }
            }

            if(selected === null) {
                selected = {};
            }

            let menu_height_adjustment = 50;

            let margin = null, data;
            let percent_of_width = style_metadata.percentOfWidthMargin;

            while(!margin || margin < style_metadata.minMargin) {
                data = calculateMargin(percent_of_width);
                margin = data.margin;

                if(margin < style_metadata.minMargin) {
                    percent_of_width += .05;
                }

                if(percent_of_width >= 1) {
                    break;
                }
            }

            let max_items_row = data.max_metadata_row;

            let marginTB = style_metadata.wh * style_metadata.percentMarginTB;

            if(marginTB < style_metadata.minMarginTB) {
                marginTB = style_metadata.minMarginTB;
            }

            let row_height = marginTB + menu_height_adjustment;
            let row = viewsL.createEl('div', null, 'organize-row');
            viewsL.addStyles(row, {
                top: row_height
            });

            let row_group = viewsL.createEl('div', null, 'row-group');
            row_group.attributes['top'] = row_height;
            row_group.children.push(row);
            viewsL.addStyles(row_group, {
                top: row_height
            });

            let row_start_x = margin;

            let current_items_row = 0;

            let add_new_row = false;

            for(let k in items_filtered) {
                let item = items_filtered[k];

                if(current_items_row >= max_items_row) {
                    row_start_x = margin;
                    row_height += style_metadata.wh + marginTB;

                    if(row_group.children.length >= rows_per_group) {
                        view.parts.push(row_group);
                        row_group = viewsL.createEl('div', null, 'row-group');
                        row_group.attributes['top'] = row_height;
                        viewsL.addStyles(row_group, {
                            top: row_height
                        });
                    }

                    current_items_row = 0;

                    add_new_row = true;
                }

                let item_div = viewsL.createEl('div', `gridorganizeitem${item.item_id}`, ['organize__item', `metadata-index-${current_items_row}`]);

                let metadata_info = viewsL.createEl('div', null, ['metadata__info']);
                metadata_info.innerHTML = `<div class="info date original">
                ${item.date.substring(0, 10)}
</div><div class="info date new"></div>`;

                //conditional selected
                let classes = ['grid_item_container'];

                if(item.item_id in selected) {
                    classes.push('selected');
                }

                let item_container = viewsL.createEl('div', null, classes);
                item_container.attributes['data-item-id'] = item.item_id;

                item_div.attributes['data-item-id'] = item.item_id;
                let pi_event = {};
                pi_event[click_handler] = 'photosApp.events.selectGridItem(event)';
                item_div.events.push(pi_event);

                let item_img = viewsL.createEl('div', null, 'grid_item__image');
                item_img.attributes['data-src'] = item.thumb;

                let check_icon = viewsL.createEl('i', null, ['check-icon']);

                check_icon.innerHTML = iconCheck();

                let item_overlay = viewsL.createEl('div', null, ['grid_item__overlay']);

                item_container.children.push(item_img);
                item_container.children.push(check_icon);
                item_container.children.push(item_overlay);

                item_div.children.push(item_container);
                item_div.children.push(metadata_info);

                if(add_new_row) {
                    row = viewsL.createEl('div', null, 'organize-row');

                    row_group.children.push(row);

                    viewsL.addStyles(row, {
                        top: row_height
                    });

                    add_new_row = false;
                }

                row.children.push(item_div);

                current_items_row++;

                row_start_x += margin + style_metadata.wh;
            }

            //for last row
            if(view.parts.indexOf(row_group) === -1) {
                view.parts.push(row_group);
            }

            //spacer at end
            let spacer = viewsL.createEl('div', null, 'spacer');

            viewsL.addStyles(spacer, {
                top: row_height + style_metadata.wh,
                width: '100vw',
                height: style_metadata.spacerHeight,
                position: 'absolute'
            });

            view.parts.push(spacer);

            for(const pi in view.parts) {
                let part = view.parts[pi];
                let partHtml = processViewPart(part);
                view.html += partHtml;
            }

            resolve({
                item_ids: item_ids,
                html: view.html
            });
        });
    }
}