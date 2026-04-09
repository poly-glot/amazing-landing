+function ($) {
    'use strict';

    var indicator_dom  = null;
    var indicator_dots = null;
    var is_init        = null;

    var Azadi_Indicator = function () {

    };

    Azadi_Indicator.DEFAULTS = {
        duration: 1000,
        easing: {
            easeout: [0.000, 0.000, 0.580, 1.000]
        }
    };

    Azadi_Indicator.prototype.init = function () {

    };

    Azadi_Indicator.prototype.show = function () {

        $.Velocity.animate(indicator_dom, {
            opacity: [1,0],
            blur: [0, 10],
            translateY: [0, -500]
        }, {
            visibility: "visible",
            duration: Azadi_Indicator.DEFAULTS.duration,
            easing: "easeOutSine"
        }).then(function() {

            if(!is_init) {
                window.indicator.set_progress(1);
                is_init = 1;
            }
        });

    };

    Azadi_Indicator.prototype.set_progress = function (progress_num) {

        for(var i = 0; i < progress_num; i++) {
            $(indicator_dots[i]).addClass('ind-col-active');
        }
    };

    Azadi_Indicator.prototype.hide = function () {

        $.Velocity.animate(indicator_dom, {
            opacity: [0,1],
            blur: [10, 0],
            translateY: [-500, 0]
        }, {
            visibility: "visible",
            duration: Azadi_Indicator.DEFAULTS.duration,
            easing: "easeOutSine"
        }).then(function() {

        });

    };

    $(document).ready(function(){
        indicator_dom  = $('.indicator');
        indicator_dots = indicator_dom.find('.ind-col').toArray();

        window.indicator = new Azadi_Indicator();
    });

}(jQuery);