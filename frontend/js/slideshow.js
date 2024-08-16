photosApp.slideshow = {
    in_slideshow: false,
    change_ip: false,
    spinnerTimeouts: [],
    img_class: 'slideshow-image',
    paused: false,
    current_int: -1,
    interactTimeout: 2000,
    remove_transition: false,
    pause_play: {
        threshold: 100,
        last: null
    },
    items: {
        start: null,
        current: null,
        next: null,
        prev: null,
        all: null,
        loaded: {}
    },
    startSlideShow: async function (start_item_id, item_ids) {
        return new Promise(async (resolve, reject) => {
            if(photosApp.slideshow.in_slideshow) {
                return reject();
            }

            photosApp.slideshow.remove_transition = false;
            removeClassEl('remove-transition', photosApp.app.els.slideshow);

            photosApp.slideshow.setPaused(false);

            removeClassEl('active', photosApp.app.els.slideshow.querySelector('.control.play'));
            addClassEl('active', photosApp.app.els.slideshow.querySelector('.control.pause'));

            photosApp.slideshow.setHtml();

            photosApp.slideshow.current_int++;

            photosApp.slideshow.in_slideshow = true;

            photosApp.slideshow.setInteract(false);

            photosApp.slideshow.items.loaded = {};

            start_item_id = Number.parseInt(start_item_id);

            photosApp.slideshow.items.start = start_item_id;
            photosApp.slideshow.items.current = start_item_id;
            photosApp.slideshow.items.all = item_ids;
            photosApp.slideshow.setNextPrev();

            try {
                await photosApp.slideshow.initElements();
            } catch(e) {
                console.error(e);
            }

            photosApp.slideshow.setTransitionTiming();

            addClassEl('slideshow', 'app');

            photosApp.slideshow.doRotation();

            return resolve();
        });
    },
    setTransitionTiming: function () {
        let timing = photosApp.rotate.getRotateTiming(photosApp.slideshow.items.all.length);

        photosApp.style.setSlideshowTransition(timing);

    },
    exitSlideShow: async function () {
        if(photosApp.app.is_fullscreen) {
            try {
                await photosApp.fullscreen.slidesInit(photosApp.slideshow.items.current);
            } catch(e) {

            }
        } else {
            photosApp.rotate.viewInt++;
            photosApp.rotate.updateTime();
        }

        removeClassEl('slideshow', 'app');
        photosApp.slideshow.setInteract(false);
        photosApp.slideshow.in_slideshow = false;
    },
    events: function () {
        let slideshow_el = document.getElementById('slideshow');
        let exit = slideshow_el.querySelector('.exit');
        let pause = slideshow_el.querySelector('.pause');
        let play = slideshow_el.querySelector('.play');
        let prev_control = slideshow_el.querySelector('.control.prev-item');
        let next_control = slideshow_el.querySelector('.control.next-item');

        exit.addEventListener(click_handler, function (e) {
            e.preventDefault();
            e.stopPropagation();
            photosApp.slideshow.exitSlideShow();
        });

        pause.addEventListener(click_handler, function (e) {
            if(photosApp.slideshow.pause_play.last && timeNow(true) - photosApp.slideshow.pause_play.last < photosApp.slideshow.pause_play.threshold) {
                return false;
            }

            photosApp.slideshow.pause_play.last = timeNow(true);

            photosApp.slideshow.setPaused(true);

            removeClassEl('active', this);
            addClassEl('active', play);

            photosApp.slideshow.setSpinner(false);
        });

        play.addEventListener(click_handler, function (e) {
            if(photosApp.slideshow.pause_play.last && timeNow(true) - photosApp.slideshow.pause_play.last < photosApp.slideshow.pause_play.threshold) {
                return false;
            }

            photosApp.slideshow.pause_play.last = timeNow(true);

            photosApp.slideshow.setPaused(false);

            removeClassEl('active', this);
            addClassEl('active', pause);

            photosApp.slideshow.doRotation();
        });

        prev_control.addEventListener(click_handler, async function (e) {
            if(!photosApp.slideshow.paused && photosApp.slideshow.change_ip) {
                return false;
            }

            if(!photosApp.slideshow.items.prev) {
                return false;
            }

            photosApp.slideshow.setChange(true);

            photosApp.slideshow.current_int++;

            let prev_el = slideshow_el.querySelector('.prev-item');
            let current_el = slideshow_el.querySelector('.current-item');
            let next_el = slideshow_el.querySelector('.next-item');

            addClassEl('show', prev_el);
            removeClassEl('prev-item', prev_el);
            addClassEl('current-item', prev_el);

            removeClassEl('show', current_el);
            removeClassEl('change', current_el);

            removeClassEl('current-item', current_el);
            addClassEl('next-item', current_el);

            removeClassEl('next-item', next_el);
            addClassEl('prev-item', next_el);

            photosApp.slideshow.items.current = photosApp.slideshow.items.prev;

            photosApp.slideshow.setNextPrev();

            let prev_item = photosApp.items.getItem(photosApp.slideshow.items.prev);

            try {
                await photosApp.slideshow.setElement(next_el, prev_item);
            } catch(e) {
                console.error(e);
            }

            let transition = 0;

            setTimeout(function () {
                photosApp.slideshow.setChange(false);

                if(photosApp.slideshow.in_slideshow && !photosApp.slideshow.paused) {
                    photosApp.slideshow.doRotation();
                }
            }, transition);
        });

        next_control.addEventListener(click_handler, async function (e) {
            if(!photosApp.slideshow.paused && photosApp.slideshow.change_ip) {
                return false;
            }

            if(!photosApp.slideshow.items.next) {
                return false;
            }

            photosApp.slideshow.current_int++;

            photosApp.slideshow.setChange(true);

            requestAnimationFrame(async function () {
                let prev_el = slideshow_el.querySelector('.prev-item');
                let current_el = slideshow_el.querySelector('.current-item');
                let next_el = slideshow_el.querySelector('.next-item');

                //next el becoming current
                addClassEl('show', next_el);
                removeClassEl('next-item', next_el);
                addClassEl('current-item', next_el);

                //current el becoming prev
                removeClassEl('show', current_el);
                removeClassEl('change', current_el);

                removeClassEl('current-item', current_el);
                addClassEl('prev-item', current_el);

                //prev el becoming next
                removeClassEl('prev-item', prev_el);
                addClassEl('next-item', prev_el);

                photosApp.slideshow.items.current = photosApp.slideshow.items.next;

                photosApp.slideshow.setNextPrev();

                let next_item = photosApp.items.getItem(photosApp.slideshow.items.next);

                try {
                    await photosApp.slideshow.setElement(prev_el, next_item);
                } catch(e) {
                    console.error(e);
                }

                let transition = 0;

                setTimeout(function () {
                    photosApp.slideshow.setChange(false);

                    if(photosApp.slideshow.in_slideshow && !photosApp.slideshow.paused) {
                        photosApp.slideshow.doRotation();
                    }
                }, transition);
            });
        });
    },
    setPaused: function (bool) {
          photosApp.slideshow.paused = bool;

          if(bool) {
              addClassEl('paused', photosApp.app.els.slideshow);

              //fix pause timing next
              let item = photosApp.app.els.slideshow.querySelector('.current-item.show.change');

              if(item) {
                  fireClick(photosApp.app.els.slideshow.querySelector('.control.next-item'));
              }
          } else {
              removeClassEl('paused', photosApp.app.els.slideshow);
          }
    },
    setNextPrev: function () {
        if(photosApp.slideshow.items.all.length === 1) {
            photosApp.slideshow.items.prev = null;
            photosApp.slideshow.items.next = null;
        } else if (photosApp.slideshow.items.all.length === 2) {
            let current_index = photosApp.slideshow.items.all.indexOf(photosApp.slideshow.items.current);

            if(current_index === 0) {
                photosApp.slideshow.items.prev = photosApp.slideshow.items.all[1];
                photosApp.slideshow.items.next = photosApp.slideshow.items.all[1];
            } else {
                photosApp.slideshow.items.prev = photosApp.slideshow.items.all[0];
                photosApp.slideshow.items.next = photosApp.slideshow.items.all[0];
            }
        } else {
            let current_index = photosApp.slideshow.items.all.indexOf(photosApp.slideshow.items.current);

            if(current_index === 0) {
                photosApp.slideshow.items.prev = photosApp.slideshow.items.all[photosApp.slideshow.items.all.length - 1];
            } else {
                photosApp.slideshow.items.prev = photosApp.slideshow.items.all[current_index - 1];
            }

            if(current_index === photosApp.slideshow.items.all.length - 1) {
                photosApp.slideshow.items.next = photosApp.slideshow.items.all[0];
            } else {
                photosApp.slideshow.items.next = photosApp.slideshow.items.all[current_index + 1];
            }
        }
    },
    initElements() {
        return new Promise(async (resolve, reject) => {
            let slideshow = document.getElementById('slideshow');
            let prev_el = slideshow.querySelector('.prev-item');
            let current_el = slideshow.querySelector('.current-item');
            let next_el = slideshow.querySelector('.next-item');

            addClassEl('show', current_el);
            current_el.style.transition = 'initial !important';

            requestAnimationFrame(function () {
                current_el.style.removeProperty('transition');
            });


            let prev_item = photosApp.items.getItem(photosApp.slideshow.items.prev);
            let current_item = photosApp.items.getItem(photosApp.slideshow.items.current);
            let next_item = photosApp.items.getItem(photosApp.slideshow.items.next);

            try {
                await photosApp.slideshow.setElement(prev_el, prev_item);
            } catch(e) {
                console.error(e);
            }

            try {
                await photosApp.slideshow.setElement(current_el, current_item);
            } catch(e) {
                console.error(e);
            }

            try {
                await photosApp.slideshow.setElement(next_el, next_item);
            } catch(e) {
                console.error(e);
            }

            resolve();
        });
    },
    setElement(el, item) {
        return new Promise(async (resolve, reject) => {
            let slide_html, slide_hq;

            if(!item) {
                return resolve();
            }

            if(item.is_photo) {
                try {
                    let sources = await photosApp.image.getSources(item.id, null, true);
                    slide_hq = sources.local;
                } catch (e) {
                    return reject(e);
                }

                let image_calc = photosApp.fullscreen.getImageCalc(item);

                if(!image_calc.max_height) {
                    devConsole("No height, ", item);
                }

                slide_html = `<div class="image-container">
                                            <div data-src="${slide_hq}" class="${photosApp.slideshow.img_class}" id="slideshow-${item.id}" 
                                                data-item-id="${item.id}" 
                                                style="transform: translate(${image_calc.transform_left}px, ${image_calc.transform_top}px) scale(${image_calc.scale}); 
                                                width: ${image_calc.max_width}px; height: ${image_calc.max_height}px;"></div>
                                      </div>
                                    `;
            }

            el.innerHTML = slide_html;

            if(item.is_photo) {
                try {
                    await fetchImage(slide_hq);
                    el.querySelector(`.${photosApp.slideshow.img_class}`).style.backgroundImage = `url('${slide_hq}')`;
                    photosApp.slideshow.items.loaded[item.id] = true;
                } catch(e) {
                }
            }

            resolve();
        });
    },
    doRotation: async function () {
        let current_item = photosApp.items.getItem(photosApp.slideshow.items.current);

        if(!photosApp.slideshow.in_slideshow || photosApp.slideshow.paused) {
            return;
        }

        if(!current_item) {
            console.log("No current item");
            return;
        }

        let slideshow = document.getElementById('slideshow');
        let prev_el = slideshow.querySelector('.prev-item');
        let current_el = slideshow.querySelector('.current-item');
        let next_el = slideshow.querySelector('.next-item');

        let current_int = photosApp.slideshow.current_int;

        let timing = photosApp.rotate.getRotateTiming(photosApp.slideshow.items.all.length);

        await timeoutAwait(null, timing.screen);

        if(!photosApp.slideshow.items.next || !photosApp.slideshow.in_slideshow || photosApp.slideshow.paused || current_int !== photosApp.slideshow.current_int) {
            return;
        }

        addClassEl('show', next_el);
        addClassEl('change', current_el);

        await rafAwait();

        await timeoutAwait(null, timing.transition);

        if(!photosApp.slideshow.in_slideshow || photosApp.slideshow.paused || current_int !== photosApp.slideshow.current_int) {
            return;
        }

        //change current el to prev
        removeClassEl('show', current_el);
        removeClassEl('change', current_el);

        removeClassEl('current-item', current_el);
        addClassEl('prev-item', current_el);

        //change next el to current
        removeClassEl('next-item', next_el);
        addClassEl('current-item', next_el);

        //change prev el to next
        removeClassEl('prev-item', prev_el);
        addClassEl('next-item', prev_el);

        photosApp.slideshow.items.current = photosApp.slideshow.items.next;

        photosApp.slideshow.setNextPrev();

        let next_item = photosApp.items.getItem(photosApp.slideshow.items.next);

        await rafAwait();

        try {
            await photosApp.slideshow.setElement(prev_el, next_item);
        } catch(e) {
            console.error(e);
        }

        if(photosApp.slideshow.in_slideshow && !photosApp.slideshow.paused || current_int !== photosApp.slideshow.current_int) {
            photosApp.slideshow.doRotation();
        }
    },
    setSpinner: function (bool) {
        if(bool) {
            addClassEl('show', 'slideshow-spinner');
        } else {
            removeClassEl('show', 'slideshow-spinner');
            for(let t of photosApp.slideshow.spinnerTimeouts) {
                clearTimeout(t);
            }
        }
    },
    setChange: function (bool) {
        photosApp.slideshow.change_ip = bool;
    },
    togglePlayPause: function () {
        let slideshow_el = document.getElementById('slideshow');
        let pause = slideshow_el.querySelector('.pause');
        let play = slideshow_el.querySelector('.play');

        if(photosApp.slideshow.paused) {
            fireClick(play);
        } else {
            fireClick(pause);
        }
    },
    setHtml: function () {
        let el = document.getElementById('slideshow').querySelector('.items');

        el.innerHTML = `<div class="item prev-item"></div>
                                    <div class="item current-item"></div>
                                    <div class="item next-item"></div>`;

        return false;
    },
    setInteract: function (bool, toggle) {
        if(toggle) {
            bool = !photosApp.app.els.slideshow.classList.contains('interact');
        }

        if(bool) {
            let t_prop = 'setInteractTs';

            if(!photosApp.slideshow[t_prop]) {
                photosApp.slideshow[t_prop] = [];
            }

            for(let stlt of photosApp.slideshow[t_prop]) {
                clearTimeout(stlt);
            }

            let t = setTimeout(function () {
                addClassEl('interact', photosApp.app.els.slideshow);
            }, 100);

            photosApp.slideshow[t_prop].push(t);

        } else {
            removeClassEl('interact', photosApp.app.els.slideshow);
        }
    },
    onResize: function () {
        if(!photosApp.slideshow.in_slideshow) {
            return false;
        }

        function resize() {
            let items = photosApp.app.els.slideshow.getElementsByClassName('item');

            for(let i = 0; i < items.length; i++) {
                let item = items[i];

                let item_id = item.querySelector('.slideshow-image').getAttribute('data-item-id');

                let item_image = item.querySelector(`.${photosApp.slideshow.img_class}`);

                if(item_image) {
                    let image_calc = photosApp.fullscreen.getImageCalc(item_id);
                    item_image.style.transform = `translate(${image_calc.transform_left}px, ${image_calc.transform_top}px) scale(${image_calc.scale})`;
                    item_image.style.width = `${image_calc.max_width}px`;
                    item_image.style.height = `${image_calc.max_height}px`;
                }
            }
        }

        resize();
    }
};