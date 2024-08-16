photosApp.dev = {
    enabled: true,
    showConsole: false,
    performance: true,
    debugger: false,
    // resetTables: false,
    // resetTables: true,
    // skipOnboarding: true,
    // skipDebug: true,
    skipOnboardingSteps: async function () {
        try {
            await photosApp.app.setOnboarded();
        } catch (e) {
        }

        devConsole("Setting access photos");

        photosApp.app.removeLoadingScreen();
    }
};