module.exports = async function(app){
    app.get('/version', async function (req,res) {
        res.status(200);

        res.send({
            version: appL.version
        });
    });

    app.get('/cache', async function (req,res) {
        debugL.log('db');

        try {
            await cacheL.init();
        } catch (e) {
            debugL.error(e);
            res.status(400);
            return res.send();
        }

        res.send();
    });

    app.get('/db', async function (req,res) {
        debugL.log('db');

        try {
            await dbL.init();
        } catch (e) {
            debugL.error(e);
            res.status(400);
            return res.send();
        }

        res.send();
    });

    app.post('/onboarded', async function (req, res) {
        try {
            appL.setOnboarded(true);
            res.status(202);
            res.send();
        } catch (e) {
            res.status(400);
            res.send();
        }
    });

    app.get('/onboarded', async function (req, res) {
        try {
            let onboarded = await appL.getOnboarded();
            res.status(202);
            res.send(onboarded);
        } catch (e) {
            res.status(400);
            res.send();
        }
    });

    app.put('/app/init', async function (req,res) {
        debugL.log('app init');

        try {
            await appL.init();
        } catch (e) {
            debugL.error(e);
            res.status(400);
            return res.send();
        }

        res.send();
    });

    app.get('/items', async function (req,res) {
        debugL.log('get items');

        try {
            // console.time('local items');
            await itemsL.getItems();
            // console.timeEnd('local items');
        } catch (e) {
            debugL.error(e);
            res.status(400);
            return res.send();
        }

        res.send(itemsL.data);
    });

    app.put('/items/:id', async function (req,res) {
        debugL.log('update items');

        let msg = '';

        try {
            await itemsL.updateItem(req.params.id, req.body);
            res.status(202);
        } catch (e) {
            res.status(400);
            msg = e;
        }

        res.send(msg);
    });

    app.get('/variants', async function (req,res) {
        try {
            await itemsL.getVariants();
        } catch (e) {
            debugL.error(e);
            res.status(400);
            return res.send();
        }

        res.send(itemsL.variants);
    });

    app.get('/folders/items', async function (req, res) {
        debugL.log("get folders items");
        let msg = null;

        try {
            msg = await filesL.getFoldersItems();
            res.status(200);
        } catch (e) {
            msg = e;
            res.status(403);
        }

        res.send(msg);
    });

    app.get('/folders', async function (req, res) {
        let data;
        res.status(200);

        try {
            data = await filesL.getFolders();
        } catch (e) {
        }

        res.send(data);
    });

    app.post('/folders', async function (req, res) {
        try {
            await filesL.setFolders(req.body.dirs);
            res.status(201);
            res.send("Set");
        } catch(e) {
            res.status(400);
            res.send();
        }
    });

    app.post('/folders/default', async function (req, res) {
        try {
            let folders = await filesL.setDefaultFolder();

            res.status(201);
            res.send(folders);
        } catch(e) {
            res.status(400);
            res.send();
        }
    });

    app.put('/save/interval', async function (req, res) {
        try {
            dbL.saveIntervalLoops(req.body.intervalLoop);
            res.status(202);
            res.send();
        } catch (e) {
            res.status(400);
            res.send();
        }
    });

    app.put('/flush/items', async function (req,res) {
        debugL.log('items flush');

        try {
            await itemsL.flushProcessing();
            res.status(202);
            res.send();
        } catch (e) {
            res.status(400);
            res.send(e);
        }
    });

    app.post('/image/fullscreen', async function (req,res) {
        try {
            debugL.log("fullscreen image", req.body.item_id);

            let variant = await filesL.getFullScreenImage(
                req.body.item_id
            );

            res.status(200);

            res.send({
                variant: variant
            });
        } catch (e) {
            res.status(400);
            res.send(e);
        }
    });

    app.get('/fullscreen/items', async function (req,res) {
        debugL.log("fullscreen items");

        try {
            let data = await cacheL.getItems('asc');

            let item_ids = [];

            for(let i of data) {
                item_ids.push(i.id);
            }

            res.status(200);
            res.send(item_ids);
        } catch (e) {
            res.status(400);
            res.send(e);
        }
    });

    app.put('/organize/batch/date', async function (req, res) {
        debugL.log("Set batch date");

        try {
            let items = await organizeL.setBatchDate(req.body.items);
            res.status(202);
            res.send(items);
        } catch (e) {
            res.status(400);
            res.send();
        }
    });

    app.put('/organize/batch/delete', async function (req, res) {
        debugL.log("Set batch date");

        try {
            let items = await organizeL.setBatchDelete(req.body.items);
            res.status(202);
            res.send(items);
        } catch (e) {
            res.status(400);
            res.send();
        }
    });

    app.put('/grid', async function (req, res) {
        try {
            setGlobalViewParams(req.body.params);

            let grid;

            try {
                grid = await gridL.getLife();
            } catch(e) {

            }

            res.status(200);
            res.send(grid);
        } catch (e) {
            res.status(400);
            res.send();
        }
    });

    app.get('/interval/loops', async function (req, res) {
        try {
            let data = await timeL.loadIntervalLoops();
            res.status(200);
            res.send(data);
        } catch (e) {
            res.status(400);
            res.send();
        }
    });

    app.put('/views/life', async function (req, res) {
        try {
            let life_html = await viewsL.getLife(req.body);

            res.status(200);

            res.send({
                life: life_html,
                intervalLoop: timeL.intervalLoop
            });
        } catch (e) {
            res.status(400);
            res.send();
        }
    });

    app.put('/views/organize-grid', async function (req, res) {
        try {
            let data = await viewsL.organizeGrid(req.body);
            res.status(200);
            res.send({
                html: data.html,
                item_ids: data.item_ids
            });
        } catch (e) {
            res.status(400);
            res.send();
        }
    });

    app.put('/life/item', async function (req, res) {
        try {
            let item = await itemsL.getLifeItem(req.body.gridIndex, req.body.divOrder, req.body.intervalLoop);

            res.status(200);
            res.send(item);
        } catch (e) {
            res.status(400);
            res.send();
        }
    });

    app.get('/items/life', async function (req, res) {
        try {
            let data = await itemsL.getLife(true);
            res.status(200);
            res.send(data);
        } catch (e) {
            res.status(400);
            res.send();
        }
    });

    app.get('/ws/items', async function (req, res) {
        try {
            let data = itemsL.wsItems;

            res.status(200);
            res.send(data);
        } catch (e) {
            res.status(400);
            res.send();
        }
    });

    app.get('/time/items', async function (req, res) {
        try {
            let data = await timeL.getItems(req.query.gridIndex, req.query.direction, req.query.item_ids_only);
            res.status(200);
            res.send(data);
        } catch (e) {
            res.status(400);
            res.send();
        }
    });

    app.put('/time/count', async function (req, res) {
        try {
            let data = await timeL.getCount(req.body.gridIndex);

            res.status(202);

            res.send({
                count: data
            });
        } catch (e) {
            res.status(400);
            res.send();
        }
    });

    app.get('/data/items', async function (req, res) {
        try {
            let item_id = req.query.item_id;
            let data = itemsL.getItem(item_id);

            res.status(200);
            res.send(data);
        } catch (e) {
            res.status(400);
            res.send();
        }
    });

    app.put('/notifications/seen', async function (req, res) {
        try {
            appL.notificationsSeen(req.body.notification_keys);
            res.status(202);
        } catch (e) {
            res.status(400);
        }

        res.send();
    });

    app.get('/items/:item_id/sources', async function (req, res) {
        let sources;
        try {
            let item_id = req.params.item_id;
            let num_cols = req.query.num_cols;
            let is_fullscreen = req.query.is_fullscreen === ('true' || '1');
            sources = await imageL.getSources(item_id, num_cols, is_fullscreen);
            res.status(200);
        } catch (e) {
            res.status(400);
        }

        res.send(sources);
    });

    app.get('/items/:item_id/device', async function (req, res) {
        let data;
        try {
            let item_id = req.params.item_id;
            data = await itemsL.getDeviceSrc(item_id);
            res.status(200);
        } catch (e) {
            res.status(400);
        }

        res.send(data);
    });

    app.put('/styles', async function (req, res) {
        try {
            styleL.setScreen(req.body.screen);
            res.status(202);
        } catch (e) {
            res.status(400);
        }

        res.send();
    });

    app.get('/items/photos/count', async function (req, res) {
        let count = 0;
        res.status(200);

        try {
            count = itemsL.getCount();
        } catch (e) {
            res.status(400);
        }

        res.send({
            count: count
        });
    });

    app.put('/show/file/local', async function (req, res) {
        res.status(200);

        try {
            let file = req.body.file;

            if(is_mac) {
                await runExec(`open "${file}" -R`);
            } else if(is_windows) {

            }
        } catch (e) {
            console.error(e);
        }

        res.send();
    });

    app.put('/rotate', async function (req, res) {
        res.status(200);

        try {
            let bool = req.body.bool;

            await require('./rotate').setRotate(bool);

        } catch (e) {
            console.error(e);
        }

        res.send();
    });

    app.get('/rotate', async function (req, res) {
        res.status(200);

        let bool = true;

        try {
            bool = await require('./rotate').getRotate();
        } catch (e) {
            console.error(e);
        }

        res.send(bool);
    });

    app.put('/controls', async function (req, res) {
        res.status(200);

        try {
            let bool = req.body.bool;

            await require('./style').setControls(bool);

        } catch (e) {
            console.error(e);
        }

        res.send();
    });

    app.get('/controls', async function (req, res) {
        res.status(200);

        let bool = true;

        try {
            bool = await require('./style').getControls();
        } catch (e) {
            console.error(e);
        }

        res.send(bool);
    });

    app.put('/settings', async function (req, res) {
        res.status(200);

        try {
            await require('./settings').setSetting(req.body.key, req.body.value);
        } catch (e) {
            console.error(e);
        }

        res.send();
    });

    app.get('/settings', async function (req, res) {
        res.status(200);

        let data = null;

        try {
            data = await require('./settings').getSettings();
        } catch (e) {
            console.error(e);
        }

        res.send(data);
    });

    app.put('/db/loaded', async function (req, res) {
        try {
            dbL.setLoaded();
            res.status(200);
            res.send("set");
        } catch (e) {
            res.status(400);
            res.send(e);
        }
    });
};
