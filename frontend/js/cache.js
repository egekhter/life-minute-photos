photosApp.cache = {
    itemIds: [],
    init: function () {
        return new Promise(async (resolve, reject) => {
            try {
                await axios.get(`${photosApp.backend.host}cache`);
            } catch(e) {

            }

            resolve();
        });
    }
}