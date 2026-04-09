+function ($) {
    'use strict';

    var stripes              = [];
    var products             = [];
    var products_backgrounds = [];

    var landing_introduction = null;

    function showConfigError(what) {
        console.error('[Boot] Failed to load ' + what + ' from server');
        var el = document.createElement('div');
        el.style.cssText = 'position:fixed;top:0;left:0;right:0;padding:14px 20px;background:#c0392b;color:#fff;font-family:sans-serif;font-size:14px;text-align:center;z-index:99999';
        el.textContent = 'Unable to load ' + what + '. Please refresh the page or try again later.';
        document.body.insertBefore(el, document.body.firstChild);
    }
    var logo                 = null;
    var cta_text             = null;
    var cta_button           = null;

    var last_stripe             = null;
    var strip_initial_position  = 0;
    var legal_links             = null;

    /**
     * Logic
     *
     * Animate strips first, when it reaches to last animate
     * then animate products, along with background
     *
     * Values written as [1,0] for animation are force feeding, which provide inital
     * and final animated values [final_value, inital_value]
     *
     */

    var animate_strips = function () {

        var items = stripes.length;

        if(last_stripe) {
            $(last_stripe).removeClass('animating');
        }

        if(items === 0) {
            return;
        }

        if(items === 1) {
            animate_products();
        }

        last_stripe = stripes.shift();

        $(last_stripe).addClass('animating');

        $.Velocity.animate(last_stripe, {
            translateZ: 0,
            translateX: [0, strip_initial_position]
        },
        {
            visibility:"visible",
            duration:Azadi_Landing.DEFAULTS.duration,
            easing: Azadi_Landing.DEFAULTS.easing.easeout
        }).then(animate_strips);
    };

    var animate_products = function() {

        var items = products.length;

        if(items === 0) {
            return;
        }

        if(items === 1) {
            animate_tag_lines_and_logo();
        }

        var product = products.shift();

        var $bg     = $(products_backgrounds.shift());

        $bg.velocity({
            opacity: 0.4,
            right: [$bg.data('initial-right'), '-50%']
        },
        {
                visibility:"visible",
                duration:Azadi_Landing.DEFAULTS.duration + 150
        });

        $.Velocity.animate(product, {
                opacity:    [1, 0],
                scaleX:     [1, 0],
                scaleY:     [1, 0],
                blur:       [0, 10]
            },
            {
                visibility:"visible",
                duration:Azadi_Landing.DEFAULTS.duration,
                easing: [0.000, 0.560, 0.500, 0.995]
            }).then(animate_products);

    };

    var animate_tag_lines_and_logo = function() {

        $.Velocity.animate(logo, {
            opacity: [1,0]
        }, {
            visibility: "visible",
            duration: Azadi_Landing.DEFAULTS.duration * 2.5,
            easing: [0.000, 0.560, 0.500, 0.995]
        });

        $.Velocity.animate(landing_introduction, {
            opacity: [1,0],
            blur: [0, 10],
            translateY: [0, -500]
        }, {
            visibility: "visible",
            duration: Azadi_Landing.DEFAULTS.duration * 2.5,
            easing: [0.000, 0.560, 0.500, 0.995]
        });

        $.Velocity.animate(cta_text, {
            opacity: [1,0],
            blur: [0, 10],
            translateY: [0, 200]
        }, {
            visibility: "visible",
            duration: Azadi_Landing.DEFAULTS.duration * 2.5,
            easing: [0.000, 0.560, 0.500, 0.995]
        }).then(animate_cta_button);
    };


    var animate_cta_button = function() {

        $.Velocity.animate(cta_button, {
            opacity: [1,0],
            blur: [0, 10],
            scaleX: [1, 0],
            scaleY: [1, 0]
        }, {
            visibility: "visible",
            duration: Azadi_Landing.DEFAULTS.duration,
            easing: "easeOutSine"
        });

        $.Velocity.animate(legal_links, {
            opacity: [1,0]
        }, {
            visibility: "visible",
            duration: Azadi_Landing.DEFAULTS.duration,
            easing: "easeOutSine"
        });

    };


    var Azadi_Landing = function () {

    };

    Azadi_Landing.DEFAULTS = {
        duration: 300,
        easing: {
            easeout: [0.000, 0.000, 0.580, 1.000]
        }
    };

    Azadi_Landing.prototype.init = function () {
        stripes                 = $('.page-landing .strips-container .absolute-bg-container');
        products                = $('.page-landing .landing-products .landing-item');
        products_backgrounds    = $('.page-landing .strips-container .product-bg');

        strip_initial_position  = stripes.width() * -1;

        stripes.css('visibility', 'hidden');
        products.css('visibility', 'hidden');

        products_backgrounds.css('visibility', 'hidden');
        products_backgrounds.css('opacity', 0);

        landing_introduction    = $('.page-landing .landing-introduction');
        logo                    = $('.site-logo');
        cta_text                = $('.page-landing .cta-text');
        cta_button              = $('.page-landing .two-lines-button');
        legal_links             = $('.page-landing .legal-links')

        landing_introduction.css('visibility', 'hidden');
        logo.css('visibility', 'hidden');
        cta_text.css('visibility', 'hidden');
        cta_button.css('visibility', 'hidden');
        legal_links.css('visibility', 'hidden');

        //Convert them to Array for Animation
        stripes                 = stripes.toArray();
        products                = products.toArray();
        products_backgrounds    = products_backgrounds.toArray();
    };

    Azadi_Landing.prototype.animate = function () {
        animate_strips();
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
            $.Velocity.animate($('#main-loader'), {
                opacity: [0,1]
            },{
                display: "none",
                duration: 300,
                easing: "ease-out"
            }).then(function(){
                $('#main-loader').remove();
                window.landing.animate();
            });
        });

        promotion.fail(function() {
           document.location = 'https://www.azadi.com/';
        });
    })

}(jQuery);