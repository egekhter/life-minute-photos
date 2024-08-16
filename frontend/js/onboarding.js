photosApp.onboarding = {
    init_called: false,
    ip: false,
    el: null,
    selected_folders: {
        default: null,
        custom: {}
    },
    walkthrough: {
        openModal: function () {
            devConsole("Open modal called");

            function reveal() {
                // addClassEl('reveal', photosApp.onboarding.el.querySelector('.walkthrough'));
            }

            addClassEl('onboarding', 'app');

            addClassEl('show', photosApp.onboarding.el.querySelector('.walkthrough'));

            reveal();

            let screens = photosApp.onboarding.el.getElementsByClassName('screen');
            addClassEl('active', screens[0]);
        }
    },
    isFinished: function () {
        //show navigation
        addClassEl('active', 'navigation');

        //remove onboarding
        removeClassEl('onboarding', 'app');

        photosApp.onboarding.ip = false;
    },
    init: function () {
        photosApp.initLastStep = 'onboarding';

        photosApp.onboarding.ip = true;

        return new Promise(async (resolve, reject) => {
            if(photosApp.onboarding.init_called) {
                return resolve();
            }

            photosApp.onboarding.init_called = true;

            if(photosApp.dev.skipOnboarding) {
                removeClassEl('onboarding', 'app');
                photosApp.onboarding.ip = false;
                return resolve();
            }

            try {
                await photosApp.app.getOnboarded();
            } catch(e) {

            }

            // do not show onboarding if onboarding already complete
            if(photosApp.is_onboarded) {
                photosApp.onboarding.isFinished();
                return resolve();
            }

            try {
                await photosApp.app.init();
            } catch (e) {
                console.error(e);
            }

            addOnboardingHTML();

            document.getElementById('finish-onboarding').addEventListener(click_handler, function (e) {
                e.preventDefault();
                e.stopPropagation();
                photosApp.onboarding.finish_logic();
            });

            let folder_default_btn = photosApp.onboarding.el.querySelector('.access-location').querySelector('.buttons').querySelector('.default');
            let folder_custom_btn = photosApp.onboarding.el.querySelector('.access-location').querySelector('.buttons').querySelector('.custom');

            folder_default_btn.addEventListener(click_handler, async function (e) {
                e.preventDefault();
                e.stopPropagation();

                if(this.classList.contains('active')) {
                    removeClassEl('active', this);
                    photosApp.onboarding.selected_folders.default = null;
                } else {
                    addClassEl('active', this);
                    photosApp.onboarding.selected_folders.default = await photosApp.local.getDefaultFolders();
                }

                updateFoldersList();
            });

            folder_custom_btn.addEventListener(click_handler, async function (e) {
                e.preventDefault();
                e.stopPropagation();

                const remote = require('@electron/remote');

                const { dialog } = remote;

                let openDialog = dialog.showOpenDialog({
                    properties: ['openDirectory', 'multiSelections', 'createDirectory']
                });

                openDialog.then(function (data) {
                    let dirs = data.filePaths;

                    let is_new = true;

                    if(dirs.length) {
                        for(let d of dirs) {
                            if(d === photosApp.onboarding.selected_folders.default || (d in photosApp.onboarding.selected_folders.custom)) {
                                is_new = false;
                            }

                            photosApp.onboarding.selected_folders.custom[d] = d;
                        }

                        if(is_new) {
                            addClassEl('active', folder_custom_btn);
                        }

                        updateFoldersList();
                    }
                });
            });

            requestAnimationFrame(function () {
                removeClassEl('first-load', photosApp.onboarding.el.querySelector('.first-load'));
            });

            try {
                photosApp.onboarding.selected_folders.default = await photosApp.local.getDefaultFolders();
                updateFoldersList();
            } catch (e) {
            }

            photosApp.onboarding.walkthrough.openModal();

            removeClassEl(photosApp.db.classes.loading, 'app');

            photosApp.app.removeLoadingScreen();

        });
    },
    finish_logic: async function () {
        let data = updateFoldersList();
        let folders = [];

        for(let k in data) {
            let v = data[k];
            folders.push(v);
        }

        if(folders.length) {
            photosApp.local.addFolders(folders);
        }

        photosApp.app.setOnboarded();
    },
};

function addOnboardingHTML() {
    let onboarding_html = `
<div id="onboarding">
    <div class='walkthrough show reveal first-load'>
      <div class='walkthrough-body'>
        <ul class='screens animate'>
            <li class='screen access-location active'>
            <!--      access desktop location-->
                <div class='media access-desktop-location'>
                  <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="folders" class="folders svg-inline--fa fa-folders fa-w-20" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path fill="currentColor" d="M96 336V128H48c-26.51 0-48 21.49-48 48v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48v-48H176c-44.11 0-80-35.89-80-80zM592 64H400L336 0H176c-26.51 0-48 21.49-48 48v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48z"></path></svg>
                    <defs>
                        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style="stop-color:#22BDFF;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#1DAEEC;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    <path d="M48 32C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48H48zm0 32h106c3.3 0 6 2.7 6 6v20c0 3.3-2.7 6-6 6H38c-3.3 0-6-2.7-6-6V80c0-8.8 7.2-16 16-16zm426 96H38c-3.3 0-6-2.7-6-6v-36c0-3.3 2.7-6 6-6h138l30.2-45.3c1.1-1.7 3-2.7 5-2.7H464c8.8 0 16 7.2 16 16v74c0 3.3-2.7 6-6 6zM256 424c-66.2 0-120-53.8-120-120s53.8-120 120-120 120 53.8 120 120-53.8 120-120 120zm0-208c-48.5 0-88 39.5-88 88s39.5 88 88 88 88-39.5 88-88-39.5-88-88-88zm-48 104c-8.8 0-16-7.2-16-16 0-35.3 28.7-64 64-64 8.8 0 16 7.2 16 16s-7.2 16-16 16c-17.6 0-32 14.4-32 32 0 8.8-7.2 16-16 16z">
                    </path>
                  </svg>
                </div>
                <h3>
                  Select photo folders
                </h3>
                <div class="buttons">
                    <div class="button default active">Default</div>
                    <div class="button custom">Custom</div>
                </div>
                <div class="selected-folders"></div>
            </li>
        </ul>
      </div>
      
      <div class='walkthrough-footer'>
        <button id="finish-onboarding" class='button yes'>Finish</button>
      </div>
    </div>
</div>
`;
    document.getElementById('app').insertAdjacentHTML("beforeend", onboarding_html);

    photosApp.onboarding.el = document.getElementById('onboarding');
}

function updateFoldersList() {
    let folders_el = photosApp.onboarding.el.querySelector('.access-location').querySelector('.selected-folders');
    folders_el.innerHTML = '';

    //combine default, custom
    let folders = {};

    if(photosApp.onboarding.selected_folders.default) {
        folders[photosApp.onboarding.selected_folders.default] = photosApp.onboarding.selected_folders.default;
    }

    if(photosApp.onboarding.selected_folders.custom) {
        for(let k in photosApp.onboarding.selected_folders.custom) {
            let v = photosApp.onboarding.selected_folders.custom[k];
            folders[v] = v;
        }
    }

    if(!Object.keys(folders).length) {
        return folders;
    }

    let frag = document.createDocumentFragment();

    for(let k in folders) {
        let folder = folders[k];

        let el = createEl('div', null, 'folder');
        el.innerHTML = folder;
        frag.appendChild(el);
    }

    folders_el.appendChild(frag);

    return folders;
}

