photosApp.time = {
    names: [
        'life'
    ],
    minutes: 1,
    chronology: "desc",
    divs: 2,
    intervalLoop: [],
    intervals: {
        minimum: 5000,
        transition: 2000,
        addRandom: {
            min: 0,
            max: 1000
        }
    },
    saveInterval: 20, //sec,
    init: function () {
        return new Promise(async (resolve, reject) => {
            try {
                 await photosApp.time.loadIntervalLoops();
            } catch(e) {

            }

            photosApp.time.startSaveInterval();

            if(photosApp.settings.data.feature.minutes) {
                photosApp.time.minutes = photosApp.settings.data.feature.minutes;
            }

            photosApp.app.els.featureTimeInput.setAttribute('value', photosApp.time.minutes);
            photosApp.app.els.featureTimeRange.setAttribute('value', photosApp.time.minutes);

            if(photosApp.settings.data.feature.chronology) {
                photosApp.time.chronology = photosApp.settings.data.feature.chronology;
            }

            photosApp.time.updateChronologyFromTo();

            resolve();
        });
    },
    setMinutes: function (minutes) {
        photosApp.time.minutes = minutes;
        photosApp.settings.saveSettings('feature.minutes', minutes);
    },
    swapChronology: async function () {
        if(photosApp.time.chronology === 'desc') {
            photosApp.time.chronology = 'asc';
        } else {
            photosApp.time.chronology = 'desc';
        }

        try {
            await photosApp.settings.saveSettings('feature.chronology', photosApp.time.chronology);
        } catch(e) {

        }

        try {
            await photosApp.app.saveInterval();
        } catch(e) {

        }

        try {
            await photosApp.app.updateHtml(true, true, true);
        } catch (e) {
        }

        photosApp.time.updateChronologyFromTo();

    },
    startSaveInterval: function () {
        setInterval(function () {
            photosApp.app.saveInterval();
        }, photosApp.time.saveInterval * 1000);
    },
    getYearOfDate(date) {
        return date.substr(0, 4);
    },
    loadIntervalLoops: async function () {
        let r = await axios.get(`${photosApp.backend.host}interval/loops`);

        if(r.data) {
            photosApp.time.intervalLoop = r.data;
        }
    },
    getCount: function(gridIndex) {
        return new Promise(async(resolve, reject) => {
            let r = await axios.put(`${photosApp.backend.host}time/count`, {
                gridIndex: gridIndex
            });

            return resolve(r.data.count);
        });
    },
    updateOrganizeGridItemsCount: function () {
        let selected_text = `${Object.keys(photosApp.organize.selected.items).length} <br>Selected`;

        let l3title = document.getElementById('level-3-title');

        if(l3title.querySelector('.total-selected')) {
            l3title.querySelector('.total-selected').innerHTML = selected_text;
        } else {
            l3title.innerHTML += `<div class="total-selected">${selected_text}</div>`
        }
    },
    isValidYear: function (year) {
        try {
            year = Number.parseInt(year);
            if(year < 0) {
                return false;
            }

        } catch (e) {
            return false;
        }

        return true;
    },
    isValidMonth: function (month) {
        try {
            month = Number.parseInt(month);
            if(month < 1 || month > 12) {
                return false;
            }
        } catch (e) {
            return false;
        }

        return true;
    },
    isValidDay: function (year, month, day) {
        let days_in_month = moment(`${year}-${month}`, "YYYY-MM").daysInMonth();

        return day > 0 && day <= days_in_month;
    },
    isValidHour: function (value) {
        return value >= 0 && value < 24;
    },
    isValidMinute: function (value) {
        return value >= 0 && value < 60;
    },
    isValidSecond: function (value) {
        return value >= 0 && value < 60;
    },
    updateChronologyFromTo: function () {
        if(photosApp.time.chronology === 'desc') {
            addClassEl('reverse', document.querySelector('.feature.chronology'));
        } else {
            removeClassEl('reverse', document.querySelector('.feature.chronology'));
        }

        let earliest_year = null;

        let latest_year = null;

        for(let k in photosApp.items.local.items) {
            let item = photosApp.items.local.items[k];

            if(item.deleted) {
                continue;
            }
            
            let date = getMasterDate(item);
            
            if(!date) {
                continue;
            }
            
            let year = photosApp.time.getYearOfDate(date);
            
            if(!year) {
                continue;
            }
            
            year = parseInt(year);
            
            if(earliest_year === null || year < earliest_year) {
                earliest_year = year;
            }
            
            if(latest_year === null || year > latest_year) {
                latest_year = year;
            }
        }
        
        if(!earliest_year && !latest_year) {
            return;
        }
        
        if(earliest_year === latest_year) {
            document.getElementById('chronology-from-to').innerHTML = earliest_year;
        } else {
            let from_to = ``;

            if(photosApp.time.chronology === 'desc') {
                from_to = `${latest_year} - ${earliest_year}`;
            } else {
                from_to = `${earliest_year} - ${latest_year}`;
            }

            document.getElementById('chronology-from-to').innerHTML = from_to;
        }
    }
};