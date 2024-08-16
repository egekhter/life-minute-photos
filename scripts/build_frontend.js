const writeFileAtomic = require('write-file-atomic');
const path = require('path');
const sass = require('sass');

let appPackage = require('../package.json');

let css_files = [
    'css/styles.css'
];

let js_files = {
    frontend: [
        'js/app.js', //app first
        'js/helpers.js',
        'js/backend.js',
        'js/dev.js',
        'js/debug.js',
        'js/events.js',
        'js/style.js',
        'js/animation.js',
        'js/local.js',
        'js/onboarding.js',
        'js/cache.js',
        'js/capture.js',
        'js/grid.js',
        'js/slideshow.js',
        'js/fullscreen.js',
        'js/navigation.js',
        'js/time.js',
        'js/rotate.js',
        'js/image.js',
        'js/items.js',
        'js/db.js',
        'js/view.js',
        'js/settings.js',
        'js/organize.js',
        'js/icons.js',
        'js/vendor/lodash.js',
        'js/vendor/axios.js',
        'js/vendor/moment.js',
        'js/vendor/flatpickr.js',
        'js/init.js', //init last
    ]
};

let build_ip = false;

let source_dir = path.join(path.dirname(__dirname), 'frontend');

if(process.platform === 'linux') {
    source_dir = '/shared/app/frontend';
}

let target_dir = joinPaths(getRepoRoot(), 'frontend/build');


function exec_cmd(cmd) {
    return new Promise((resolve, reject) => {
        const { exec } = require('child_process');

        exec(`${cmd}`, {maxBuffer: 1024 * 10500}, (err, stdout, stderr) => {
            if(err) {
                return reject(err);
            }

            resolve();
        });
    });
}

function loadFile(f) {
    function logic(resolve_re) {
        return new Promise(async (resolve, reject) => {
            resolve = resolve_re ? resolve_re : resolve;

            let fp = require('path').join(source_dir, f);

            require('fs').readFile(fp, 'utf8', function (err, data) {
                if(err) {
                    return reject(err);
                }

                let data_length = data ? data.length : 0;

                if(!data_length) {
                    timeoutAwait(null, 10);
                    return logic(resolve);
                }

                return resolve(data);
            });
        });
    }

    return new Promise(async (resolve, reject) => {
        try {
            resolve(await logic());
        } catch (e) {
            return reject(e);
        }
    });
}

function readJS(which) {
    return new Promise(async(resolve, reject) => {
        const ios = js_files[which].map(function (f) {
            return loadFile(f);
        });

        try {
            let data = await Promise.all(ios);
            resolve(data.join('\n'));
        } catch(e) {
            console.error(e);
        }
    });
}

function readCSS() {
    return new Promise(async(resolve, reject) => {
        const ios = css_files.map(function (f) {
            return loadFile(f);
        });

        try {
            let data = await Promise.all(ios);
            resolve(data.join('\n'));
        } catch(e) {
            console.error(e);
        }
    });
}

function cleanup() {
    return new Promise(async (resolve, reject) => {
        try {
            let files = await listFilesDir(target_dir);

            for(let f of files) {
                if(f.indexOf('-dev') > -1) {
                    let path = joinPaths(target_dir, f);

                    let stat = await statPath(path);

                    let td = timeNow(true) - stat.ctimeMs;
                    td = td / 1000;

                    let days = td / (3600 * 24);

                    if(days > 1) {
                        await deleteFilePath(path);
                    }
                }
            }

            resolve();
        } catch (e) {
            return reject(e);
        }
    });
}

function awaitBuild() {
    return new Promise((resolve, reject) => {
        let i = setInterval(function () {
            if(!build_ip) {
                resolve();
                clearInterval(i);
            }
        }, 100);
    });
}

function writeFile(output, data) {
    return new Promise(async (resolve, reject) => {
        writeFileAtomic(output, data, {}, function (err) {
            if(err) {
                console.error(err);
                return reject(err);
            }

            return resolve();
        });
    });
}


module.exports = {
    build: async function (version, is_production) {
        if(!version) {
            version = appPackage.version;
            // version = .version
        }

        let files_created = [];

        function writeJS(code, name) {
            return new Promise(async (resolve, reject) => {

                let fp = path.join(target_dir, `bundle-${name}.js`);

                files_created.push({
                    name: name,
                    path: fp
                });

                try {
                     await writeFile(fp, code);
                } catch(e) {
                    console.error(e);
                }

                resolve();
            });
        }

        function writeCSS(code) {
            return new Promise(async (resolve, reject) => {
                let fp = require('path').join(target_dir, `bundle-app.css`);

                files_created.push({
                    name: 'css',
                    path: fp
                });

                try {
                    await writeFile(fp, code);
                } catch(e) {
                    console.error(e);
                }

                resolve();
            });
        }


        return new Promise(async (resolve, reject) => {
            console.log("Build frontend");

            if(build_ip) {
                await awaitBuild();
            }

            build_ip = true;

            //compile scss to css
            try {
                let scss_from = joinPaths(source_dir, 'scss', 'styles.scss');

                let css = await sass.compile(scss_from);
                //
                let css_output = joinPaths(source_dir, css_files[0]);

                await writeFile(css_output, css.css);
            } catch(e) {
                console.error(e);
            }

            try {
                await createDirectoryIfNotExistsRecursive(target_dir);

                var Terser = require("terser");
                var csso = require('csso');

                let js_code = await readJS('frontend');
                let css_code = await readCSS();

                if(is_production) {
                    let _js = await Terser.minify(js_code);
                    js_code = _js.code;

                    css_code = csso.minify(css_code).css;
                }

                let current_year = new Date().getFullYear();

                let copy_right = `/* ${appPackage.productNameShort} v${version}  | (©) ${current_year} by ${appPackage.author.name} */
`;

                js_code = copy_right + '\n' + js_code;

                await writeJS(js_code, 'app');
                await writeCSS(css_code);

                console.log("Build complete");

                build_ip = false;

                try {
                    await cleanup();
                } catch (e) {
                    return reject(e);
                }

                resolve();
            } catch (e) {
                build_ip = false;
                console.error(e);
                reject();
            }
        });

    }
};

if(!module.parent) {
    require('../backend/helpers/shared');
    module.exports.build(null, process.argv.indexOf('-d') === -1);
}

