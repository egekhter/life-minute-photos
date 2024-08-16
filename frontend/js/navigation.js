let kdMap = {};

photosApp.navigation = {
    in_progress: false,
    handler_called: false,
    transition: 500, //ms
    forceShow: false,
    scrolling_class: 'scrolling-down',
    scrollTop: 0,
    level3: {
        current: null,
        updateIP: false
    },
    handler: function () {
        if(photosApp.navigation.handler_called) {
            return false;
        }

        const navigation_el = photosApp.app.els.navigation;
        const life_nav_el = navigation_el.querySelector('.life-nav');

        const fullscreen_back = document.getElementById('fullscreen').querySelector('.exit');
        const level_3_cancel = document.getElementById('navigation-level-3').querySelector('#level-3-cancel');

        fullscreen_back.addEventListener(click_handler, function (e) {
            photosApp.fullscreen.exitFullscreen();

            e.preventDefault();
            e.stopPropagation();
            return false;
        });

        level_3_cancel.addEventListener(click_handler, function (e) {
            if(photosApp.app.views.level2.active === 'grid') {
                let time_active = photosApp.app.els.navigation.querySelector('.life-nav.active');
                photosApp.app.hideLevel2();

                setTimeout(function () {
                    photosApp.app.hideLevel3();
                }, photosApp.style.navigation.level2.transition);

                if(time_active) {
                    fireClick(life_nav_el);
                }
            }

            photosApp.organize.hideCalendarIf();

            e.preventDefault();
            e.stopPropagation();
        });

        photosApp.navigation.handler_called = true;
    },
    setScrollingDown: function(bool) {
        if(bool) {
            addClassEl(photosApp.navigation.scrolling_class, 'app');
            removeClassEl('screen', 'navigation');
        } else {
            removeClassEl(photosApp.navigation.scrolling_class, 'app');
        }

        photosApp.app.scrollingDown = bool;
    },
};

function handleKeyDown (e) {
    let target;

    if(e.currentTarget && 'nodeName' in e.currentTarget) {
        target = e.currentTarget;
    } else {
        target = e.target;
    }

    kdMap[e.keyCode] = true;

    if(photosApp.slideshow.in_slideshow) {
        if(e.which === 39) { //right
            e.preventDefault();
            fireClick(document.getElementById('slideshow').querySelector('.control.next-item'));
        } else if(e.which === 37) { //left
            e.preventDefault();
            fireClick(document.getElementById('slideshow').querySelector('.control.prev-item'));
        }
    } else if(photosApp.app.is_fullscreen) {
        //prevent shifting position of slides in fullscreen

        //prevent changing slide if any fullscreen input has focus
        let fs_inputs = photosApp.app.els.fullscreen.getElementsByTagName('input');

        let input_has_focus = false;

        for(let i = 0; i < fs_inputs.length; i++) {
            let el = fs_inputs[i];

            if(document.activeElement === el) {
                input_has_focus = true;
                break;
            }
        }

        if(!input_has_focus) {
            if(e.which === 39) { //right
                photosApp.fullscreen.changeSlide('r');
                e.preventDefault();
            } else if(e.which === 37) { //left
                photosApp.fullscreen.changeSlide('l');
                e.preventDefault();
            }
        }
    }

    if(e.code === 'Tab' || e.which === 9) {
        //prevent shifting position of slides in fullscreen
        //prevent shift from 3rd level to 2nd level
        if(photosApp.app.is_fullscreen && target.closest('.context__menu')) {
            //do nothing
        } else if(photosApp.app.levels["2"].open || photosApp.app.levels["3"].open) {
            e.preventDefault();
            e.stopPropagation();
        }
    }
}

function handleKeyUp (e) {
    if(photosApp.dev.enabled) {
        if(kdMap[91] && kdMap[68]) {
            photosApp.debug.openDevTools();
        }
    }

    //escape to exit full screen
    if(e.key === 'Escape' && e.which === 27) {
        photosApp.events.closeConditionally(e);
        return false;
    }

    if(e.code === 'Space' || e.which === 32) {
        if(photosApp.slideshow.in_slideshow) {
            photosApp.slideshow.togglePlayPause();
        }
    }

    kdMap[e.keyCode] = false;
}