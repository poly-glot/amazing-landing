+function ($) {
    'use strict';

    function twitter() {

        var twitter_link = $('.share-this .social-link-twitter');
        var twitter_text = "I got " + azadi_customer.product + ", what will you get? Start your FREE Azadi 7-Day skincare trial now! #MyBeautyStory";
        var url          = getUrl();

        var twitter_share = "https://twitter.com/intent/tweet?" + $.param({
               text:        twitter_text,
               url:         url,
               hashtags:    'MyBeautyStory'
            });

        twitter_link.attr('href', twitter_share);
        twitter_link.attr('target', '_blank');

        window.twttr = (function(d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0],
                t = window.twttr || {};
            if (d.getElementById(id)) return t;
            js = d.createElement(s);
            js.id = id;
            js.src = "https://platform.twitter.com/widgets.js";
            fjs.parentNode.insertBefore(js, fjs);

            t._e = [];
            t.ready = function(f) {
                t._e.push(f);
            };

            return t;
        }(document, "script", "twitter-wjs"));
    }

    function facebook() {

        var facebook_link = $('.share-this .social-link-facebook');
        var url           = getUrl();

        window.fbAsyncInit = function() {
            FB.init({
                appId      : '207959006000015',
                xfbml      : true,
                version    : 'v2.4'
            });
        };

        (function(d, s, id){
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) {return;}
            js = d.createElement(s); js.id = id;
            js.src = "//connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));

        var share_link = "https://www.facebook.com/sharer/sharer.php?" + $.param({
                u: url
            });

        facebook_link.attr('data-url', url);
        facebook_link.attr('data-layout', 'link');

        facebook_link.attr('href', share_link)
        facebook_link.attr('target', '_blank');

        facebook_link.on('click', function(e) {
            e.preventDefault();

            FB.ui({
                    method: 'share',
                    href: url
            });

            return false;
        });
    }

    function getUrl() {
        return basehost + '/share/' + main_promotion_slug + '/' + azadi_customer.product.toLocaleLowerCase() + '/' + azadi_customer.country.toLocaleLowerCase();
    }

    window.enableSharing = function() {
        twitter();
        facebook();
    };

}(jQuery);