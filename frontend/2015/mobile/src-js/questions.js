$(document).ready(function () {

    var containers = {};
    containers.age = $('#page-questions-age');
    containers.skin = $('#page-questions-skin');
    containers.concern = $('#page-questions-concern');

    var supports_multiple   = false;
    var container           = null;
    var step                = null;
    var question_selection  = [];

    function toggleActiveState(current_selection) {

        if (!supports_multiple) {
            container.find('.question-link.active').not(current_selection).removeClass('active');
        }

        //Add into Selection Stack
        if(!current_selection.hasClass('active')) {
            question_selection.push(current_selection);
        }

        current_selection.toggleClass('active');


        //Ensure only two items can be selected only
        if (supports_multiple) {
            if (container.find('.question-link.active').length > 2) {
                var very_first_selection = question_selection.shift();
                $(very_first_selection).removeClass('active');
            }
        }

        //Toggle Next Button & Also capture user selection for storing/tracking purposes
        var active_answers = container.find('.question-link.active');
        var num_selections = active_answers.length;

        if (!supports_multiple && num_selections > 0) {

            container.find('.two-lines-button').removeClass('disabled');
            container.find('.page-footer').removeClass('disabled');

            window.azadi_customer.capture_selection(step, active_answers.text().trim());

        } else if (supports_multiple && num_selections >= 1) {

            var answers = $.map(active_answers, function (active_answer, i) {
                return $(active_answer).text().trim()
            });

            if (num_selections === 2) {
                container.find('.page-footer').removeClass('disabled');
                container.find('.two-lines-button').removeClass('disabled');
            } else {
                container.find('.page-footer').addClass('disabled');
                container.find('.two-lines-button').addClass('disabled');
            }

            window.azadi_customer.capture_selection(step, answers);

        } else {
            container.find('.page-footer').addClass('disabled');
            container.find('.two-lines-button').addClass('disabled');
        }
    };

    $(document).on('click.question', 'a.question-link', function (e) {
        e.preventDefault();

        step = $(this).data('rel');
        container = containers[step];

        if (step === 'concern') {
            supports_multiple = true;
        } else {
            supports_multiple = false;
        }

        toggleActiveState($(this));

        return false;
    });


    function showAge() {

        var questions = window.questions_map.getAge(window.azadi_customer.age, window.azadi_customer.skin, window.azadi_customer.concern);
        var html = '';

        question_selection = [];

        $.each(questions, function (index, question) {
            if (!question) {
                return;
            }

            html += '<li><a href="#" class="question-link light large text-blue" data-rel="age"><span class="question-text">' + question + '</span></a></li>';
        });

        indicator.set_progress(1);

        $('#page-questions-age .questions').append($(html));

        $.mobile.pageContainer.pagecontainer("change", "#page-questions-age", {
            changeHash: false,
            transition: 'slide'
        });
    };

    function showSkin() {
        var questions = window.questions_map.getSkin(window.azadi_customer.age, window.azadi_customer.skin, window.azadi_customer.concern);
        var html = '';

        question_selection = [];

        $.each(questions, function (index, question) {
            if (!question) {
                return;
            }

            html += '<li><a href="#" class="question-link light large text-blue" data-rel="skin"><span class="question-text">' + question + '</span></a></li>';
        });

        indicator.set_progress(2);

        $('#page-questions-skin .questions').append($(html));

        $.mobile.pageContainer.pagecontainer("change", "#page-questions-skin", {
            changeHash: false,
            transition: 'slide'
        });
    };

    function showConcern() {
        var questions = window.questions_map.getConcerns(window.azadi_customer.age, window.azadi_customer.skin, window.azadi_customer.concern);
        var html = '';

        question_selection = [];

        $.each(questions, function (index, question) {
            if (!question) {
                return;
            }

            html += '<li><a href="#" class="question-link light large text-blue" data-rel="concern"><span class="question-text">' + question + '</span></a></li>';
        });

        indicator.set_progress(3);

        $('#page-questions-concern .questions').append($(html));

        $.mobile.pageContainer.pagecontainer("change", "#page-questions-concern", {
            changeHash: false,
            transition: 'slide'
        });
    };

    function showResults() {

        //Decideing which Product to Render
        var suggested_product = window.azadi_customer.suggested_product();

        //Default for testing
        if(!suggested_product) {
            suggested_product = 'Bloom';
        }

        //Change the background color based on selection
        var bg_maps = {
            'Bloom'    : 'bg-yellow',
            'Glow'   : 'bg-red text-white',
            'Rise'  : 'bg-blue text-white',
            'Silk'      : 'bg-sky text-white'
        };

        var page_results = $('#page-questions-results');

        page_results.removeClass('bg-yellow bg-red bg-blue bg-sky'); //reset
        page_results.addClass(bg_maps[suggested_product]);


        //Change logo color
        var logo_colors = {
            'Bloom'    : 'text-blue',
            'Glow'   : 'text-white',
            'Rise'  : 'text-white',
            'Silk'      : 'text-blue'
        };

        var logo = page_results.find('.site-logo');
        logo.attr('class', 'site-logo ' + logo_colors[suggested_product]);

        var product_div         = page_results.find('#product-' + suggested_product);

        product_title           = product_div.find('.product-title');
        product_image           = product_div.find('.product-image');
        product_description     = product_div.find('.product-description');

        //Insert image dynamically
        var image_url = '/assets/images/products/product-' + suggested_product.toLowerCase() + '.png';
        product_image.html('<img src="' + image_url + '" class="img-responsive" />');

        //Insert Image on Final Page
        var image_url = '/assets/images/voucher-products/mobile/product-' + suggested_product.toLowerCase() + '.png';
        $('.page-voucher .final-product').html('<img src="' + image_url + '" class="img-responsive" />');

        product_div.removeClass('hidden');

        $.mobile.pageContainer.pagecontainer("change", "#page-questions-results", {
            changeHash: false,
            transition: 'slide'
        });
    }

    $('.next-question').on('click', function (e) {
        e.preventDefault();

        if($(this).hasClass('disabled')) {
            return;
        }

        var step = $(this).data('rel');

        if (step === 'show-age') {
            showAge();
        } else if (step === 'show-skin') {
            showSkin();
        } else if (step === 'show-concern') {
            showConcern();
        } else if (step === 'show-results') {
            showResults();
        } else if(step === 'show-voucher') {

            MasterTmsUdo = {};
            MasterTmsUdo['questionnaireFormCompleted'] = '1';
            window.captureTracking();

            var store = window.stores_map.get_by_id(window.azadi_customer.store_id);
            if(store)
            {
                MasterTmsUdo = {};
                MasterTmsUdo['nearestStore'] = store.address;
                captureTracking();
            }

            window.azadi_api.sendCustomerEmail().done(function(response) {
                if (response && response.email_preview_url) {
                    window.azadi_customer._email_preview_url = response.email_preview_url;
                }
            });
            showVoucher();
        }

        return false;
    });

    window.showAge      = showAge;
    window.showSkin     = showSkin;
    window.showConcern  = showConcern;
    window.showResults  = showResults;
    window.showVoucher  = showVoucher;
});