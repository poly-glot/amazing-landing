+function ($) {
    'use strict';

    window.ieIE = function() {
        if($('html').is('.ie')) {
            return true;
        }

        if (/MSIE 10/i.test(navigator.userAgent)) {
            return true;
        }

        if(/MSIE 9/i.test(navigator.userAgent) || /rv:11.0/i.test(navigator.userAgent)){
           return true;
        }

        if (/Edge\/12./i.test(navigator.userAgent)){
            return true;
        }
    }


    window.loadScript = function(src,callback){

        var script = document.createElement("script");
        script.type = "text/javascript";

        if(callback) {
            script.onload=callback;
        }

        document.getElementsByTagName("head")[0].appendChild(script);
        script.src = src;
    }


    $(document).ready(function(){


        //Toggle background on modal show/hide
        var site_content = $('.site-content');

        $(document).on('show.bs.modal', function (e) {

            $.Velocity.animate(site_content, {
                opacity: [0.4,1],
                blur: [2, 0]
            }, {
                visibility: "visible",
                duration: 300,
                easing: "easeOutSine"
            });

        });

        $(document).on('hide.bs.modal', function (e) {

            $.Velocity.animate(site_content, {
                opacity: [1,0.4],
                blur: [0, 2]
            }, {
                visibility: "visible",
                duration: 300,
                easing: "easeOutSine"
            });

        });

        var video_markup = '';

        video_markup += '<video width="1024" height="768" autoplay loop poster="' + window.baseurl + 'assets/video/Yellow-Long-1.jpg">';
        video_markup += '   <source src="' + window.baseurl + 'assets/video/Yellow-Long-1.mp4" type="video/mp4"/>';
        video_markup += '   <source src="' + window.baseurl + 'assets/video/Yellow-Long-1.webm" type="video/webm"/>';
        video_markup += '</video>';

        if (window.ieIE()) {
            $('body').addClass('ie');
        }

        $(window).on('load.insert-video', function() {

            if (window.ieIE()) {

                $('.page-questions').css('background', 'none');

                window.BV = new $.BigVideo({useFlashForFirefox:false, controls:false,doloop:true});
                window.BV.init();
                window.BV.show([
                    { type: "video/mp4",  src: window.baseurl + "assets/video/Yellow-Long-1.mp4" },
                    { type: "video/webm", src: window.baseurl + "assets/video/Yellow-Long-1.webm" }
                ], {ambient: true});

            }else{
                $('.background-video').html(video_markup);
            }

            window.loadScript('https://maps.googleapis.com/maps/api/js?signed_in=true&libraries=places&callback=mapLoaded&key=AIzaSyAARy3-Rybhh1o60lzeJfaJiKsnxalRAmI', null);
        });

    });

}(jQuery);