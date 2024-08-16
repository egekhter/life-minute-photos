function devConsole() {
    if(typeof photosApp !== 'undefined' && photosApp.dev && photosApp.dev.enabled && photosApp.dev.showConsole) {
        let args = [];

        for (let i = 0; i < arguments.length; i++) {
            let arg = arguments[i];
            args.push(arg);

            if(arg && arg.type && arg.type == 'error') {
                // console.trace();
            }
        }
        if(args.length === 1) {
            console.log(args[0]);
        } else {
            console.log(args);
        }

        let tr = Error().stack.split('\n');

        if(tr.length >= 3) {
            console.log(tr[2]);
        }
    }
}

function joinPaths () {
    let args = [];

    for (let i = 0; i < arguments.length; i++) {
        let arg = arguments[i] + '';

        if(!arg) {
            continue;
        }

        if(typeof arg === 'number') {
            arg = arg.toString();
        }

        args.push(arg);
    }

    let slash = '/';

    if(typeof require !== 'undefined' && require('os') && require('os').platform() === 'win32') {
        slash = '\\';
    }

    return args.map((part, i) => {
        let re;

        if (i === 0) {
            re = new RegExp(`[\\${slash}]*$`, 'g');
        } else {
            re = new RegExp(`(^[\\${slash}]*|[\\/]*$)`, 'g');
        }

        return part.trim().replace(re, '');
    }).filter(x=>x.length).join(slash)
}

function createEl(type, id, class_list) {
    let el = document.createElement(type);

    if(id) {
        el.setAttribute("id", id);
    }

    if(class_list) {
        if(Array.isArray(class_list)) {
            for(let i = 0 ; i < class_list.length; i++) {
                if(class_list[i]) {
                    el.classList.add(class_list[i]);
                }
            }
        } else {
            if(class_list) {
                el.classList.add(class_list);
            }

        }
    }

    return el;
}

function isObjectEmpty(obj) {
    for(let key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}


function humanMonthFromNumber(month, shorten) {
    month = Number.parseInt(month);

    if(!month) {
        return '';
    }

    let human_month;

    if(month === 1) {
        human_month = 'January';
    } else if(month === 2) {
        human_month = 'February';
    } else if(month === 3) {
        human_month = 'March';
    } else if (month === 4) {
        human_month = 'April';
    } else if(month === 5) {
        human_month = 'May';
    } else if(month === 6) {
        human_month = 'June';
    } else if(month === 7) {
        human_month = 'July'
    } else if(month === 8) {
        human_month = 'August'
    } else if(month === 9) {
        human_month = 'September'
    } else if(month === 10) {
        human_month = 'October'
    } else if(month === 11) {
        human_month = 'November'
    } else if(month === 12) {
        human_month = 'December'
    } else {
        return '';
    }

    if(shorten) {
        return human_month.substring(0, 3);
    }

    return human_month;
}

function addClassEl(name, el) {
    if(typeof el !== 'object') {
        el = document.getElementById(el);
    }

    if(!el) {
        return;
    }

    if(!el.classList.contains(name)) {
        el.classList.add(name);
    }
}

function toggleClassEl(name, el) {
    if(typeof el !== 'object') {
        el = document.getElementById(el);
    }

    if(!el) {
        return;
    }

    if(!el.classList.contains(name)) {
        el.classList.add(name);
    } else {
        el.classList.remove(name);
    }
}

function removeClassEl(name, el) {
    if(typeof el !== 'object') {
        el = document.getElementById(el);
    }

    if(!el) {
        return;
    }

    if(el.classList.contains(name)) {
        el.classList.remove(name);
    }
}

function toggleElClass(el, css_class) {
    if(!el.classList.contains(css_class)) {
        el.classList.add(css_class);
    } else {
        el.classList.remove(css_class);
    }
}

function getElIndexOfEls(el, collection) {
    let current_index = -1;

    _.forEach(collection, function (c) {
        current_index += 1;
       if(el === c) {
           return false;
       }
    });

    return current_index;
}

function fireClick(node){
    if(typeof node === 'string') {
        node = document.getElementById(node);
    }

    if(!node) {
        return;
    }

    if (document.createEvent) {
        let evt = document.createEvent('MouseEvents');
        evt.initEvent(click_handler, true, false);
        node.dispatchEvent(evt);
    } else if (document.createEventObject) {
        node.fireEvent(`on${click_handler}`) ;
    } else if (typeof node[`on${click_handler}`] == 'function') {
        node[`on${click_handler}`]();
    }

}

function removeElsClass(els, cl) {
    if(els && els.length) {
        _.forEach(els, function (el) {
            if(el) {
                el.classList.remove(cl);
            }
        });
    }
}

function removeClassFromAllEls(cl, el)
{
    if(el.length) {
        _.forEach(el, function (lEl) {
            let elems = lEl.querySelectorAll("." + cl);
            [].forEach.call(elems, function(el) {
                el.classList.remove(cl);
            });
        });
    } else {
        let elems = el.querySelectorAll("." + cl);
        [].forEach.call(elems, function(el) {
            el.classList.remove(cl);
        });
    }
}

function removeClassEls(cl, els) {
    let elements = [].slice.call(els);

    for(let i = 0; i < elements.length; i++) {
        elements[i].classList.remove(cl);
    }
}

function elHasClass(el, cl) {
    if(typeof el === 'string') {
        el = document.getElementById(el);
    }

    return el.classList.contains(cl);
}

if(typeof (Element) !== 'undefined') {
    (function (arr) {
        arr.forEach(function (item) {
            if (item.hasOwnProperty('remove')) {
                return;
            }

            Object.defineProperty(item, 'remove', {
                configurable: true,
                enumerable: true,
                writable: true,
                value: function remove() {
                    if (this.parentNode === null) {
                        return;
                    }
                    this.parentNode.removeChild(this);
                }
            });
        });
    })([Element.prototype, CharacterData.prototype, DocumentType.prototype]);
}

function timeNow(ms) {
    if(ms) {
        return Date.now();
    }

    return Number.parseInt(Date.now() / 1000);
}

function mdp(name) {
    if(photosApp.dev.performance) {
        console.time(name);
    }
}

function mdpe(name) {
    if(photosApp.dev.performance) {
        console.timeEnd(name);
    }
}

function isFloat(n){
    return Number(n) === n && n % 1 !== 0;
}

function getExtFromFileName(filename) {
    let re = /(?:\.([^.]+))?$/;
    return re.exec(filename)[1];
}

Date.prototype.toMysqlFormat = function() {
    return this.toISOString().slice(0, 19).replace('T', ' ');
};

function formatNumberLength(num, length) {
    let r = "" + num;

    while (r.length < length) {
        r = "0" + r;
    }
    return r;
}

if (typeof Object.assign !== 'function') {
    // Must be writable: true, enumerable: false, configurable: true
    Object.defineProperty(Object, "assign", {
        value: function assign(target, varArgs) { // .length of function is 2
            'use strict';
            if (target === null || target === undefined) {
                throw new TypeError('Cannot convert undefined or null to object');
            }

            let to = Object(target);

            for (let index = 1; index < arguments.length; index++) {
                let nextSource = arguments[index];

                if (nextSource !== null && nextSource !== undefined) {
                    for (let nextKey in nextSource) {
                        // Avoid bugs when hasOwnProperty is shadowed
                        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
            }
            return to;
        },
        writable: true,
        configurable: true
    });
}

function isElHover(e) {
    return (e.parentElement.querySelector(':hover') === e);
}

function addDeselectedClass(el) {
    addClassEl('deselected', el);

    let i = setInterval(function () {
        if(!isElHover(el)) {
            removeClassEl('deselected', el);
            clearInterval(i);
        }
    }, 200);
}

function isValidName(name) {
    return name.length > 0;
}

function getSizeMB(bytes, digits) {
    return (bytes / 1024 ** 2).toFixed(1);
}

function getMasterDate(item) {
    if(item.master_item_date) {
        if(item.master_item_date === '0000-00-00 00:00:00') {
            item.master_item_date = null;
        }
    }

    return item.master_item_date ? item.master_item_date : item.date;
}

function rafAwait(f) {
    return new Promise((resolve, reject) => {
        requestAnimationFrame(async function () {
            if(f) {
                try {
                    await f();
                } catch (e) {
                }
            }

            resolve();
        })
    });
}

function timeoutAwait(f, t) {
    return new Promise((resolve, reject) => {
        setTimeout(function () {
            if(f) {
                f();
            }

            resolve();
        }, t);
    });
}

function getExt(file, lower) {
    let re = /(?:\.([^.]+))?$/;

    let ext = re.exec(file)[1];
    if(ext && lower) {
        ext = ext.toLowerCase();
    }

    return ext;
}

function sortDesc(arr) {
    arr.sort(function (a, b) {
        return b - a;
    });
}

function sortAsc(arr) {
    arr.sort(function (a, b) {
        return a - b;
    });
}

function numberWithCommas(x, to_integer) {
    if(to_integer) {
        x = Number.parseInt(x);
    }
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function isNumeric(obj) {
    return !isNaN( parseFloat(obj) ) && isFinite( obj );
}

function getEventXFirst(e) {
    return e.touches && e.touches.length ? e.touches[0].pageX : e.pageX;
}

function getEventYFirst(e) {
    return e.touches && e.touches.length ? e.touches[0].pageY : e.pageY;
}

function setElementTransform(el, x, y, z, important) {
    el.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
}

function setElementTransition(el, add, transition, duration, timing_function) {
    if(add) {
        el.style.transitionDuration = `${duration}ms`;
        // el.style.setProperty('transition-duration', `${duration}ms !important`);
        el.style.transitionProperty = `${transition}`;
        // el.style.setProperty('transition-property', `${transition} !important`);
        if(timing_function) {
            el.style.transitionTimingFunction = `${timing_function}`;
        }
    } else {
        el.style.removeProperty('transition-duration');
        el.style.removeProperty('transition-property');
        el.style.removeProperty('transition-timing-function');
    }
}

function urlFromBackgroundImage(el) {
    let bg = el.style.backgroundImage;

    let url = '';
    let start_adding = false;

    for(let i in bg) {
        let s = bg[i];

        if(s === '(') {
            start_adding = true;
        }

        if(s === ')') {
            start_adding = false;
            break;
        }

        if(start_adding) {
            url += s;
        }
    }

    url = url.replace(/[\(\'\"\)]/g, '');

    return url;
}

function removeMediaSrc(el) {
    if(el) {
        el.src = '';
        el.style.backgroundImage = 'initial';
    }
}

function setElOpacity(el, opacity) {
    if(opacity === 'initial') {
        //do nothing
    } else if(opacity > 1) {
        opacity = 1;
    } else if(opacity < 0) {
        opacity = 0;
    }

    el.style.opacity = opacity;
}

function changeElClass(el, cl, bool) {
    if(bool) {
        addClassEl(cl, el);
    } else {
        removeClassEl(cl, el);
    }
}

function removeArrItem(arr, item) {
    let index = arr.indexOf(item);
    if(index > -1) {
        arr.splice(index, 1);
    }
}

function getDateTimeStr() {
    let date = new Date();

    return date.toISOString().slice(0, 10) + ' ' + date.toISOString().substring(11, 19);
}

function getWindowsPath (i, is_url, is_fs) {
    if(!i) {
        return null;
    }

    //only change url on windows
    if(!is_windows || i.startsWith('./')) {
        return i;
    }

    if(is_url) {
        i = i.replace(/\\/g, '/');

        let str = 'file://';

        if(!i.startsWith(str) && !i.startsWith('http')) {
            if(i.startsWith('/')) {
                i = str + i;
            } else {
                i = str + '/' + i;
            }
        }
    } else if(is_fs) {
        i = i.replace(/\//g, '\\');
    }

    return i;
}

function checkIfPathExists(p) {
    return new Promise((resolve, reject) => {
        const fs = require('fs');

        return resolve(fs.existsSync(p));
    });
}

function writeFile(filePath, buffer, cb) {
    return new Promise((resolve, reject) => {
        let fs = require('fs');

        fs.writeFile(filePath, buffer, function (err) {
            if(err) {
                console.error(err);
            }

            resolve();
        });
    });
}