let externalFiles = {
    'css': [
        'build/bundle-app.css',
    ]
}

photosApp.init = async function (re_init) {
    devConsole("[js] photosApp.init");

    photosApp.setInit(true);

    if(!re_init) {
        addClassEl(photosApp.db.classes.loading, 'app');
        photosApp.app.ipcRenderer = require('electron').ipcRenderer;

        await loadFiles();

        if(photosApp.dev.resetTables) {
            await photosApp.db.deleteDatabase();
            photosApp.dev.resetTables = false;
            return photosApp.init();
        }

        // tocca({tapThreshold: 150, tapPrecision: 30});

        this.placeholderImg = joinPaths(prepend_url, '/img/vhs.png');
    }

    try {
        await photosApp.debug.init();
        await photosApp.backend.init();
        await photosApp.style.init();
        await photosApp.events.init();

        await photosApp.db.init();
        await photosApp.settings.init();

        await photosApp.time.init();
        await photosApp.style.loadSettings();
        await photosApp.rotate.init();

        await photosApp.db.getBackend();

        await photosApp.cache.init();

        await photosApp.grid.init();

        await photosApp.local.init();

        await photosApp.onboarding.init();

        if(photosApp.dev.skipOnboarding) {
            photosApp.dev.skipOnboardingSteps();
        }

        removeClassEl(photosApp.db.classes.loading, 'app');

        await photosApp.app.init();
    } catch(e) {
        console.error(e);
        photosApp.setInit(false);
        removeClassEl(photosApp.db.classes.loading, 'app');
    }
}


function is_touch_device() {
    var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');

    let mq = function(query) {
        return window.matchMedia(query).matches;
    };

    if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
        return true;
    }

    // include the 'heartz' as a way to have a non matching MQ to help terminate the join
    // https://git.io/vznFH
    let query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');

    return mq(query);
}

function handleBeforeUnload () {
}

function addInitHTML() {
    devConsole("Add html");
    let html_string = `
<div id="app" class="show-dates is_app">
    <div id="record-screen"></div>
    
    <div id="main">
        <header id="header" class="logo">
            <div class="logo__image">
            </div>
            
            <span id="status-message" class="message"></span>
            
            <div id="notifications">
                <span class="notifications-count"></span>
                
                <i class="notification-icon">
                    ${iconNotification()}
                </i>
                
                <div class="notification-container">
                    <div class="notification-header">
                        
                        <i class="exit exit-icon">
                            ${iconClose()}
                        </i>
                        <h3>Notifications</h3>
                    </div>
                    
                    <div class="notifications"></div>
                </div>  
            </div>
        </header>
        
        <div id="side-buttons">
            <div class="background"></div>

            <div id="header-control" class="control">
                <div class="icon icon-maximize visible">${iconMaximize()}</div>
                <div class="icon icon-minimize">${iconMinimize()}</div>
            </div>

            <div id="rotation-control" class="control">
                <div class="icon icon-play visible">${iconRotate()}</div>
                <div class="icon icon-pause">${iconRotatePause()}</div>
            </div>
            
            <div id="controls-control" class="control">
                <div class="icon icon-controls visible">${iconControls()}</div>
                <div class="icon icon-controls-hidden">${iconControlsHidden()}</div>
            </div>
            
            <div id="footer-control" class="control">
                <div class="icon icon-footer visible">${iconFooterControl()}</div>
                <div class="icon icon-footer-hidden">${iconFooterControlHidden()}</div>
            </div>
            
        </div>
        
        <div id="time">
            <div class="spinner">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
            <div id="life" class="display time-period"></div>
            <div id="no-items-time" class="no-items">There are no items to display.</div>
        </div>
        
        <div id="view-level-2">
            <div class="spinner">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
            
            <div id="manage-folders">
                <div class="header-folders">
                    <div id="close-folders">
                        <?xml version="1.0" encoding="UTF-8"?><svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 159.2734 159.1068"><path d="M0,79.4781C.4385,35.7055,34.375.0345,79.663,0c44.9293-.0342,79.6595,35.3436,79.6103,79.6837-.0477,42.9269-33.2233,79.3778-79.5715,79.4231C34.0658,159.1513.4731,123.3769,0,79.4781ZM79.5832,149.5621c38.4113-.0355,69.9465-30.5585,69.9657-69.8228.0187-38.2261-28.9614-69.6797-69.7579-69.7905-40.0373-.1088-69.6985,30.6148-69.9659,69.3267-.2693,38.978,30.8633,70.1086,69.7582,70.2866Z"/><path d="M105.0413,59.5584c-1.2029,1.7639-1.9517,3.2493-3.0491,4.4032-4.4111,4.6385-8.8813,9.224-13.4376,13.7196-1.4575,1.4381-1.4836,2.3732-.0042,3.8262,4.6254,4.5428,9.1292,9.21,13.6528,13.8556,1.5504,1.5922,2.8619,3.3343,1.8879,5.7574-1.3969,3.4754-5.2004,4.2207-8.1283,1.4375-4.7595-4.5243-9.4886-9.09-14.0277-13.8323-1.8061-1.887-2.8109-1.7005-4.5292.0701-4.629,4.7698-9.4694,9.3345-14.2251,13.9813-1.6955,1.6567-3.6848,1.9588-5.7055.8661-1.933-1.0453-2.9246-2.8834-2.3014-5.0307.3705-1.2767,1.3103-2.4913,2.2591-3.4793,4.4343-4.6171,8.9197-9.1873,13.4792-13.6805,1.3713-1.3514,1.4434-2.2761.0386-3.6615-4.3799-4.3193-8.6513-8.7488-12.9508-13.1492-.6949-.7112-1.3594-1.4602-1.9675-2.2463-1.4813-1.9151-1.3707-3.8451.1361-5.682,1.5103-1.8412,3.7464-2.4053,5.7675-.9867,2.2203,1.5583,4.1822,3.5079,6.15,5.3982,3.3573,3.2251,6.6876,6.483,9.9131,9.8388,1.3138,1.3669,2.1811,1.2506,3.4454-.0406,4.3037-4.3953,8.6942-8.7058,13.0702-13.0299,2.9879-2.9524,5.1291-3.7053,7.3803-2.151,1.2334.8516,1.9997,2.3802,3.1464,3.8161Z"/></svg>
                    </div>
                
                    <h2>Manage Folders</h2>

                    <div id="add-folder">Add</div>
                </div>
                
                <div class="folder-list">
                    <div class="container"></div>
                </div>
            </div>
            
            <div id="navigation-level-3" class="navigation-level-3">
                <div id="level-3-header">
                    <div id="level-3-title"></div>
                </div>
                
                <div id="organize-menu" class="organize-menu">
                    <div class="tab date selected br bw1 b--black-90">Date <i class="calendar-icon">${iconCalendar()}</i></div>
                    <div class="tab delete">Delete <i class="trash-icon">${iconTrash()}</i></div>
                </div>
                
                <div id="level-3-content">
                    <div id="organize-all" class="level-3-content"></div>
                </div>
                
                <div id="level-3-footer">
                    <div id="organize-date">
                        <i class="icon-calendar">${iconCalendarAlt()}</i>
                        <input id="organize-date-input" class="date" type="text" readonly="readonly" placeholder="Select Date">
                    </div>
                    
                    <div id="level-3-confirm"></div>
                    <div id="level-3-cancel">Cancel</div>
                </div>
            </div>
        </div>
        
        <div id="navigation-parent">
            <div id="navigation">
                <div id="footer" class="icon-bar">
                    <div class="features">
                        <div class="feature folders">
                            <div class="heading">
                                <div class="name">
                                    <svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 179.3469 139.638"><g id="hFvZzr.tif"><path d="M104.593,109.6948c-17.8004,0-35.6008.0211-53.4011-.0105-7.0297-.0125-13.0411-2.4135-17.3628-8.1419-2.2806-3.023-3.7895-6.4769-3.8036-10.3473-.0704-19.3712-.0851-38.7426-.1158-58.114-.0066-4.1571.0672-8.3155-.0103-12.4711C29.6848,9.1114,38.625.2068,50.388.0769c11.81-.1303,23.6228-.0682,35.434-.0096,5.9289.0294,10.9938,2.2305,15.1574,6.486,2.268,2.3181,4.5929,4.5804,6.8762,6.8837,4.4441,4.4831,9.7807,6.6421,16.1278,6.5909,11.2285-.0907,22.4582-.0374,33.6874-.0208,7.0167.0104,13.0221,2.2803,17.435,7.9823,2.4536,3.1703,3.9905,6.7658,4.0699,10.7676.1617,8.1443.123,16.2929.1395,24.4398.0173,8.5636.0695,17.128-.0153,25.6909-.0998,10.0721-5.6564,17.4153-15.1605,19.9972-2.0533.5578-4.2584.769-6.3948.7762-17.717.0596-35.4343.0338-53.1515.0338ZM104.5317,104.8141c17.7962,0,35.5925.0056,53.3887-.0022,10.2588-.0045,16.6722-6.3111,16.7136-16.6045.0624-15.5438.0547-31.0882.003-46.632-.0346-10.413-6.4362-16.6858-16.8807-16.6908-11.1434-.0054-22.2869-.007-33.4303.0006-7.9391.0054-14.7909-2.561-20.3123-8.4136-2.053-2.1762-4.2346-4.2307-6.3382-6.3598-3.4948-3.537-7.5667-5.3335-12.6911-5.2445-11.2232.1949-22.4522.0535-33.6787.0624-10.3142.0081-16.6848,6.2424-16.711,16.569-.0565,22.2769-.0448,44.5541.0113,66.831.0088,3.5062.6412,6.9368,2.7552,9.9155,3.313,4.668,7.9882,6.5531,13.5323,6.5603,17.8794.0232,35.7588.0086,53.6382.0087Z"/><path d="M19.4969,30.0307v4.6301c-1.5067.3748-3.059.6097-4.4995,1.145-6.7482,2.5078-10.2973,7.4775-10.33,15.1305-.0966,22.6097-.1463,45.2209.0177,67.8298.072,9.9235,6.5826,15.9752,16.5165,15.9778,35.4271.0093,70.8545-.0701,106.2811.0592,8.1421.0297,15.9929-4.3268,16.9841-13.9453.0323-.3134.2339-.6094.4223-1.0765h4.4588c-.5233,7.2082-3.3576,12.7397-9.314,16.5752-3.535,2.2763-7.4638,3.2443-11.5849,3.2488-35.8429.0396-71.6858.0438-107.5287.0094-10.0875-.0097-17.4689-5.5488-20.3346-15.1331-.3738-1.2501-.5302-2.6104-.5315-3.9199-.025-23.9387-.1356-47.8785.0574-71.8157.0752-9.3219,7.6578-17.1659,16.9171-18.351.7377-.0944,1.472-.2164,2.4681-.3642Z"/></g></svg>
                                    <div class="text">
                                        Folders
                                    </div>
                                </div>
                            </div>
                            
                            <div class="wrapper">
                                <div id="feature-manage-folders" class="button">
                                    <span id="manage-folders-count"></span>
                                    Manage
                                </div>
                            </div>
                        </div>
                        
                        <div class="feature timing">
                            <div class="heading">
                                <div class="name">
                                    <svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 179.1094 159.5261"><g id="xZPfA1.tif"><path d="M55.5065,79.7131c-4.2618-3.1203-8.3482-6.0658-12.3846-9.0783-6.2566-4.6693-12.9018-8.9244-18.6234-14.1809-10.1825-9.3548-14.8226-21.3698-14.6663-35.2217.0599-5.3079.0098-10.6171.0098-16.348-2.3028,0-4.4189.0112-6.5349-.0035C1.6022,4.8687-.0304,4.5236.0004,2.4093.0312.2998,1.6889.0079,3.3794.0078,40.7907.0047,78.2019.0071,115.6131,0c1.7169-.0003,3.4124.3256,3.4826,2.3292.0768,2.1933-1.679,2.5689-3.4957,2.558-1.9821-.0118-3.9644-.0027-6.3052-.0027,0,1.2576.0299,2.3098-.0048,3.3599-.2492,7.5471.1802,15.1967-.9236,22.6178-1.8967,12.7517-8.9233,22.6594-19.3053,30.2398-8.3148,6.071-16.5731,12.2193-25.2805,18.6463,6.5936,4.9829,12.969,9.8009,19.4708,14.7145-.5517,1.368-1.0989,2.7249-1.7614,4.3676-7.3492-5.3803-14.615-10.6995-21.9512-16.0703-9.8766,7.2626-19.9958,14.1488-29.4762,21.8238-10.4604,8.4683-15.3864,19.9542-15.5414,33.4215-.0628,5.4602-.0104,10.9218-.0104,16.6298,1.3006,0,2.2781,0,3.2556,0,24.5251,0,49.0521.1528,73.5738-.1359,4.6032-.0542,7.559,1.8281,10.8315,5.0158-1.1673,0-1.9557,0-2.744,0-31.6749,0-63.3497.0023-95.0246-.0057-1.8818-.0005-4.3387.3728-4.354-2.3725-.0161-2.9036,2.5242-2.4702,4.479-2.497,1.65-.0226,3.3006-.0047,5.3132-.0047,0-1.3353-.0317-2.4704.0051-3.6033.2449-7.5437-.2232-15.1994.9215-22.6053,1.9506-12.6199,8.8064-22.531,19.2449-29.9759,7.7781-5.5475,15.4403-11.2575,23.1496-16.9015.7167-.5247,1.4003-1.0947,2.3442-1.836ZM59.5756,76.7799c9.2517-6.766,18.5041-13.3761,27.56-20.245,2.9475-2.2357,5.6732-4.9129,7.9953-7.7949,6.3078-7.8284,9.1995-16.994,9.4637-26.9763.1465-5.537.0263-11.0811.0263-16.7048H14.5102c0,5.6349-.0534,11.1003.0105,16.5643.1611,13.7622,5.3822,25.3283,16.1129,33.8886,9.3319,7.4444,19.2321,14.1767,28.942,21.2682Z"/><path d="M179.1091,114.7589c-.0187,23.9691-18.9111,44.6688-44.8913,44.6834-25.0254.0141-44.6128-20.1094-44.5568-44.9532.0559-24.8108,19.7606-44.3952,44.7003-44.6053,24.654-.2076,44.8323,20.1728,44.7478,44.8751ZM94.486,116.4424c.3725,21.5078,19.9221,39.9318,43.0595,38.0885,21.7425-1.7322,39.2759-21.1812,36.4999-44.7002-2.4375-20.6514-20.9297-36.777-43.0105-34.9684-21.6277,1.7715-37.8368,20.6983-36.5489,41.5802Z"/><path d="M136.7333,112.2365c4.5812,0,8.7264-.0003,12.8716.0003.5811,0,1.3077-.2164,1.7145.0511,1,.6575,1.8529,1.5387,2.7649,2.33-.873.8295-1.7187,2.3406-2.6235,2.3769-5.5532.2225-11.1207.1658-16.6815.0813-1.8993-.0288-2.7227-1.2648-2.7156-3.1568.0261-6.9723.0256-13.9449-.0016-20.9173-.0063-1.6158.5548-3.01,2.208-3.0554,1.8065-.0496,2.4555,1.4049,2.4562,3.0968.0023,5.3954.0047,10.7907.0069,16.1861.0004.8937,0,1.7873,0,3.0069Z"/></g></svg>
                                    <div class="text">
                                        Timing
                                    </div>
                                </div>
                            </div>
                                
                            <div class="wrapper">
                                <div class="slider">
                                    <div class="group">
                                        <input id="feature-time-input" class="input" type="text" value="1">
                                        <div class="description">minutes</div>
                                    </div>
                                    
                                    <input id="feature-time-range" class="range" type="range" value="1" min=".5" max="60" step=".5">
                                </div>
                            </div>
                        </div>
                        
                        <div class="feature parallel">
                            <div class="heading">
                                <div class="name">
                                    <?xml version="1.0" encoding="UTF-8"?><svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 179.4126 139.6323"><g id="VsY8fZ.tif"><path d="M104.4629,109.6872c-17.7181,0-35.4361.0135-53.1542-.0066-6.9286-.0079-12.899-2.2926-17.251-7.8697-2.441-3.1281-4.0121-6.7223-4.026-10.7737-.0655-19.0403-.0788-38.0807-.1072-57.1211-.0066-4.4069.0795-8.8155-.0142-13.2204C29.6628,9.0567,38.7113.0767,50.5491.0533c36.0183-.071,72.0368-.071,108.0551-.0003,11.8421.0233,20.609,8.5745,20.6898,20.3814.1572,22.948.1591,45.8987-.0005,68.8467-.0829,11.9237-8.9045,20.3545-20.9278,20.3916-17.9674.0555-35.9352.0144-53.9028.0145ZM173.4923,61.7995c.3854-.3171.7707-.6343,1.1561-.9514,0-13.5427.3306-27.0962-.1133-40.6243-.3088-9.4087-6.5802-15.2707-15.3979-15.2865-36.3522-.0651-72.7047-.0623-109.0568.0132-5.1449.0107-9.5048,2.0665-12.6063,6.3947-2.2918,3.1983-2.8571,6.8648-2.8647,10.6354-.0379,18.7923-.0174,37.5847-.0175,56.377,0,.8636,0,1.7271,0,2.5907.3809.2519.7617.5039,1.1426.7558.4401-.8092.7233-1.7725,1.3444-2.4039,7.057-7.1742,14.1486-14.3145,21.2668-21.4282,4.2349-4.2322,8.3173-4.2121,12.5848.0149,4.0771,4.0384,8.1224,8.109,12.1799,12.1672,3.8137,3.8144,7.625,7.6312,11.7955,11.8053.7333-.9304,1.2808-1.7861,1.9811-2.49,13.6671-13.7379,27.3473-27.4629,41.0359-41.1794,4.5911-4.6005,8.5244-4.6001,13.1217-.0154,7.0667,7.0475,14.1343,14.0944,21.1519,21.1905.6193.6263.8725,1.6143,1.2958,2.4344ZM78.0826,104.8061c2.0995,0,3.5871,0,5.0746,0,25.1121,0,50.2243.0144,75.3364-.008,8.7518-.0078,14.9901-5.1383,15.7697-13.6892.6013-6.5951.2467-13.2735.453-19.9106.0617-1.9852-.5166-3.3992-1.9432-4.8037-8.2936-8.1657-16.4925-16.4274-24.7256-24.6545-3.2027-3.2004-3.7642-3.1874-7.0296.0717-20.4179,20.3786-40.8384,40.7546-61.2543,61.1352-.4502.4494-.8558.9435-1.6809,1.8591ZM91.3077,84.7883c-8.3175-8.302-16.3636-16.3421-24.4222-24.3697-1.6821-1.6756-3.2116-1.1843-4.7312.3393-8.7999,8.8236-17.6346,17.6127-26.4102,26.4602-.5761.5808-1.093,1.5577-1.0755,2.3377.196,8.7013,6.6738,15.0964,15.4622,15.229,6.48.0978,12.9628.0407,19.444-.0063.771-.0056,1.7786-.139,2.2727-.6242,6.451-6.334,12.8291-12.7422,19.4602-19.3662Z"/><path d="M19.4653,30.0473v4.586c-1.6122.4238-3.2391.717-4.7685,1.2765-7.0187,2.5676-9.9722,8.0437-10.0086,15.0995-.1162,22.529-.1307,45.0595-.003,67.5883.0569,10.0392,6.5327,16.1403,16.6177,16.1424,35.43.0076,70.8603-.0643,106.2899.053,8.2729.0274,15.9451-4.4718,16.914-14.0268.0239-.2354.179-.4574.3338-.8337h4.2689c.5794,7.3224-5.2478,15.817-12.7007,18.1823-2.726.8651-5.6743,1.4391-8.5231,1.4468-35.513.0957-71.0263.0709-106.5396.0575-10.4934-.0039-17.8812-5.4117-20.7629-15.2297-.4133-1.4081-.5508-2.9426-.553-4.419C-.0033,96.5269.018,73.0832,0,49.6395c-.0079-10.3066,8.5395-18.5999,17.6234-19.3412.5618-.0458,1.1187-.1509,1.8419-.2511Z"/><path d="M57.4231,29.9513c-.1037-7.549,5.5713-12.3455,12.2419-12.3147,7.2007.0333,12.1928,5.1548,12.2669,12.3561.0682,6.6361-5.5351,12.416-12.1815,12.2446-6.5563-.169-12.3951-4.6718-12.3273-12.286ZM77.1721,30.2552c.2594-3.9925-2.967-7.5778-7.0663-7.8523-4.0689-.2725-7.5044,2.799-7.8733,7.0392-.3538,4.0661,2.9412,7.7295,7.1749,7.977,4.0313.2357,7.4913-2.9566,7.7647-7.1639Z"/></g></svg>
                                    <div class="text">
                                        Grid Pictures
                                    </div>
                                </div>
                            </div>
                                
                            <div class="wrapper">
                                <div class="slider">
                                    <div class="group">
                                        <input id="feature-parallel-input" class="input" type="text" value="1">
                                        <input id="feature-parallel-range" class="range" type="range" value="1" min="1" max="20" step="1">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="feature chronology reverse">
                            <div class="heading">
                                <div class="name">
                                    <svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 199.1278 149.2438"><path d="M67.0709,109.869v-32.7818c-1.1108,0-2.0809,0-3.0509,0-19.7941,0-39.5881,0-59.3822-.0003-.6653,0-1.481.2392-1.9647-.0584-1.0063-.619-2.41-1.3986-2.615-2.3379-.3774-1.7288,1.1495-2.3347,2.6931-2.4695.5779-.0505,1.1636-.0132,1.7458-.0133,9.897-.0003,19.7941-.0003,29.6911-.0003.9035,0,1.807,0,2.9013,0,.0693-.9011.1723-1.6226.1732-2.3442.0109-9.3091-.0327-18.6185.0435-27.927.0141-1.7178-.47-2.4137-2.2204-2.8354-9.3111-2.2435-15.2292-9.8481-15.2433-19.3197-.0135-9.0755,6.1299-17.0388,15.1782-19.1808,7.3878-1.7489,13.8833.352,18.9791,5.9151,5.6256,6.1414,6.7584,13.2802,3.7104,21.0547-2.4798,6.3253-7.3071,9.8965-13.6961,11.5754-1.2239.3216-2.1132.5586-2.1026,2.163.065,9.8904.0388,19.7814.0535,29.6722.0005.3155.1142.6308.2004,1.0775h64.8039c.0575-.7201.1641-1.4396.165-2.1593.0114-9.3091-.0285-18.6184.041-27.927.0126-1.6814-.3963-2.4367-2.182-2.8658-9.3408-2.2447-15.2465-9.8094-15.2788-19.2892-.031-9.0791,6.0779-17.037,15.1446-19.2036,7.3768-1.7627,13.8862.3116,18.9901,5.8742,5.6281,6.1339,6.7843,13.2684,3.7469,21.0495-2.4702,6.3282-7.2898,9.9068-13.6744,11.6032-1.1993.3186-2.1483.5036-2.1374,2.1324.067,9.9734.045,19.9475.0632,29.9213.0004.2332.1243.4661.2335.8501h77.9729c-.7994-.8028-1.3688-1.4206-1.9856-1.9868-6.3081-5.7909-12.6239-11.5734-18.9373-17.3586-.3677-.3369-.9575-.6217-1.056-1.0253-.2624-1.0752-.7902-2.4813-.3419-3.2464.7772-1.3264,2.2583-1.1872,3.441-.1407,2.4904,2.2036,4.9692,4.4207,7.4295,6.6579,6.2123,5.6489,12.4134,11.3101,18.6154,16.9704,2.5247,2.3042,2.5381,3.1543.0816,5.3909-8.0529,7.3319-16.1081,14.6612-24.168,21.9854-.7992.7262-1.5363,1.7014-2.4858,2.0284-.8621.2969-2.3083.2086-2.8763-.3454-.4958-.4835-.321-1.906-.0727-2.8124.172-.628.9479-1.1104,1.4953-1.613,6.3077-5.7914,12.6161-11.582,18.9486-17.3462.5877-.535,1.3416-.8875,2.0184-1.3247-.1745-.2177-.3491-.4353-.5236-.653h-117.5627v32.5673c12.8667,4.2997,18.9627,12.3782,16.9552,22.7881-2.0361,10.5585-9.8832,16.6563-19.5034,16.6637-9.9417.0077-17.8488-6.4285-19.508-16.6055-1.5003-9.202,3.1282-20.3262,17.0533-22.7693ZM39.6485,34.7879c8.1359-.0284,15.2432-7.1505,14.9834-15.1451-.2905-8.9399-6.9918-14.6176-15.0148-14.8211-8.2506-.2093-15.1024,6.7744-15.0823,14.9753.0201,8.2248,6.8706,15.0196,15.1137,14.9909ZM109.5755,4.7748c-8.2127-.0691-15.0397,6.6552-15.1539,14.926-.1123,8.131,6.757,15.0912,14.9915,15.0769,8.9609-.0156,15.0277-7.0953,14.9995-15.0387-.0281-7.917-6.0321-14.806-14.8371-14.9641ZM69.6149,144.521c8.7783-.141,14.8147-6.9725,14.8707-14.9317.0555-7.9036-5.9767-15.0338-14.9657-15.0734-8.2281-.0362-15.0934,6.888-15.0251,15.0445.0689,8.2359,6.9114,15.0062,15.1201,14.9606Z"/></svg>
                                    <div class="text">
                                        Chronology
                                    </div>
                                </div>
                            </div>
                            
                            <div class="wrapper">
                                <div id="chronology-from-to"></div>
                            
                                <div class="button" id="feature-chronology-swap">
                                    <?xml version="1.0" encoding="UTF-8"?><svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 139.5112 139.3418"><g id="YvyQ9a.tif"><path d="M5.0183,101.2825c-.0634.7915-.1808,1.5828-.1819,2.3744-.01,7.1459.0019,14.2919.0024,21.4379,0,.6643.183,1.4468-.1008,1.9661-.4678.8562-1.2925,2.1896-1.8852,2.1485-.8913-.0619-1.9365-.9879-2.4923-1.827-.4456-.6727-.3419-1.762-.3436-2.6667-.0198-10.0542-.0219-20.1085-.0079-30.1627.0054-3.878.9748-4.811,4.8901-4.8118,9.8953-.0021,19.7906-.0006,29.6859,0,.582,0,1.2962-.2094,1.7207.0506,1.1573.7088,2.9156,1.4733,3.1154,2.478.3478,1.7485-1.4959,2.1578-2.941,2.1709-8.6462.0781-17.293.0856-25.9396.1263-.8778.0041-1.7553.0721-2.6628.1117,0,.4939-.0984.8017.0141.9549,6.8754,9.3648,13.3752,19.04,22.9345,26.0736,9.6638,7.1104,20.4316,11.1643,32.342,12.4395,10.8817,1.1651,21.4195-.0153,31.4164-4.5275,20.0455-9.0478,32.8431-24.2268,38.1041-45.6444.1386-.5643.3168-1.1188.4681-1.6801.4599-1.7056,1.5229-2.5976,3.3033-2.1428,1.7685.4518,1.6311,1.923,1.3564,3.2483-1.7153,8.2743-4.6398,16.0967-9.2129,23.2233-7.5792,11.8111-17.548,20.9571-30.4785,26.6767-12.3857,5.4785-25.3332,7.1715-38.709,5.3215-14.594-2.0185-27.372-8.1514-37.8499-18.4139-5.3065-5.1974-9.6392-11.3876-14.4092-17.1315-.5179-.6236-1.0155-1.264-1.5226-1.8966-.2054.0343-.4108.0686-.6161.1029Z"/><path d="M134.646,38.6049c.0512-.8909.1419-1.7495.1432-2.6082.0104-6.8976.0024-13.7953.0047-20.693.0002-.7474-.016-1.4993.0559-2.2413.1498-1.5456.8159-3.0659,2.5101-2.6708.8834.206,2.0393,1.8049,2.0521,2.7879.1448,11.134.0836,22.2707.0993,33.4065.003,2.168-1.3346,3.0166-3.1769,3.0263-11.0606.0578-22.1216.0531-33.1823.0098-1.4659-.0057-3.0181-.4881-2.9961-2.3006.0254-2.0791,1.7598-2.4599,3.3902-2.4715,7.4845-.0534,14.9695-.0265,22.4544-.0283,1.8031-.0004,3.6063,0,5.6661,0-.2031-.6985-.2146-1.1316-.4274-1.4125-5.6618-7.4714-10.7075-15.4518-17.8132-21.7381-10.8402-9.5902-23.3324-15.2493-37.8925-16.4093-23.5251-1.8743-42.3207,6.8617-56.9841,24.9656-5.9933,7.3995-9.9043,15.8701-11.8818,25.2075-.1371.6472-.3402,1.285-.5659,1.9079-.5465,1.5087-1.5294,2.3839-3.2291,1.9435-1.8301-.4742-1.5825-1.894-1.3162-3.2233,3.0377-15.1669,10.4138-27.8491,21.9458-38.1349C34.2158,8.3722,46.8019,2.6112,60.9158.6379c12.4832-1.7454,24.6375.1325,36.3112,5.1262,13.9069,5.949,24.4234,15.7749,32.9521,27.9991,1.1354,1.6274,2.4217,3.1501,3.6563,4.707.0738.0931.3094.058.8105.1348Z"/></g></svg>
                                    Switch
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div id="test_font_size" class="test-description"></div>
    </div>
    
    <div id="confirm-action">
        <div class="spinner">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
        
        <div id="confirm-action-container">
            <div class="title"></div>
            <div id="confirm-message"></div>
            <div class="action-block">
                <div id="confirm-yes">Confirm</div>
                <div id="confirm-no">No</div>
            </div>
        </div>
        <div id="confirm-action-backdrop"></div>
    </div>
    
    <div id="image-transition"></div>

    <div id="slideshow">
        <div id="slideshow-spinner" class="spinner lds-ring">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
        
        <div class="items">
            
        </div>
    
        <div class="slideshow-controls">
            <div class="icons">
                <i class="control element prev-item">
                    ${iconArrowLeft()}
                </i>
            
                <div class="element play-pause">
                    <i class="control play">
                        ${iconPlay()}
                    </i>
                    <i class="control pause active">
                        ${iconPause()}
                    </i>
                </div>
                
                <i class="control element next-item">
                    ${iconArrowRight()}
                </i>
                
                <div class="control element separator"></div>
                
                <i class="control element exit">
                    ${iconX()}
                </i>            
            </div>
        </div>
    </div>

    <div id="fullscreen">
        <div id="fullscreen-spinner" class="spinner lds-ring">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>

        <div class="top-bar">
            <div class="exit">
                <i>
                    ${iconCloseTransparent()}
                </i>
            </div>
                
            <div class="item-actions">
                <div class="action date" tabindex="-1">
                    <div class="action-icon">
                        <i class="calendar-icon">
                            ${iconCalendar()}
                        </i>
                    </div>
                
                    <div class="action-name"></div>
                    
                    <div class="dropdown">
                        <div class="dropdown-container">
                            <div class="date-row dates">
                                <div class="date-year date-group">
                                    <label>Year</label>
                                    <input type="number">
    
                                    <div class="arrow-group">
                                        <div class="arrow arrow-up">
                                            ${iconArrowUp()}
                                        </div>
                                        <div class="arrow arrow-down">
                                            ${iconArrowDown()}
                                        </div>
                                    </div>
                                </div>
    
                                <div class="date-month date-group">
                                    <label>Month</label>
                                    <input type="number">
    
                                    <div class="arrow-group">
                                        <div class="arrow arrow-up">
                                            ${iconArrowUp()}
                                        </div>
                                        <div class="arrow arrow-down">
                                            ${iconArrowDown()}
                                        </div>
                                    </div>
                                </div>
    
                                <div class="date-day date-group">
                                    <label>Day</label>
                                    <input type="number">
    
                                    <div class="arrow-group">
                                        <div class="arrow arrow-up">
                                            ${iconArrowUp()}
                                        </div>
                                        
                                        <div class="arrow arrow-down">
                                            ${iconArrowDown()}
                                        </div>
                                    </div>
                                </div>
                            </div>
    
                            <div class="date-row times">
                                <div class="date-hour date-group">
    
                                    <label>Hour</label>
                                    <input type="number">
                                    <div class="pm"></div>

                                    <div class="arrow-group">
                                        <div class="arrow arrow-up">
                                            ${iconArrowUp()}
                                        </div>
                                        
                                        <div class="arrow arrow-down">
                                            ${iconArrowDown()}
                                        </div>
                                    </div>
                                </div>
    
                                <div class="date-minute date-group">
                                    <label>Minute</label>
                                    <input type="number">
    
                                    <div class="arrow-group">
                                        <div class="arrow arrow-up">
                                            ${iconArrowUp()}
                                        </div>
                                        
                                        <div class="arrow arrow-down">
                                            ${iconArrowDown()}
                                        </div>
                                    </div>
                                </div>
    
                                <div class="date-second date-group">
                                    <label>Second</label>

                                    <input type="number">
    
                                    <div class="arrow-group">
                                        <div class="arrow arrow-up">
                                            ${iconArrowUp()}
                                        </div>
                                        
                                        <div class="arrow arrow-down">
                                            ${iconArrowDown()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div >
                
                <div class="action file">
                    <div class="action-icon">
                        <i class="icon-file">
                            ${iconFile()}
                        </i>
                    </div>
                    
                    <div class="action-name">File Info</div>
                    
                    <div class="dropdown">
                        <div class="dropdown-container">
                            <div class="info name">
                                <div class="field">Name</div>
                                <div class="value"></div>
                            </div>
                            
                            <div class="info resolution">
                                <div class="field">Resolution</div>
                                <div class="value"></div>
                            </div>
                            
                            <div class="info size">
                                <div class="field">Size</div>
                                <div class="value"></div>
                            </div>
                        </div>
                    </div>
                </div tabindex="-1">
                
                <div class="action slideshow">
                    <div class="action-icon">
                        <i class="slideshow-icon">
                            ${iconSlideshow()}
                        </i>
                    </div>
                    <div class="action-name">Slideshow</div>
                </div tabindex="-1">
                
                <div class="action locate">
                    <div class="action-icon">
                        <i class="locate-icon">
                            ${iconLocate()}
                        </i>
                    </div>
                    <div class="action-name">Locate</div>
                </div>
                
                <div class="action delete">
                    <div class="action-icon">
                        <i class="icon-trash">
                            ${iconTrash()}
                        </i>
                    </div>
                    <div class="action-name">
                        Delete
                    </div>
                </div>
            </div>
        </div>
        
        <div class="slide-arrows">
            <div id="slide-prev" class="slides-arrow slide-prev">
                <i>
                    ${iconLeft()}
                </i>
            </div>
            <div id="slide-next" class="slides-arrow slide-next">
                <i>
                    ${iconRight()}
                </i>
            </div>
        </div>
        
        <div class="slides-container" id="slides">
            <div class="slides-wrapper"></div>
        </div>
    </div>
    
    <div id="film-overlay"></div>
    
    <div id="spinner-default">
        <div class="spinner">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
    </div>
    
    <div id="placeholder-html" style="display: none !important;"></div>
</div>
`;

    document.body.insertAdjacentHTML("beforeend", html_string);
}

async function loadFiles() {
    return new Promise(async (resolve, reject) => {
        devConsole("Load files");

        function downloadCSS(host) {
            devConsole("Download css");

            return new Promise(async (resolve, reject) => {
                let css_load = 0;

                function CSSDone() {
                    css_load++;

                    if(css_load === externalFiles.css.length) {
                        requestAnimationFrame(function () {
                            resolve();
                        });
                    }
                }

                // add all stylesheets

                for (let i = 0; i < externalFiles.css.length; i++) {
                    let css_link = joinPaths(host, `${externalFiles['css'][i]}`);

                    css_link += '?v' + current_time;

                    try {
                        let src = await axios.get(css_link, {
                            headers: {
                                'Content-Type': 'text/css',
                            }
                        });

                        let link = document.createElement('link');
                        link.setAttribute("rel", "stylesheet");
                        link.setAttribute("type", "text/css");
                        link.onload = function(){ CSSDone(); }
                        link.setAttribute("href", css_link);
                        document.getElementsByTagName("head")[0].appendChild(link);
                    } catch (e) {
                        console.error(e);
                        return reject(e);
                    }
                }
            });
        }

        try {
            await downloadCSS(prepend_url);
        } catch (e) {
        }

        return resolve();
    });
}

function preInit() {
    devConsole("Pre init");

    window['click_handler'] = 'click';

    if(is_touch_device()) {
        // window['click_handler'] = 'tap';
        // addClassEl('is_touch', 'app');
    }

    let app_classes = ['is_mac', 'is_windows'];

    for(let i = 0; i < app_classes.length; i++) {
        if(window[app_classes[i]]) {
            addClassEl(app_classes[i], 'app');
        }
    }

    // add timestamp to local requests to bust cache
    // window.axios.interceptors.request.use(function (request) {
    //     if(request.url.indexOf('/localhost:') > -1) {
    //         if(request.url.indexOf('?') > -1) {
    //             request.url += `&ts=${timeNow(true)}`
    //         } else {
    //             request.url += `?ts=${timeNow(true)}`;
    //         }
    //     }
    //
    //     return request;
    // });

    photosApp.init();

}


(async function () {
    addInitHTML();
    preInit();
})();