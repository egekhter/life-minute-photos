photosApp.organize = {
    calendar_instance: null,
    isCalendarOpen: false,
    items: {},
    last_menu: 'date',
    last_date: {
        year: null,
        month: null,
        day: null
    },
    selected: {
        date: {
            gridIndex: null,
        },
        items :null
    },
    tab_classes: {
        date: {
            name: 'date',
            button_text: 'Update',
        },
        delete: {
            name: 'delete',
            button_text: 'Delete',
        }
    },
    onBatchDateSubmit: function () {
        function dateSuccess(data) {
            return new Promise(async (resolve, reject) => {
                for(let item_id in data) {
                    photosApp.items.local.items[item_id] = data[item_id];

                    //update organize html
                    let gi = document.getElementById('gridorganizeitem' + item_id);
                    gi.querySelector('.date.original').innerHTML = data[item_id].master_item_date.substring(0, 10);
                    gi.querySelector('.date.new').innerHTML = '';
                }

                //update main view
                requestAnimationFrame(async function () {
                    try {
                        await photosApp.app.updateHtml(true, false);
                    } catch (e) {
                        console.error(e);
                    }

                    resolve();
                });
            });
        }

        return new Promise(async (resolve, reject) => {
            let data = {};

            for(let item_id in photosApp.organize.selected.items) {
                if(item_id in photosApp.organize.items) {
                    data[item_id] = photosApp.organize.items[item_id];
                }
            }

            try {
                let r = await axios.put(`${photosApp.backend.host}organize/batch/date`, {
                    items: data
                });

                if(r.status === 202) {
                    //update data

                    try {
                        await dateSuccess(r.data);
                    } catch (e) {
                        console.error(e);
                    }
                }
            } catch (e) {
                console.error(e);
            }

            resolve();
        });
    },
    onBatchDeleteConfirm: function(action) {
        return new Promise(async (resolve, reject) => {
            if(action !== 'hide' && action !== 'delete') {
                return reject("Action not supported");
            }

            function deleteSuccess() {
                return new Promise(async (resolve, reject) => {
                    //update data
                    for(let item_id in photosApp.organize.selected.items) {
                        let gi = document.getElementById('gridorganizeitem' + item_id);
                        gi.parentNode.removeChild(gi);
                        delete photosApp.organize.selected.items[item_id];
                    }

                    photosApp.app.hideConfirm();

                    let num_elements = document.getElementById('organize-all').getElementsByClassName('organize__item');

                    if(num_elements.length === 0) {
                        photosApp.app.hideLevel2();
                    } else {
                        await photosApp.view.updateOrganizeGridItemsView(photosApp.organize.selected.date.gridIndex)
                    }

                    photosApp.time.updateOrganizeGridItemsCount();

                    try {
                        await photosApp.app.updateHtml(true, false);
                    } catch (e) {
                    }

                    resolve();
                });
            }

            return new Promise(async (resolve, reject) => {
                try {
                    let r = await axios.put(`${photosApp.backend.host}organize/batch/${action}`, {
                        items: Object.keys(photosApp.organize.selected.items)
                    });

                    if(r.status === 202) {
                        await deleteSuccess();
                    }
                } catch (e) {
                    console.error(e);
                    return reject(e);
                }

                resolve();
            });
        });
    },
    hideCalendarIf: function () {
        if(photosApp.organize.isCalendarOpen) {
            photosApp.organize.calendar_instance.close();
        }
    },
    setSelectedGridIndex: function (gridIndex) {
        photosApp.organize.selected.date.gridIndex = gridIndex;

        photosApp.organize.selected.items = null;
    }
};