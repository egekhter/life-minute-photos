(async function f() {
    //windows
    let windows = require('./windows');

    try {
        await windows.build();
    } catch (e) {
        console.error(e);
        process.exit();
    }

    //mac
    let mac = require('./mac');

    try {
        await mac.build();
    } catch (e) {
        console.error(e);
        process.exit();
    }

    process.exit();

})();