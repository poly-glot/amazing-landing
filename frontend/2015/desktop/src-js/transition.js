+function ($) {

    function PageTransitions() {
        this.pages          = null;
        this.total          = null;
        this.current        = null;

        this.init();
    };

    PageTransitions.DEFAULTS = {
        duration: 750,
        easing: {
            easeout: [0.000, 0.000, 0.580, 1.000]
        }
    };

    PageTransitions.prototype.init = function () {
        this.pages          = $('.pages-container .page');
        this.total          = this.pages.length;
        this.current        = this.pages.filter('.page-current');
    };

    PageTransitions.prototype.next = function (page_animation_object) {
        var that    = this;
        var current = that.current;
        var next    = current.next();

        if(!next) {
            return;
        }

        if(page_animation_object && window[page_animation_object]) {
            window[page_animation_object].init();
        }

        next.addClass('page-entering').removeClass('hidden');
        current.addClass('page-leaving');

        $.Velocity.animate(current, {
            opacity: [0, 1]
        },{
            visibility: "visible",
                duration: PageTransitions.DEFAULTS.duration,
                easing: "easeOutSine"
        }).then(function() {
            current.removeClass('page-current').addClass('hidden');
        });

        $.Velocity.animate(next, {
            opacity: [1, 0]
        }, {
            visibility: "visible",
            duration: PageTransitions.DEFAULTS.duration,
            easing: "easeOutSine"
        }).then(function() {
            next.addClass('page-current').removeClass('page-entering');
            that.current = next;

            if(page_animation_object && window[page_animation_object]) {
                window[page_animation_object].animate();
            }
        });
    };

    $(document).ready(function () {
        //Expose API
        window.pages = new PageTransitions();

        $(document).on('click.next', '[data-next]', function(e) {

            var link = $(e.currentTarget);

            $.Velocity.animate(link, {
                opacity: [0, 1]
            }, {
                visibility: "visible",
                duration: PageTransitions.DEFAULTS.duration,
                easing: "ease-in"
            });

            e.preventDefault();
            window.pages.next(link.data('next'));
            return false;
        });
    });

}(jQuery);