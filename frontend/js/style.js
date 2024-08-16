photosApp.style = {
    name: 'style',
    init_called: false,
    breakpoints: {
        '720': {
            title: {
                padding: {
                    bottom: 14,
                    top: 14
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
            },
            header: {
                logo: {
                    width: 50
                }
            }
        },
        '601': {
            navigation: {
                footer: {
                    height: 86
                },
                level3: {
                    header: {
                        height: 61
                    }
                }
            },
            description: {
                paddingTB: 0
            },
            title: {
                height: 26
            },
            cards: {
                fontSize: 16
            }
        },
    },
    header: {
        logo: {
            width: 160
        },
        height: 60,
        progress: {
            transition: 300
        },
        hide: {
            transition_ip: false,
            transition_duration: 300
        },
        windows: {
            barHeight: 30
        }
    },
    headerHeight: null,
    footerHeight: null,
    fullNavigationHeight: null,
    screen: {
        width: {
            start: null,
            current: null
        },
        height: {
            start: null,
            current: null
        },
        devicePixelRatio: window.devicePixelRatio
    },
    orientation: {
        start: null,
        current: null,
        angles: {
            portrait: [0, 180, 360, -180],
            landscape: [90, 270, -90]
        }
    },
    navigation: {
        level2: {
            height: 50,
            transition: 500
        },
        level3: {
            height: null,
            transition: 500,
            header: {
                height: 78
            }
        },
        footer: {
            height: 90
        }
    },
    view: {
        level2: {
            height: null,
            organize: {
                menu: {
                    height: 50
                }
            }
        },
        settings: {
            height: null
        }
    },
    sheets: {
        customIndex: null,
        customSheet: null,
        lastInsertedIndex: null,
        lastInsertedSheet: null,
        transitionSheet: null,
        fullscreenSheet: null
    },
    classes: {
        show_navigation: 'show-navigation',
        display_first: 'display_first',
        hide_controls: 'hide_controls',
        hide_footer: 'hide_footer',
        level2shown: 'level-2-shown',
        level3shown: 'level-3-shown',
        hide_header: 'hide_header',
        mouse_over_controls: 'mouse-over-controls',
        fullscreen_open_ip: 'fs-open-ip',
        hide_side_buttons: 'hide-side-buttons',
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
            width: 130,
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
        },
        menu: {
            width: 160,
            height: 130
        },
        circle: {
            width: 20
        }
    },
    metadata: {
        minwh: 100,
        percentwh: .125,
        wh: 100,
        minMargin: 20,
        maxMargin: 60,
        marginLR: null,
        minMarginTB: 15,
        percentMarginTB: .125,
        marginTB: 15,
        percentOfWidthMargin: .15,
        menuWidth: 200,
        menuHeight: 210,
        minMetadataRow: 3,
        maxMetadataRow: null,
        percentOfWidth: null,
        logoMargin: 30,
        spacerHeight: 20,
        menu: {
            fontType: 'far'
        }
    },
    fullscreen: {
        menu: {
            row: {
                height: 30
            },
            padding: {
                top: 5,
                bottom: 5
            },
            section: {
                height: 40
            },
            metadata: {
                add: {
                    height: 30
                },
                row: {
                    height: 50
                },
                image: {
                    dim: 30
                },
                autoCompleteList: {
                    height: 200
                },
                top: {
                    margin: {
                        bottom: 0
                    }
                }
            }
        },
        dropdown: {
            width: 320
        },
        topbar: {
            height: 70,
            mobile_w: 124
        }
    },
    settings: {
        sections: 6,
        section: {
            group: {
                width: 280,
                timing: {
                    marginLR: null,
                    cols: 2
                },
                center: {
                    left: null
                }
            },
            width: null
        },
        nav: {
            width: null,
            height: null,
            contentHeight: null
        },
        navThird: {
            height: null
        },
        navBar: {
            marginTB: null,
            height: 60
        },
        grid: {
            rows: 3,
            cols: 2
        },
        marginLR: 30,
        marginTBPercent: .10,
        marginTB: null,
        paddingLR: 10,
        transition: {
            section: 330,
            navigation: 500
        },
        description: {
            paddingTB: 0
        },
        title: {
            height: 31
        },
        modal: {
            maxHeight: .8,
            header: {
                height: 60
            },
            content: {
                paddingTB: 20
            },
            footer: {
                height: 72
            }
        },
    },
    rotateControl: {
        width: 50
    },
    async resizeLogic(e) {
        return new Promise(async (resolve, reject) => {
            devConsole("Resizing");

            photosApp.style.removeAnimations();

            photosApp.style.setStyles();

            if(!photosApp.events.init_called) {
                return reject();
            }

            photosApp.fullscreen.onResize();

            photosApp.slideshow.onResize();

            await photosApp.style.updateCalculations(true);

            photosApp.style.restoreAnimations();

            resolve();
        });
    },
    init: function () {
        photosApp.initLastStep = 'style';

        return new Promise(async(resolve, reject) => {
            if(photosApp.style.init_called) {
                return resolve();
            }

            photosApp.style.init_called = true;

            let stylesheets = document.styleSheets;
            photosApp.style.sheets.lastInsertedSheet = stylesheets[stylesheets.length - 1];
            photosApp.style.sheets.lastInsertedIndex = stylesheets.length - 1;
            photosApp.style.sheets.customIndex = photosApp.style.sheets.lastInsertedSheet + 1;
            photosApp.style.setStyles();

            resolve();

            window.addEventListener('resize', async function (e) {
                await photosApp.style.resizeLogic(e);
            });
        });
    },
    setStyles: function() {
        let footerHeight;

        photosApp.style.screen.width.current = window.innerWidth;
        photosApp.style.screen.height.current = window.innerHeight;

        photosApp.style.headerHeight = document.getElementById('header').offsetHeight;

        if(is_windows) {
            photosApp.style.headerHeight += document.getElementById('windows-bar').offsetHeight;
        }

        photosApp.style.footerHeight = footerHeight = document.getElementById('footer').offsetHeight;

        photosApp.style.navigation.level2.height = 50;

        photosApp.style.fullNavigationHeight = photosApp.style.footerHeight + 1;

        photosApp.style.contentHeight = photosApp.style.screen.height.current - photosApp.style.headerHeight;

        photosApp.style.view.level2.height = Math.round(photosApp.style.screen.height.current * .9 - footerHeight);

        //remove stylesheet
        photosApp.style.removeCustomSheet();

        //add custom styles
        photosApp.style.addCustomSheet();

        photosApp.style.updateBackend();

    },
    updateTimeViewValues: function() {
        let key = 'life';

        let time_height = 0;

        let els = photosApp.app.els.time.getElementsByClassName(key);

        for(let i = 0; i < els.length; i++) {
            let el = els[i];

            let row_height;
            // update: el top, el width

            if(key !== 'life' && key !== 'all') {
                el = photosApp.style.addStyles(el, {
                    top: time_height,
                });

                el.setAttribute('top', time_height);
            }

            let title_height = photosApp.style.dynamicValue('title.height') + photosApp.style.dynamicValue('title.padding.bottom');

            let rows = el.getElementsByClassName(`${key}__row`);

            if(key === 'life') {
                row_height = 0;
            } else {
                row_height = title_height;
            }

            // el->rows width, height, top
            let pre_adjust_height = 0;

            for(let l = 0; l < rows.length; l++) {
                let row = rows[l];

                let cols = row.getElementsByClassName(`${key}__column`);

                let num_cols = cols.length;
                let total_borders = (num_cols - 1) * photosApp.style.border.cols;
                let height = (photosApp.style.screen.width.current - total_borders) / num_cols;

                if (num_cols === 1) {
                    // height = photosApp.style.screen.width.current / 2;
                }

                pre_adjust_height += height;
            }

            let use_height = photosApp.style.screen.height.current;

            if(photosApp.settings.data.style.header) {
                use_height -= photosApp.style.dynamicValue('header.height');
            }

            let height_multiplier = use_height  / pre_adjust_height;
            // height_multiplier = 1;

            for(let l = 0; l < rows.length; l++) {
                let row = rows[l];

                let cols = row.getElementsByClassName(`${key}__column`);

                let num_cols = cols.length;
                let total_borders = (num_cols - 1) * photosApp.style.border.cols;
                let height = (photosApp.style.screen.width.current - total_borders) / num_cols;

                if (num_cols === 1) {
                    // height = photosApp.style.screen.width.current / 2;
                }

                let col_width = height;

                if(rows.length === 1 || key === 'all') {
                    //do not adjust height
                } else {
                    height *= height_multiplier;
                }

                photosApp.style.addStyles(row, {
                    top: row_height,
                    height: height
                });

                row_height += (height + photosApp.style.border.rows);

                //update col dims
                for(let c = 0; c < cols.length; c++) {
                    let col = cols[c];

                    photosApp.style.addStyles(col, {
                        width: col_width,
                        height: height
                    });
                }

                // //calculate height for life view scroll
                if(key === 'life' && l === rows.length - 1) {
                    photosApp.style.addStyles(document.getElementById('life'), {
                        height: row_height + 100
                    });
                }
            }

            time_height += row_height + photosApp.style.dynamicValue('title.padding.top');
        }
    },
    updateMetadataViewValues: function() {
        function updateViewTop(el, row_class, add_start_top) {
            if(typeof el === 'string') {
                el = document.getElementById(el);
            }

            if(!add_start_top) {
                add_start_top = 0;
            }

            let row_height = marginTB + add_start_top;

            let row_groups = el.getElementsByClassName('row-group');

            for (let k = 0; k < row_groups.length; k++) {
                let row_group = row_groups[k];
                row_group.style.setProperty('top', row_height + 'px');
                row_group.setAttribute('top', row_height);
                let metadata_rows = row_group.getElementsByClassName(row_class);

                for (let l = 0; l < metadata_rows.length; l++) {
                    let metadata_row = metadata_rows[l];
                    metadata_row.style.setProperty('top', row_height + 'px');

                    row_height += photosApp.style.metadata.wh + marginTB;
                }
            }

            let spacer = el.querySelector('.spacer');

            if(spacer) {
                spacer.style.setProperty('top', row_height + marginTB + 'px');
                spacer.style.setProperty('height', marginTB + 'px');
            }
        }

        let marginTB = photosApp.style.metadata.wh * photosApp.style.metadata.percentMarginTB;

        if(marginTB < photosApp.style.metadata.minMarginTB) {
            marginTB = photosApp.style.metadata.minMarginTB;
        }

        //organize all
        updateViewTop('organize-all', 'organize-row', photosApp.style.view.level2.organize.menu.height);

        photosApp.style.setLevel3Height();
    },
    updateCalculations: async function(update_view_values) {
        return new Promise(async (resolve, reject) => {
            if(update_view_values) {
                photosApp.style.updateTimeViewValues();
                photosApp.style.updateMetadataViewValues();
            }

            resolve();
        });

    },
    removeCustomSheet() {
        if(photosApp.style.sheets.customSheet) {
            photosApp.style.sheets.customSheet.parentNode.removeChild(photosApp.style.sheets.customSheet);
            photosApp.style.sheets.customSheet = null;
        }
    },
    removeFullscreenSheet() {
        if(photosApp.style.sheets.fullscreenSheet) {
            photosApp.style.sheets.fullscreenSheet.parentNode.removeChild(photosApp.style.sheets.fullscreenSheet);
            photosApp.style.sheets.fullscreenSheet = null;
        }
    },
    calculateMetadata: function() {
        function calculateMargin(percent_of_width) {
            let space_width = photosApp.style.screen.width.current * percent_of_width;
            let content_width = photosApp.style.screen.width.current - space_width;
            let max_metadata_row = Math.floor(content_width / photosApp.style.metadata.wh);

            if(max_metadata_row < photosApp.style.metadata.minMetadataRow) {
                max_metadata_row = photosApp.style.metadata.minMetadataRow;
            }

            let extra_space = content_width - max_metadata_row * photosApp.style.metadata.wh;
            let total_space = space_width + extra_space;
            let margin = total_space / (max_metadata_row + 1);

            return {
                margin: margin,
                max_metadata_row: max_metadata_row
            };
        }

        let margin = null, data;
        let percent_of_width = photosApp.style.metadata.percentOfWidthMargin;

        while(!margin || margin < photosApp.style.metadata.minMargin) {
            if(data && data.max_metadata_row <= photosApp.style.metadata.minMetadataRow) {
                break;
            }
            data = calculateMargin(percent_of_width);
            margin = data.margin;
            if(margin < photosApp.style.metadata.minMargin) {
                percent_of_width += .05;
            }
        }

        photosApp.style.metadata.maxMetadataRow = data.max_metadata_row;
        photosApp.style.metadata.percentOfWidth = percent_of_width;

        return data;
    },
    calculateMetadataMargin: function() {
        let space_width = photosApp.style.screen.width.current * photosApp.style.metadata.percentOfWidth;
        let content_width = photosApp.style.screen.width.current - space_width;
        let extra_space = content_width - photosApp.style.metadata.maxMetadataRow * photosApp.style.metadata.wh;
        let total_space = space_width + extra_space;
        return total_space / (photosApp.style.metadata.maxMetadataRow + 1);
    },
    metadataExceedsWidth: function() {
        let cols = photosApp.style.metadata.maxMetadataRow;
        let margin = photosApp.style.calculateMetadataMargin();
        if(margin < photosApp.style.metadata.minMargin) {
            return true;
        }

        return false;
    },
    emptyActiveLevel3El: function() {
        let el = photosApp.app.els.level3;
        if(el) {
            el = el.querySelector('.level-3-content.active');
            if(el && !el.firstChild) {
                return true;
            }
        }

        return false;
    },
    addCustomSheet() {
        let sheet = document.createElement('style');
        let border_width = 2;

        let cols = {
            min: 1,
            max: 15
        };

        let metadataIndexes = {
            min: 0,
            max: 30
        };

        let colClasses = ``;
        let metadataClasses = ``;

        for(let c = cols.min; c <= cols.max; c++) {
            let colWH;
            let colCl = `col-${c}`;
            let rowColCl = `row-cols-${c}`;
            //col-x.col-index-x

            if(c > 1) {
                colWH = (photosApp.style.screen.width.current - (border_width * (c - 1) ) ) / c;
            } else {
                colWH = photosApp.style.screen.width.current / 2;
            }

            let colH = colWH;

            if(c === 1) {
                colH = photosApp.style.screen.width.current / 2;
            }

            //only use for all only
            colClasses += `#all .${colCl} {
                        width: ${colWH}px;
                        height: ${colH}px;
                    } `;

            colClasses += `#all .${rowColCl} {
                        height: ${colWH}px;
                    } `;


            for(let c2 = 0; c2 < cols.max; c2++) {
                let classname = `.${colCl}.col-index-${c2}`;
                let left = c2 * colWH;
                let border_adjustment = c2 * border_width;
                left += border_adjustment;

                colClasses += `${classname} {
                            left: ${left}px;
                        } `;
            }
        }

        //calculate metadata wh

        photosApp.style.metadata.wh = photosApp.style.screen.width.current * photosApp.style.metadata.percentwh;

        let min_wh = photosApp.style.dynamicValue('metadata.minwh');

        if(photosApp.style.metadata.wh < min_wh) {
            photosApp.style.metadata.wh = min_wh;
        }

        let metadataMargin;

        if(!photosApp.style.metadata.maxMetadataRow) {
            metadataMargin = photosApp.style.calculateMetadata().margin;
        } else {
            metadataMargin = photosApp.style.calculateMetadataMargin();

            if(metadataMargin >= photosApp.style.metadata.maxMargin || photosApp.style.metadataExceedsWidth() || photosApp.style.emptyActiveLevel3El()) {
                metadataMargin = photosApp.style.calculateMetadata().margin;

               if(photosApp.app.views.level2.active === 'grid') {
                    let organize_all = document.getElementById('organize-all');

                    if(organize_all.classList.contains('active')) {
                        photosApp.view.updateOrganizeGridItemsView(organize_all.getAttribute('data-date-id'));
                    }
                } else if(photosApp.app.views.level2.active === 'folders') {
                   photosApp.view.updateManageDirectories();
               }
            }
        }

        for(let mc = metadataIndexes.min; mc < metadataIndexes.max; mc++) {
            let metaClass = `metadata-index-${mc}`;
            left = metadataMargin + ( photosApp.style.metadata.wh * (mc) ) + metadataMargin * (mc);
            metadataClasses += `
                    .${metaClass} {
                        left: ${left}px;
                    }`;
        }

        let transformClasses = '';
        let transform_els = [''];

        _.forEach(transform_els, function (transform_el) {
            _.forEach(['life'], function (date) {
                let transformClass = `${date}__${transform_el}`;
                let transform_values = ``;

                _.forEach(['webkit', 'moz', 'ms'], function (platform) {
                    transform_values += `-${platform}-transform: translate3d(0,0,0); `;
                });

                transform_values += `transform: translate3d(0,0,0); `;

                transformClasses += `.${transformClass} {
                            ${transform_values}
                        }`;
            });
        });

        sheet.innerHTML = `
                    #app {
                        width: ${photosApp.style.screen.width.current}px;
                        height: ${photosApp.style.screen.height.current}px;
                    }
                    
                    #time {
                        top: ${photosApp.style.headerHeight}px;
                    }
                    
                    #time, #life {
                        height: ${photosApp.style.contentHeight}px;
                    }
                    
                    .life {
                        width: ${photosApp.style.screen.width.current}px;
                    }
                    
                    .life__row {
                        width: ${photosApp.style.screen.width.current}px;
                    }
                    
                    ${colClasses}
                    
                    #navigation {
                        bottom: ${photosApp.style.fullNavigationHeight}px;
                        transition: transform .3s ease-in-out;
                    }
                    
                    #navigate-time {
                        transform: translateY(-${photosApp.style.footerHeight + 10}px);
                    }
                    
                    #view-level-2 {
                        height: ${photosApp.style.view.level2.height}px;
                    }
                    
                    #view-level-2.visible {
                        bottom: ${photosApp.style.footerHeight}px;
                    }
                    
                    #app.onboarding #navigation, 
                    .scrolling-down #navigation, 
                    .fullscreen #navigation, 
                    #app.onboarding #navigate-time,
                    .scrolling-down #navigate-time,
                    .fullscreen #navigate-time
                     {
                        transform: translateY(${photosApp.style.fullNavigationHeight}px);
                    }
                    
                    #app.hide_footer #navigation,
                    #app.hide_footer #navigate-time {
                        transform: translateY(${photosApp.style.fullNavigationHeight}px) !important;
                    }
                    
                    #app.${photosApp.style.classes.show_navigation} #navigation, 
                    #app.level-2-shown #navigation
                    {
                      transform: translateY(0) !important;
                    }
                    
                    #app.${photosApp.style.classes.show_navigation} #navigate-time, 
                    #app.level-2-shown #navigate-time
                    {
                        transform: translateY(-${photosApp.style.footerHeight + 10}px) !important;
                    }
                    
                    #app.onboarding #side-buttons, 
                    .scrolling-down #side-buttons, 
                    .fullscreen #side-buttons
                    {
                        transform: translateX(${photosApp.style.rotateControl.width}px);
                    }
                    
                    .organize__item {
                        width: ${photosApp.style.metadata.wh}px;
                        height: ${photosApp.style.metadata.wh}px;
                    }
                    
                    ${metadataClasses}
                    
                    ${transformClasses}
                `;

        document.body.appendChild(sheet);

        photosApp.style.sheets.customSheet = sheet;

        photosApp.style.updateGridButtonDims();
    },
    updateGridButtonDims: function (loop) {
        if(loop > 10) {
            return;
        }

        let life_description_els = document.getElementsByClassName('life-description');

        if(!life_description_els.length) { //if app still loading
            return requestAnimationFrame(function () {
                photosApp.style.updateGridButtonDims(loop ? loop + 1 : 1);
            });
        }

        for(let i = 0; i < life_description_els.length; i++) {
            let el = life_description_els[i];
            let box = el.getBoundingClientRect();

            let btn = el.parentElement.querySelector('.life-button-background');

            btn.style.width = `${box.width}px`;
            btn.style.height = `${box.height}px`;
        }
    },
    addFullscreenSheet: function() {
        let sheet = document.createElement('style');

        let mouse_over_display = ``;

        if(is_touch_device()) {
            mouse_over_display = `#fullscreen .mouse-display {
                        display: none !important; 
                    }`;
        }

        let fsDropdownClasses = '';

        let fsMobileDd = '';

        let fs_el = document.getElementById('fullscreen');

        let fs_tb = fs_el.querySelector('.top-bar');
        let fs_date = fs_tb.querySelector('.action.date');
        let fs_file = fs_tb.querySelector('.action.file');

        let fs_els = {
            date: {
                el: fs_date,
                class: 'date'
            },
            file: {
                el: fs_file,
                class: 'file'
            }
        }

        let fs_csss = [
            ':focus',
            ':focus-within',
            ':hover',
            '.active'
        ];

        let dropdown_w = photosApp.style.fullscreen.dropdown.width;

        let tb_h = photosApp.style.fullscreen.topbar.height;

        let mobile_top_w = photosApp.style.fullscreen.topbar.mobile_w;

        let mobile_max_width = Math.min(photosApp.style.screen.width.current - mobile_top_w, dropdown_w);

        let mobile_h_adj = photosApp.style.screen.height.current * (2.4/ 100);
        let mobile_action_h = photosApp.style.screen.height.current / 9;

        for(let k in fs_els) {
            let d = fs_els[k];

            let name_box =  d.el.querySelector('.action-name').getBoundingClientRect();
            let name_width = name_box.width;

            let dropdown_h = d.el.querySelector('.dropdown').getBoundingClientRect().height;

            let m_translate_y = -mobile_action_h;

            m_translate_y = (-dropdown_h / 2) - (mobile_h_adj);

            let d_translate_x = (dropdown_w - name_width) / -2;

            //first action
            if(d.class === 'date') {
                m_translate_y = Math.max(-(dropdown_h - mobile_action_h), -name_box.bottom);

                d_translate_x = Math.max(d_translate_x, -name_box.left);
            }

            fsDropdownClasses += `
                    `;

            fsMobileDd += `
                        #fullscreen .action.date .dropdown {
                            transform: translate(${(-mobile_max_width)}px, 0px);
                        }
                        
                        #fullscreen .action.file .dropdown {
                            transform: translate(${(-mobile_max_width)}px, ${m_translate_y}px);
                        }
                    `;

            for(let css of fs_csss) {
                fsDropdownClasses += `
                            #fullscreen .action.${d.class}${css} .dropdown {
                            
                            }  
                        `;
            }
        }

        sheet.innerHTML = `
                    #fullscreen .top-bar {
                        transition: opacity ${photosApp.fullscreen.controls.transition}ms;
                    }
                    
                    #fullscreen .is_photo_side {
                        transition: opacity ${photosApp.fullscreen.controls.transition}ms;
                    }
                    
                    #fullscreen .slides-arrow {
                        transition: color ${photosApp.fullscreen.controls.transition}ms, opacity ${photosApp.fullscreen.controls.transition}ms;
                    }
                    
                    #fullscreen .slide {
                        width: ${photosApp.style.screen.width.current}px;
                        height: ${photosApp.style.screen.height.current}px;
                    }
                    
                    #fullscreen.toggle-ip .fullscreen-background {
                        -webkit-transition: transform ${photosApp.fullscreen.zoom.transition_duration}ms ease-in-out;
                        transition: transform ${photosApp.fullscreen.zoom.transition_duration}ms ease-in-out;
                    }
                    
                    #fullscreen.slide-transition .slides-wrapper {
                        transition: transform ${photosApp.fullscreen.slide.transition_duration}ms !important;
                    }
                    
                    #fullscreen .fullscreen-background.animate {
                        -webkit-transition-duration: ${photosApp.fullscreen.default_transition}ms !important;
                        transition-duration: ${photosApp.fullscreen.default_transition}ms !important;
                    }
                    
                    #fullscreen.scale-too-low .slide .fullscreen-background {
                        -webkit-transition-duration: ${photosApp.fullscreen.zoom.scale_low_duration}ms !important;
                        transition-duration: ${photosApp.fullscreen.zoom.scale_low_duration}ms !important;
                    }
                    
                    ${mouse_over_display}
                    
                    ${fsDropdownClasses}
                    
                    @media only screen and (max-width: 801px) {
                        ${fsMobileDd}
                    }
                    
                `;

        document.body.appendChild(sheet);
        photosApp.style.sheets.fullscreenSheet = sheet;
    },
    setSlideshowTransition: function(transition_ms) {
        if(photosApp.style.sheets.transitionSheet) {
            photosApp.style.sheets.transitionSheet.parentNode.removeChild(photosApp.style.sheets.transitionSheet);
            photosApp.style.sheets.transitionSheet = null;
        }

        let style = `
                        #slideshow .item {
                            transition: opacity ${transition_ms}ms ease-in-out;
                        }
                    `;

        let sheet = document.createElement('style');
        sheet.innerHTML = style;

        document.body.appendChild(sheet);
        photosApp.style.sheets.transitionSheet = sheet;
    },
    addStyles: function (el, styles) {
        let style_string = '';

        _.forEach(styles, function (style, property) {
            if(Number.isInteger(style) || isFloat(style)) {
                style += 'px';
            }
            style_string += `${property}: ${style}; `;
        });

        el.setAttribute('style', style_string);

        return el;
    },
    dynamicValue: function (selector) {
        let properties = selector.split('.');
        let value = null;

        let screen_width = photosApp.style.screen.width.current;

        let breakpoints = _.orderBy(Object.keys(photosApp.style.breakpoints), null, ['desc']);

        for (let k in breakpoints) {
            let breakpoint = breakpoints[k];

            if(screen_width <= breakpoint) {
                let obj = photosApp.style.breakpoints[breakpoint];

                if(!obj) {
                    continue;
                }

                for (let i = 0; i < properties.length; i++) {
                    let property = properties[i];
                    if(property in obj) {
                        if(i === properties.length - 1) {
                            value = obj[property];
                            break;
                        } else {
                            obj = obj[property];
                        }
                    } else {
                        break;
                    }
                }
            }
        }

        if(value === null) {
            let obj = photosApp.style;

            for (let i = 0; i < properties.length; i++) {
                let property = properties[i];
                if(property in obj) {
                    if(i === properties.length - 1) {
                        value = obj[property];
                        break;
                    } else {
                        obj = obj[property];
                    }
                } else {
                    break;
                }
            }
        }

        if(value === null) {
            throw "Oops no style";
        }

        return value;
    },
    removeAnimations: function () {
        if(photosApp.app.els.navigation) {
            photosApp.app.els.navigation.style.transition = 'initial';
        }
    },
    restoreAnimations: function () {
        if(photosApp.app.els.navigation) {
            photosApp.app.els.navigation.style.transition = 'transform .3s ease-in-out';
        }
    },
    setLevel3Height: function() {
        let level_2_height = photosApp.style.view.level2.height;
        photosApp.app.els.level3.style.height = level_2_height + 'px';

        let adjustment = 0;

        let header_height = photosApp.style.dynamicValue('navigation.level3.header.height');

        let level_3_height = level_2_height - header_height + adjustment;

        document.getElementById('level-3-content').style.height =  level_3_height + 'px';
    },
    setLevel3TransformHidden: function(close) {
        photosApp.style.setLevel3Height();

        if(close) {
            photosApp.app.els.level3.style.transform = `translateY(${photosApp.style.view.level2.height}px)`;
        } else {
            photosApp.app.els.level3.style.transform = `translateX(${-photosApp.style.screen.width.current}px)`;
        }
    },
    updateBackend: function () {
        axios.put(`${photosApp.backend.host}styles`, {
            screen: photosApp.style.screen
        });
    },
    setHeaderVisible: async function (bool) {
        photosApp.settings.data.style.header = bool;

        let control_key = 'style.header';

        try {
            await photosApp.settings.saveSettings(control_key, bool);
        } catch(e) {
        }
    },
    setControls: async function (bool) {
        photosApp.settings.data.style.controls = bool;

        let control_key = 'style.controls';

        try {
            await photosApp.settings.saveSettings(control_key, bool);
        } catch(e) {
        }
    },
    setFooterVisible: async function (bool) {
        photosApp.settings.data.style.footer = bool;

        if(bool) {
            photosApp.navigation.setScrollingDown(false);
        }

        let control_key = 'style.footer';

        try {
            await photosApp.settings.saveSettings(control_key, bool);
        } catch(e) {
        }
    },
    loadSettings() {
        return new Promise(async (resolve, reject) => {
            if(!photosApp.settings.data.style.controls) {
                photosApp.style.controlsLogic(true);
            }

            if(!photosApp.settings.data.style.header) {
                photosApp.style.headerVisibleLogic(true);
            }

            if(!photosApp.settings.data.style.footer) {
                photosApp.style.footerVisibleLogic(true);
            }

            resolve();
        });
    },
    async headerVisibleLogic(skip_set, manual_bool) {
        if(photosApp.style.header.hide.transition_ip) {
            return false;
        }

        let header_height = photosApp.style.dynamicValue('header.height');

        let header_el = photosApp.app.els.header;

        let time_el = photosApp.app.els.time;

        let visible_class = 'visible';

        let control_el = document.getElementById('header-control');
        let maximize = control_el.querySelector('.icon-maximize');
        let minimize = control_el.querySelector('.icon-minimize');

        let do_hide_header = elHasClass(maximize, visible_class);

        if(typeof manual_bool !== 'undefined') {
            do_hide_header = !manual_bool;
        }

        if(do_hide_header) {
            addClassEl(visible_class, minimize);
            removeClassEl(visible_class, maximize);

            if(!skip_set) {
                photosApp.style.setHeaderVisible(false);
            }
        } else {
            addClassEl(visible_class, maximize);
            removeClassEl(visible_class, minimize);

            if(!skip_set) {
                photosApp.style.setHeaderVisible(true);
            }
        }

        //transition
        //set lock
        photosApp.style.header.hide.transition_ip = true;

        if(!do_hide_header) {
            removeClassEl(photosApp.style.classes.hide_header, photosApp.app.els.app);
            header_el.style.transform = `translateY(-${header_height}px)`;
            await rafAwait();
        }

        //set transition, header
        header_el.style.transition = `transform ${photosApp.style.header.hide.transition_duration}ms`;

        //set transition, time
        time_el.style.transition = `transform ${photosApp.style.header.hide.transition_duration}ms`;

        await rafAwait();
        // await rafAwait();

        let transform_header_y = header_height;

        if(do_hide_header) {
            transform_header_y *= -1;
        }

        //transform header
        if(do_hide_header) {
            header_el.style.transform = `translateY(${transform_header_y}px)`;
        } else {
            header_el.style.transform = `translateY(0px)`;
        }

        //transform time
        time_el.style.transform = `translateY(${transform_header_y}px)`;

        await timeoutAwait(null, photosApp.style.header.hide.transition_duration);

        if(do_hide_header) {
            addClassEl(photosApp.style.classes.hide_header, photosApp.app.els.app);
        }

        //remove transitions, header + time
        header_el.style.removeProperty('transition');
        time_el.style.removeProperty('transition');
        header_el.style.removeProperty('transform');
        time_el.style.removeProperty('transform');

        try {
            await photosApp.style.resizeLogic();
        } catch(e) {
        }

        photosApp.style.forceHideSideButtonsIf();

        //remove lock
        photosApp.style.header.hide.transition_ip = false;
    },
    controlsLogic(skip_set) {
        let control_el = document.getElementById('controls-control');
        let show = control_el.querySelector('.icon-controls');
        let hide = control_el.querySelector('.icon-controls-hidden');

        toggleElClass(show, 'visible');
        toggleElClass(hide, 'visible');

        if(elHasClass(show, 'visible')) {
            removeClassEl(photosApp.style.classes.hide_controls, photosApp.app.els.time);

            if(!skip_set) {
                photosApp.style.setControls(true);
            }
        } else {
            addClassEl(photosApp.style.classes.hide_controls, photosApp.app.els.time);

            if(!skip_set) {
                photosApp.style.setControls(false);
            }
        }
    },
    footerVisibleLogic(skip_set) {
        let visible_class = 'visible';

        let control_el = document.getElementById('footer-control');
        let footer_standard = control_el.querySelector('.icon-footer');
        let footer_hidden = control_el.querySelector('.icon-footer-hidden');

        toggleElClass(footer_standard, visible_class);
        toggleElClass(footer_hidden, visible_class);

        if(elHasClass(footer_standard, visible_class)) {
            removeClassEl(photosApp.style.classes.hide_footer, photosApp.app.els.app);

            if(!skip_set) {
                photosApp.style.setFooterVisible(true);
            }
        } else {
            addClassEl(photosApp.style.classes.hide_footer, photosApp.app.els.app);

            removeClassEl(photosApp.style.classes.show_navigation, photosApp.app.els.app);

            photosApp.navigation.forceShow = false;

            if(!skip_set) {
                photosApp.style.setFooterVisible(false);
            }
        }

        photosApp.style.forceHideSideButtonsIf();
    },
    hideSideButtonTs: [],
    forceHideSideButtonsIf() {
        for(let t of photosApp.style.hideSideButtonTs) {
            clearTimeout(t);
        }

        let force_hide_class = photosApp.style.classes.hide_side_buttons;

        if(!photosApp.settings.data.style.header && !photosApp.settings.data.style.footer) {
            removeClassEl('show', photosApp.app.els.sideButtons);
            addClassEl(photosApp.navigation.scrolling_class, photosApp.app.els.app);
            addClassEl(force_hide_class, photosApp.app.els.app);

            let t = setTimeout(function () {
                removeClassEl(force_hide_class, photosApp.app.els.app);
            }, 3000);

            photosApp.style.hideSideButtonTs.push(t);
        }
    },
    el_center_x: function (el) {
        if(!el) {
            return null;
        }

        let box = el.getBoundingClientRect();

        let center_x = (box.left + box.right) / 2;

        return center_x;
    },
    el_closest_x_els: function (el_from, els) {
        if(!el_from || !els.length) {
            return null;
        }

        let el_from_center_x = photosApp.style.el_center_x(el_from);

        let selected_el = null;
        let least_diff_x = null;

        for(let i = 0; i < els.length; i++) {
            let el = els[i];

            let center_x = photosApp.style.el_center_x(el);

            let diff = Math.abs(el_from_center_x - center_x);

            if(!selected_el || diff < least_diff_x) {
                least_diff_x = diff;
                selected_el = el;
            }
        }

        return selected_el;
    }
};

