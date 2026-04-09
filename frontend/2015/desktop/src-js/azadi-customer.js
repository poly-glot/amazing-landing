+function ($) {
    'use strict';

    var customer_form       = null;
    var input_first_name    = null;
    var input_last_name     = null;
    var input_email         = null;
    var input_subscribe     = null;
    var input_terms         = null;

    var submit_button       = null;

    var loader              = null;

    var customer_to_form_fields = {
        'firstname'     : 'first_name',
        'lastname'      : 'last_name',
        'email'         : 'email',
        'accept_terms'  : 'terms',
        'address'       : 'location'
    };

    var customer_to_input_fields = {
        'firstname'     : null,
        'lastname'      : null,
        'email'         : null,
        'accept_terms'  : null,
        'address'       : null
    };

    function show_loader() {
        $.Velocity.animate(loader, {
            opacity: [1,0]
        },{
            display: "block",
            duration: 300,
            easing: "ease-in"
        });
    }

    function hide_loader() {
        $.Velocity.animate(loader, {
            opacity: [0,1]
        },{
            display: "none",
            duration: 300,
            easing: "ease-out"
        });
    }

    function captureTracking() {

        if(MasterTmsUdo) {

            if(MasterTmsUdo.questionOneAnswer) {

                ga('set', {
                    page: tracking_url + 'question1',
                    title: 'Just between us, what is your age group?'
                });

                ga('send', 'pageview');
                ga('send', 'event', 'age_group', MasterTmsUdo.questionOneAnswer);

            }else if(MasterTmsUdo.questionTwoAnswer) {

                ga('set', {
                    page: tracking_url + 'question2',
                    title: 'How would you describe your skin?'
                });

                ga('send', 'pageview');
                ga('send', 'event', 'skin',  MasterTmsUdo.questionTwoAnswer, 1);

            }else if(MasterTmsUdo.questionThreeAnswer) {

                ga('set', {
                    page: tracking_url + 'question3',
                    title: 'What are your 2 main skin concerns?'
                });

                ga('send', 'pageview');
                ga('send', 'event', 'concern', MasterTmsUdo.questionThreeAnswer, 1);

            }else if(MasterTmsUdo.nearestStore) {

                ga('set', {
                    page: tracking_url + 'store-locator',
                    title: 'Store Locator'
                });

                var store_id    = 0;
                var store       = window.stores_map.get_by_id(window.azadi_customer.store_id);
                if(store)
                {
                    store_id = store.id;
                }

                ga('send', 'pageview');
                ga('send', 'event', 'storelookup',  MasterTmsUdo.nearestStore, store_id);

            }else if(MasterTmsUdo.questionnaireFormCompleted) {

                ga('set', {
                    page: tracking_url + 'completed',
                    title: 'Questionnaire Form Completed'
                });

                ga('send', 'pageview');
                ga('send', 'event', 'user',  window.azadi_customer.email);

            }else if(MasterTmsUdo.skincareRecommendationResult) {

                ga('set', {
                    page: tracking_url + 'voucher',
                    title: 'Get Your Voucher'
                });

                ga('send', 'pageview');
                ga('send', 'event', 'recommendation',  MasterTmsUdo.skincareRecommendationResult);

            }
        }

        try {
            /*DO NOT ALTER *** Azadi*/
            (function(e){var t="1926",n=document,r,i,s={http:"http://cdn.mplxtms.com/s/MasterTMS.min.js",https:"https://secure-cdn.mplxtms.com/s/MasterTMS.min.js"},o=s[/\w+/.exec(window.location.protocol)[0]];i=n.createElement("script"),i.type="text/javascript",i.async=!0,i.src=o+"#"+t,r=n.getElementsByTagName("script")[0],r.parentNode.insertBefore(i,r),i.readyState?i.onreadystatechange=function(){if(i.readyState==="loaded"||i.readyState==="complete")i.onreadystatechange=null}:i.onload=function(){try{e()}catch(t){}}})(function(){});
        }
        catch(err) {

        }
    }

    window.captureTracking = captureTracking;


    function toggleSubmitButton() {

        var customer = window.azadi_customer;
        var valid    = true;

        $.each(['firstname', 'lastname', 'email', 'accept_terms', 'address'], function(index, input_name){
            if(!customer[input_name] || customer[input_name].length === 0) {
                valid = false;
            }else{

                //Remove popover as user has filled the value
                var popover_container = customer_to_input_fields[input_name].parent();
                if(popover_container.hasClass('has-error')) {
                    popover_container.popover('destroy');
                    popover_container.removeClass('has-error');
                }

            }
        });

        if(valid) {
            submit_button.removeClass('disabled');
        }else{
            submit_button.addClass('disabled');
        }
    }

    function onCustomerFormSubmit() {
        var customer    = window.azadi_customer;
        var results     = window.results;

        //Hide All Popovers
        customer_form.find('.has-error').each(function() {
           $(this).popover('destroy');
        });

        //Pre-validation
        var valid   = true;

        //Wait for Existing Popovers removed
        setTimeout(function() {

            $.each(['firstname', 'lastname', 'email', 'accept_terms', 'address'], function(index, input_name){
                if(!customer[input_name] || customer[input_name].length === 0) {
                    valid = false;

                    results.show_error(customer_to_form_fields[input_name], 'Mandatory field');
                }else if(input_name === 'email') {

                    if(customer[input_name].indexOf('@') < 0) {
                        valid = false;
                        results.show_error(customer_to_form_fields[input_name], 'Invalid Email format');
                    }

                }
            });

            if(!valid) {
                return false;
            }


            //Submit :: No Error found
            show_loader();

            var submit = window.azadi_api.storeCustomer();

            submit.done(function(response) {
                if(response.error) {
                    $.each(response.error, function(index, error){

                        if(index === 'promotion_link') {
                            alert(error[0]);
                            document.location = 'https://uk.azadi.com/';
                            return;
                        }

                        if(index === 'country') {
                            index = 'location'
                        }

                        window.results.show_error(index, error[0]);
                    });
                    return;
                }

                if (response.submission_id) {
                    window.azadi_customer.submission_id = response.submission_id;
                }

                window.results.show_stores();
            });

            submit.fail(function(error){
                console.log(error);
            });

            submit.always(function(){
                hide_loader();
            });

        }, 400);


    };

    function onCustomerFormChange() {

        window.azadi_customer.firstname      = input_first_name.val();
        window.azadi_customer.lastname       = input_last_name.val();
        window.azadi_customer.email          = input_email.val();
        window.azadi_customer.subscribe      = input_subscribe.is(':checked');
        window.azadi_customer.accept_terms   = input_terms.is(':checked');

        toggleSubmitButton();
    };

    var Azadi_Customer = function () {
        this.firstname      = null;
        this.lastname       = null;
        this.email          = null;
        this.subscribe      = null;
        this.accept_terms   = null;

        this.age            = '';
        this.skin           = '';
        this.concern_1      = null;
        this.concern_2      = null;
        this.product        = null;
        this.store_id       = null;
        this.address        = null;
        this.country        = null;
        this.lng            = null;
        this.lat            = null;

        this.promotion_link = main_promotion_slug;
    };

    Azadi_Customer.prototype.capture_selection = function (question, answer) {
        if(!answer) {
            return;
        }

        this[question] = answer;

        //Tracking
        var customer_to_tracking = {
            'age'       : 'questionOneAnswer',
            'skin'      : 'questionTwoAnswer',
            'concern'   : 'questionThreeAnswer',
            'concern_1' : 'questionThreeAnswer',
            'concern_2' : 'questionThreeAnswer',
            'concerns'  : 'questionThreeAnswer'
        };

        if(typeof answer === 'array') {
            answer = answer.join('|');
        }

        MasterTmsUdo = {};
        MasterTmsUdo[customer_to_tracking[question]] = answer;
        captureTracking();
    };

    Azadi_Customer.prototype.suggested_product = function () {
        this.product = (this.product ? this.product : window.questions_map.getProduct(this.age, this.concern));
        return this.product;
    };

    Azadi_Customer.prototype.submit_form = function () {
        customer_form.trigger('submit');

        MasterTmsUdo = {};
        MasterTmsUdo['questionnaireFormCompleted'] = '1';
        captureTracking();
    };

    Azadi_Customer.prototype.update_store = function () {
        //var submit = window.azadi_api.updateCustomerStore();
    };



    Azadi_Customer.prototype.set_address = function (address_obj) {

        this.address    = address_obj.address;
        this.country    = address_obj.country;
        this.lat        = address_obj.lat;
        this.lng        = address_obj.lng;
        this.store_id   = address_obj.store_id;

        //Force to see if we need to enable submit button
        onCustomerFormChange();
    };

    window.azadi_customer = new Azadi_Customer();

    $(document).ready(function () {
        customer_form = $('#customer-information-form');

        input_first_name    = customer_form.find('#first_name');
        input_last_name     = customer_form.find('#last_name');
        input_email         = customer_form.find('#email');
        input_subscribe     = customer_form.find('#subscribe');
        input_terms         = customer_form.find('#terms');

        loader              = $('.customer-information .loader-container');

        submit_button       = customer_form.find('.two-lines-button');

        customer_to_input_fields = {
            'firstname'     : input_first_name,
            'lastname'      : input_last_name,
            'email'         : input_email,
            'accept_terms'  : input_terms,
            'address'       : customer_form.find('#location')
        };

        //Submit Button
        submit_button.on('click', function (e) {
            e.preventDefault();

            onCustomerFormSubmit();

            return false;
        });

        //Event Handling
        customer_form.on('submit', function (e) {
            e.preventDefault();
            onCustomerFormSubmit();
            return false;
        });

        customer_form.on('change', onCustomerFormChange);
    });

}(jQuery);