+function ($) {
    'use strict';

    var indicator_dom  = null;
    var indicator_dots = null;
    var is_init        = null;

    var Azadi_Indicator = function () {

    };

    Azadi_Indicator.prototype.init = function () {

    };

    Azadi_Indicator.prototype.show = function () {


    };

    Azadi_Indicator.prototype.set_progress = function (progress_num) {

        for(var i = 0; i < progress_num; i++) {
            $(indicator_dots[i]).addClass('ind-col-active');
        }
    };

    Azadi_Indicator.prototype.hide = function () {

    };

    $(document).ready(function(){
        indicator_dom  = $('.indicator');
        indicator_dots = indicator_dom.find('.ind-col').toArray();

        window.indicator = new Azadi_Indicator();
    });

}(jQuery);