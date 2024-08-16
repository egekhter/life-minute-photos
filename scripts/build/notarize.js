const { notarize } = require('@electron/notarize');
loadEnv();

module.exports = {
    notarize: function (appName, appPath) {
        return new Promise(async (resolve, reject) => {
            console.log({
                notarizing: appPath
            });

            try {
                await notarize({
                    appPath: appPath,
                    appleId: process.env.APPLE_ID,
                    appleIdPassword: process.env.APPLE_PASSWORD,
                    teamId: process.env.APPLE_TEAM_ID,
                });
            } catch (e) {
                console.error(e);
                return reject(e);
            }

            resolve();
        });

    }
};