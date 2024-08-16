photosApp.animation = {
    easings:{
        linear(t) {
            return t;
        },
        easeInQuad(t) {
            return t * t;
        },
        easeOutQuad(t) {
            return t * (2 - t);
        },
        easeInOutQuad(t) {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        },
        easeInCubic(t) {
            return t * t * t;
        },
        easeOutCubic(t) {
            return (--t) * t * t + 1;
        },
        easeInOutCubic(t) {
            return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        },
        easeInQuart(t) {
            return t * t * t * t;
        },
        easeOutQuart(t) {
            return 1 - (--t) * t * t * t;
        },
        easeInOutQuart(t) {
            return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
        },
        easeInQuint(t) {
            return t * t * t * t * t;
        },
        easeOutQuint(t) {
            return 1 + (--t) * t * t * t * t;
        },
        easeInOutQuint(t) {
            return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;
        }
    },
    in_progress: false,
    transformScale: function (el, start_x, end_x, start_y, end_y, scale_start, scale_end, duration, easing, start_int) {
        return new Promise(async (resolve, reject) => {
            for(let i = duration; i >= 0; i-= 4) {
                if(start_int !== photosApp.fullscreen.touchstart_int) {
                    break;
                }

                await timeoutAwait(function () {
                    const time = Math.min(1, ((duration - i) / duration));
                    const timeFunction = photosApp.animation.easings[easing](time);

                    const transformX = (timeFunction * (end_x - start_x)) + start_x;
                    const transformY = (timeFunction * (end_y - start_y)) + start_y;
                    const scale = (timeFunction * (scale_end - scale_start)) + scale_start;
                    const transform = `translate3d(${transformX}px, ${transformY}px, 0px) scale(${scale})`;
                    el.style.transform = transform;

                    el.setAttribute('data-x', transformX);
                    el.setAttribute('data-y', transformY);
                    el.setAttribute('data-scale', scale);

                }, 4);
            }

            resolve();
        });
    }
};