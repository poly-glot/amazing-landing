+function ($) {
    'use strict';

    function showConfigError(what) {
        console.error('[Boot] Failed to load ' + what + ' from server');
        var el = document.createElement('div');
        el.style.cssText = 'position:fixed;top:0;left:0;right:0;padding:14px 20px;background:#c0392b;color:#fff;font-family:sans-serif;font-size:14px;text-align:center;z-index:99999';
        el.textContent = 'Unable to load ' + what + '. Please refresh the page or try again later.';
        document.body.insertBefore(el, document.body.firstChild);
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

    var Azadi_Landing = function () {

    };

    Azadi_Landing.prototype.init = function () {
        $('#show-questions').on('click.next', function(e){
            e.preventDefault();

            //Prepare Questions

            return false;
        });
    };

    Azadi_Landing.prototype.animate = function () {

    };

    $(document).ready(function(){
        window.landing = new Azadi_Landing();
        window.landing.init();
    });

    $(window).on('load', function() {

        //Check Promotion Exists
        var promotion = azadi_api.getPromotion();
        promotion.done(function(p){

            if(!p) {
                document.location = 'https://uk.azadi.com/';
                return;
            }

            //Load Stores Now
            var stores = azadi_api.getStores();
            stores.done(function(stores){
                window.stores_map.update(stores);
            });

            stores.fail(function(error){
                console.log(error);
            });

            // Load admin-configured questions + products — required in production
            azadi_api.getQuestions().done(function(c){
                if(window.applyBackendQuestionConfig) window.applyBackendQuestionConfig(c);
            }).fail(function(){
                showConfigError('quiz questions');
            });
            azadi_api.getProducts().done(function(products){
                if(window.applyBackendProducts) window.applyBackendProducts(products);
            }).fail(function(){
                showConfigError('product recommendations');
            });

            //Remove Main Loader
            $('#main-loader').fadeOut('fast', function() {
               //Show Page Now

            });
        });

        promotion.fail(function() {
            document.location = 'https://uk.azadi.com/';
        });
    })

}(jQuery);