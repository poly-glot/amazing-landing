+function ($) {
    'use strict';

    var section_title   = null;
    var questions       = [];
    var cta_button      = null;
    var all_questions   = null;
    var grid            = null;
    var grid_items      = null;

    var next_enabled        = false;
    var supports_multiple   = false;

    var steps           = [];
    var step            = null;
    var current_step    = 0;

    var question_selection = [];

    steps[0] = {
        title_css    : 'section-title section-title-1 center-block light',
        title        : 'Just between us,<br />what is your age group?',
        options      : 'getAge',
        answer       : null,
        customer_key : 'age',
        multiple     : false
    };

    steps[1] = {
        title_css    : 'section-title section-title-2 center-block light',
        title        : 'How would you<br />describe your skin?',
        options      : 'getSkin',
        answer       : null,
        customer_key : 'skin',
        multiple     : false
    };

    steps[2] = {
        title_css    : 'section-title section-title-3 center-block light',
        title        : 'What are your 2<br />main skin concerns?',
        options      : 'getConcerns',
        answer       : null,
        customer_key : 'concern',
        multiple     : true
    };

    /**
     * Logic
     *
     * Animate section_title
     * Animate Questions
     *
     */

    var show_header = function() {

        return $.Velocity.animate(section_title, {
            opacity: [1,0],
            blur: [0, 10],
            translateY: [0, -500]
        }, {
            visibility: "visible",
            duration: Azadi_Questions.DEFAULTS.duration,
            easing: "easeOutSine"
        });

    };

    var hide_header = function() {

        return $.Velocity.animate(section_title, {
            opacity: [0,1],
            blur: [10, 0],
            translateY: [-500, 0]
        }, {
            visibility: "hidden",
            duration: Azadi_Questions.DEFAULTS.duration,
            easing: "easeOutSine"
        });

    };

    var show_questions = function() {

        question_selection      = [];
        var dfd                 = jQuery.Deferred();
        var items               = questions.length;

        if(items === 0) {

            dfd.resolve( questions );
            return dfd.promise();
        }

        var last_index = questions.length - 1;

        $.each(questions, function(index, elem){

            $.Velocity.animate(elem, {
                    scale: [1, 0.4],
                    blur: [0,8],
                    opacity: [1, 0.6],
                    rotateZ: 0
                },
                {
                    visibility:"visible",
                    duration: 300,
                    delay: index * 100,
                    easing: [0.175, 0.885, 0.32, 1.275],
                    complete: function() {
                        setTimeout(function() {
                            var class_id = '#question-item-' + elem.prop('rel');

                            $(class_id).css('visibility', 'visible');
                            $(elem).removeClass('animating');

                        }, 1);
                    }
                });


            if(index === last_index) {
                dfd.resolve( questions );
            }
        });

        return dfd.promise();
    };

    var hide_questions = function() {

        var items = questions.length;

        if(items === 0) {
            return;
        }

        questions = questions.reverse();

        $.each(questions, function(index, elem){

            var $elem           = $(elem);
            var diamond_grid    = grid_items.eq($elem.index());

            $(diamond_grid).css('visibility', 'hidden');
            $elem.addClass('animating');

            $.Velocity.animate(elem, {
                    blur:[10, 0],
                    scale: [0.4, 1],
                    opacity: [0.8, 1]
                },
                {
                    visibility:"hidden",
                    duration: 150,
                    delay: index * 100,
                    easing: 'easeOutSine'
                });

        });

    };


    var next_set_of_questions = function() {
        step = steps[current_step];

        if(!step) {
            goto_results_page();
            return;
        }

        supports_multiple = step.multiple;

        section_title.removeClass().addClass(step.title_css);
        section_title.find('.section-title-text').html(step.title);

        indicator.set_progress((current_step + 1));

        $('#all-questions-container').removeClass().addClass('step-' + (current_step + 1));

        //Add Age for CSS Fix of Questions and Next Button
        if(step.customer_key !== 'age') {
            var age_css = window.azadi_customer.age;
            age_css     = age_css.toLowerCase().replace(/ /g,'-').replace(/[^\w-]+/g,'');

            $('#all-questions-container').addClass('age-' + age_css);
        }


        //Find New Questions
        if(typeof window.questions_map[step.options] === 'function') {
            var new_questions = window.questions_map[step.options](window.azadi_customer.age, window.azadi_customer.skin, window.azadi_customer.concern);

            if(new_questions) {

                questions = [];

                //Reset Questions
                $('.page-questions .questions-container .question-item-container.active').removeClass('active');

                $.each(grid_items, function(index, grid_diamond){
                    grid_diamond.setAttribute('class', 'item question-item-' + ($(grid_diamond).index() + 1));
                });

                $.each(new_questions, function(key, value) {

                    var question_item = $('.page-questions .questions-container .' + key);
                    question_item.find('.question-text-inner').html(value);

                    questions.push(question_item);
                });
            }
            show_header().then(show_questions);
        }

        current_step++;
    };


    var goto_results_page = function() {

        window.questions.disable_next()
            .then(hide_questions)
            .then(hide_header)
            .then(function(){
                if (window.ieIE()) {
                    window.BV.getPlayer().pause();
                }else{
                    $('.background-video').empty();
                }

                window.pages.next('results');
            });

    };

    window.goto_results_page = goto_results_page;

    var Azadi_Questions = function () {

    };

    Azadi_Questions.DEFAULTS = {
        duration: 1000,
        easing: {
            easeout: [0.000, 0.000, 0.580, 1.000]
        }
    };

    Azadi_Questions.prototype.init = function () {
        section_title            = $('.page-questions .section-title');
        all_questions            = $('.page-questions .questions-container .question-item-container');
        grid_items               = grid.find('.item');
        cta_button               = $('.page-questions .two-lines-button');

        section_title.css('visibility', 'hidden');
        all_questions.css('visibility', 'hidden');
        cta_button.css('visibility', 'hidden');
    };

    Azadi_Questions.prototype.animate = function () {
        window.indicator.show();
        this.init_next_step();
    };


    Azadi_Questions.prototype.enable_next = function() {


        //Tracking
        var customer_to_tracking = {
            'age'       : 'questionOneComplete',
            'skin'      : 'questionTwoComplete',
            'concern'   : 'questionThreeComplete',
            'concern_1' : 'questionThreeComplete',
            'concern_2' : 'questionThreeComplete',
            'concerns'  : 'questionThreeComplete'
        };

        if(typeof answer === 'array') {
            answer = answer.join('|');
        }

        //Already visible
        if(next_enabled) {
            return;
        }

        next_enabled = true;

        cta_button.show();

        return $.Velocity.animate(cta_button, {
            opacity: [1,0],
            blur: [0, 10],
            translateY: [0, 200]
        }, {
            visibility: "visible",
            duration: 300,
            easing: "easeOutSine"
        });

    };

    Azadi_Questions.prototype.disable_next = function() {

        return $.Velocity.animate(cta_button, {
            opacity: [0,1],
            blur: [10, 0],
            translateY: [200, 0]
        }, {
            visibility: "hidden",
            duration: 300,
            easing: "easeOutSine"
        }).then(function(){
            next_enabled = false;
            cta_button.hide();
        });

    };

    Azadi_Questions.prototype.init_next_step = function() {

        //Hide Existing
        if(questions.length > 0) {

            this.disable_next()
                .then(hide_questions)
                .then(hide_header)
                .then(function(){
                    next_set_of_questions();
                });

            return;
        }

        next_set_of_questions();
    };

    $(document).ready(function(){

        //SVG Grid
        grid = $('#questions_grid');

        //Hover Support
        $( ".question-text").each(function(){
            $(this).prop('rel', $(this).data('rel'));
        });


        //Hover Support along with maintaining active state
        $( ".question-text" ).hover(
            function() {
                var class_id = 'question-item-' + $( this).prop('rel');
                var elem     = grid.find('#' + class_id).get(0);

                var existing_classes = elem.getAttribute('class');
                if(existing_classes.indexOf('active') >  -1) {
                    elem.setAttribute('class', 'item hover active ' + class_id);
                }else{
                    elem.setAttribute('class', 'item hover ' + class_id);
                }

            }, function() {
                var class_id        = 'question-item-' + $( this).prop('rel');
                var elem            = grid.find('#' + class_id).get(0);

                var existing_classes = elem.getAttribute('class');
                if(existing_classes.indexOf('active') >  -1) {
                    elem.setAttribute('class', 'item active ' + class_id);
                }else{
                    elem.setAttribute('class', 'item ' + class_id);
                }

            }
        );

        //Animation Support
        $('.question-text').css('visibility', 'hidden');
        $('.item').css('visibility', 'hidden');


        //Handle Next
        $('.page-questions .two-lines-button').on('click', function(e) {
            e.preventDefault();

            window.questions.init_next_step();

            return false;
        });


        //Data Capture & Next Stages
        function toggleActiveState(current_selection) {

            if(!supports_multiple) {
                var last_active = all_questions.filter('.active').not(current_selection);

                if(last_active.length > 0) {
                    //Ensure to activate relative svg background as well.
                    var index        = last_active.index();
                    var grid_diamond = grid_items.eq(index).get(0);

                    if(grid_diamond) {
                        if(current_selection.hasClass('active')) {
                            grid_diamond.setAttribute('class', 'item active question-item-' + (index + 1));
                        }else{
                            grid_diamond.setAttribute('class', 'item question-item-' + (index + 1));
                        }
                    }

                    last_active.removeClass('active');
                }
            }

            //Add into Selection Stack
            if(!current_selection.hasClass('active')) {
                question_selection.push(current_selection);
            }

            current_selection.toggleClass('active');

            //Ensure to activate relative svg background as well.
            var index        = current_selection.index();
            var grid_diamond = grid_items.eq(index).get(0);

            if(grid_diamond) {
                if(current_selection.hasClass('active')) {
                    grid_diamond.setAttribute('class', 'item active question-item-' + (index + 1));
                }else{
                    grid_diamond.setAttribute('class', 'item question-item-' + (index + 1));
                }
            }

            //Ensure only two items can be selected only
            if(supports_multiple){
                if(all_questions.filter('.active').length > 2) {
                    var very_first_selection = question_selection.shift();
                    var index                = $(very_first_selection).index();

                    $(very_first_selection).removeClass('active');

                    var grid_diamond = grid_items.eq(index).get(0);

                    if(grid_diamond) {
                        grid_diamond.setAttribute('class', 'item question-item-' + (index + 1));
                    }
                }
            }

            //Toggle Next Button & Also capture user selection for storing/tracking purposes
            var active_answers = all_questions.filter('.active');
            var num_selections = active_answers.length;

            if(!supports_multiple && num_selections > 0) {

                window.questions.enable_next();
                window.azadi_customer.capture_selection(step.customer_key, active_answers.text().trim());

            }else if(supports_multiple && num_selections >= 1) {

                var answers = $.map( active_answers, function( active_answer, i ) {
                    return $(active_answer).text().trim()
                });

                if(num_selections === 2) {
                    window.questions.enable_next();
                }else{
                    window.questions.disable_next();
                }

                window.azadi_customer.capture_selection(step.customer_key, answers);

            }else{
                window.questions.disable_next();
            }
        };

        //Click Support
        grid.on('click', '.item', function(e){
            toggleActiveState(all_questions.eq($(this).index()));
            return false;
        });

        $( ".question-text").on('click', function(e){
            toggleActiveState($(this));
            return false;
        });


        $(document).on('click.close-icon', '.close-icon', function(e) {

            e.preventDefault();

            toggleActiveState($(this).parent());

            return false;
        });

        window.questions = new Azadi_Questions();
    });

}(jQuery);