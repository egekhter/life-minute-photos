module.exports = {
    minWidth: 80,
    createGrid: function () {
        return new Promise(async (resolve, reject) => {
            let items = [];
            //fit on one screen
            //even distribution
            let _grid = [];

            try {
                items = await cacheL.getItems(settingsL.data.feature.chronology);
            } catch(e) {
                console.error(e);
            }

            if(!items) {
                console.error("no items for grid");
                return resolve(_grid);
            }

            if (!items.length) {
                return resolve(_grid);
            }

            let items_split = chunkArray(items, settingsL.data.feature.parallel);

            let row_range = 10;
            let rowOptions = {};

            // step 1 - create matrix of possible row/column combinations
            for (let r = 1; r <= row_range; r++) {
                let row_index = 0;
                let rows = [];

                for (let r2 = 0; r2 < r; r2++) {
                    rows.push(0);
                }

                let cols_used = 0;

                while (items_split.length > cols_used) {
                    if (row_index >= rows.length) {
                        row_index = 0;
                    }

                    rows[row_index] += 1;
                    cols_used++;
                    row_index++;
                }

                rowOptions[`rows-${r}`] = {
                    colsPerRow: rows,
                    height: 0,
                    minColWidth: null
                };
            }

            // step 2 - calculate needed height for each combo
            for (let key in rowOptions) {
                let data = rowOptions[key];

                for (let k2 in data.colsPerRow) {
                    let cols = data.colsPerRow[k2];
                    let total_borders = (cols - 1) * viewsL.border.cols;

                    let width = (screenWidth - total_borders) / cols;
                    let height = width;

                    rowOptions[key].height += height;

                    if (width < rowOptions[key].minColWidth || rowOptions[key].minColWidth === null) {
                        rowOptions[key].minColWidth = width;
                    }
                }
            }

            // step 3 - choose option based on fitting height on screen
            let valid_options = {};

            for (let key in rowOptions) {
                let rowOption = rowOptions[key];

                let percent_of_screen = rowOption.height / screenHeight;
                let col_height_screen = rowOption.minColWidth / screenHeight;

                let percent_screen_threshold = (1 + (col_height_screen));

                //prevent row with 1 col on multiple consecutive rows
                let one_col_count = 0;

                for(let c of rowOption.colsPerRow) {
                    if(c === 1) {
                        one_col_count++;
                    }
                }

                //try to fit all dates for time period on one screen, allowing for partial of last row
                if(percent_of_screen > percent_screen_threshold || items.length === 2 && Object.keys(valid_options).length && rowOption.colsPerRow.length > 1 || one_col_count > 1) {
                    continue;
                }

                let percent_diff = Math.abs(1 - percent_of_screen);

                if (rowOption.minColWidth >= gridL.minWidth && percent_diff < 1) {
                    rowOption.percent_of_screen = percent_of_screen;
                    rowOption.percent_diff = percent_diff;
                    valid_options[key] = rowOption;
                }
            }

            let rows_choice = _.orderBy(valid_options, 'percent_diff', 'asc')[0];

            if (!rows_choice) {
                rows_choice = _.orderBy(rowOptions, 'percent_diff', 'asc')[0];
            }

            let items_group_index = 0;

            for(let cols of rows_choice.colsPerRow) {
                let rows = [];

                for (let i = 0; i < cols; i++) {
                    let items_group = items_split[items_group_index];

                    let earliest = null;
                    let latest = null;

                    for(let item of items_group) {
                        let date = getMasterDate(item);

                        if(!earliest || date < earliest) {
                            earliest = date;
                        }

                        if(!latest || date > latest) {
                            latest = date;
                        }
                    }

                    rows.push({
                        count: items_group.length,
                        earliest: earliest,
                        latest: latest
                    });

                    items_group_index++;
                }

                _grid.push(rows);
            }

            return resolve(_grid);
        });
    },
    getLife: function () {
        return new Promise(async (resolve, reject) => {
            try {
                let grid = await gridL.createGrid();

                resolve(grid);
            } catch(e) {
                console.error(e);
                return reject();
            }
        });

    },
    selected: {
        organize: {}
    },
    resetData: function () {
        module.exports.life = {};
        module.exports.selected.organize = {};
    }
};