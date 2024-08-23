photosApp.grid = {
    life: [],
    parallel: 4,
    maxParallel: 100,
    init: function () {
        return new Promise(async (resolve, reject) => {
            if(photosApp.settings.data.feature.parallel) {
                photosApp.grid.parallel = photosApp.settings.data.feature.parallel;
            }

            photosApp.app.els.featureParallelInput.setAttribute('value', photosApp.grid.parallel);
            photosApp.app.els.featureParallelRange.setAttribute('value', photosApp.grid.parallel);
            photosApp.app.els.featureParallelRange.setAttribute('max', photosApp.grid.maxParallel);

            try {
                await photosApp.grid.setGrid();
            } catch(e) {

            }

            resolve();
        });
    },
    setGrid: function () {
        return new Promise(async (resolve, reject) => {
            try {
                let r = await axios.put(`${photosApp.backend.host}grid`, {
                    params: {
                        width: photosApp.style.screen.width.current,
                        height: photosApp.style.screen.height.current
                    }
                });

                photosApp.grid.life = r.data;
            } catch(e) {

            }

            resolve();
        });
    },
    reset: function () {
        photosApp.grid.life = [];
        console.log("Reset grid");
    },
    setParallel: async function (parallel) {
        photosApp.grid.parallel = parallel;

        try {
            await photosApp.settings.saveSettings('feature.parallel', parallel);
            await photosApp.grid.setGrid();
            await photosApp.app.updateHtml(true, true);
        } catch(e) {
            console.error(e);
        }
    },
    getGridByIndex: function (gridIndex) {
        gridIndex = parseInt(gridIndex);

        let grid;

        let index = 0;

        for(let row = 0; row < photosApp.grid.life.length; row++) {
            for(let col = 0; col < photosApp.grid.life[row].length; col++) {
                if(index === gridIndex) {
                    grid = photosApp.grid.life[row][col];
                    break;
                }

                index++;
            }
        }

        return grid;
    }
};