+function ($) {
    'use strict';

    var form = null;
    var page = null;

    var product_title           = null;
    var product_image           = null;
    var product_description     = null;

    var page_sequence           = [];
    var store_items             = null;

    var autocomplete            = null;

    var is_swapped              = false;

    var populate_stores = function() {

        if(is_swapped) {
            var existing_carousel = store_items.data('owlCarousel');
            if(existing_carousel) {
                existing_carousel.destroy();
            }
        }

        var current_item    = page.find('#current-store-index');

        current_item.text(1);
        page.find('#total-stores').text(store_items.find('.store-item').length);

        if(store_items.find('.store-item').length > 1) {
            store_items.owlCarousel({
                items:1,
                nav:true,
                margin:0,
                autoplay:false,
                navText: ['<svg class="prev-icon"><use xlink:href="#arrow-prev"></use></svg>', '<svg class="next-icon"><use xlink:href="#arrow-next"></use></svg>']
            });

            store_items.on('changed.owl.carousel', function(e){
                current_item.text(e.page.index + 1);

                //Update Store
                var new_store_id = store_items.find('.store-item').eq(e.page.index).data('id');

                if(new_store_id) {
                    window.azadi_customer.store_id = new_store_id;
                    window.azadi_customer.update_store();
                }
            });
        }

    };

    window.populate_stores = populate_stores;

    function goto_voucher_page() {
        window.pages.next('voucher');
    };


    function onAddressSelected() {
        var place = autocomplete.getPlace();
        if (!place.geometry) {
            window.results.show_error('location', 'We could not find your location. Make sure your search is spelled correctly. Try adding a city, town, or postcode.');
            return;
        }

        var stores = stores_map.get_by_geocode({lat: place.geometry.location.lat(), lng: place.geometry.location.lng()});
        window.insert_stores(stores);

        var country = 'GB';

        $.each(place.address_components, function(index, address_part){

            if($.inArray('country', address_part.types) === -1) {
                return;
            }

            country = address_part.short_name;
        });

        var store_id = null;

        if(stores.length > 0) {
            store_id = stores[0].id;

            window.azadi_customer.set_address({
                address:    place.formatted_address,
                country:    country,
                lat:        place.geometry.location.lat(),
                lng:        place.geometry.location.lng(),
                store_id:   store_id
            });

            if(is_swapped) {
                populate_stores();
            }

            return;
        }

        window.results.show_error('location', 'Sorry, We were unable to find any parcipating stores for specified location.');
    };

    window.insert_stores = function(stores) {
        store_items.empty();

        var store_markup = '';

        $.each(stores, function(index, store){


            store_markup += '  <div class="store-item" data-id="' + store.id + '">';

            store_markup += '   <div class="row">';
            store_markup += '   <div class="col-sm-5">';
            store_markup += '       <a href="' + store.map_link  +'" class="store-image" target="_blank">';
            store_markup += '       <img src="' + store.image + '" alt="" />';
            store_markup += '       </a>';
            store_markup += '   </div>';

            store_markup += '   <div class="col-sm-7">';
            store_markup += '           <p>';
            store_markup += '               <b class="store-name">' + store.town + '</b><br />';
            store_markup += '               <span class="store-address">' + store.address + '</span>';
            store_markup += '           </p>';

            store_markup += '           <a href="' + store.map_link +'" class="map-link map-icon text-dark-brown" target="_blank">';
            store_markup += '               <u>View on map</u>';
            store_markup += '           </a>';
            store_markup += '       </div>';
            store_markup += '   </div>';

            store_markup += ' </div>';
        });

        store_items.html(store_markup);
    };


    var customer_form   = null;
    var stores_form     = null;

    var swap_forms_for_hero = function() {

        //Hide Instructions
        form.find('.speical-note').hide();
        populate_stores();

        customer_form.velocity({
            opacity: [ 0, 1 ]
        }, {
            delay: 90,
            duration: 150,
            easing: 'ease-out',
            complete: function() {
                customer_form.remove();
            }
        });

        stores_form.velocity({
            opacity: [ 1, 0 ]
        }, {
            duration: 150,
            easing: 'ease-in',
            complete: function() {
                stores_form.css('position', 'static');

                store_items.velocity({
                    opacity: [ 1, 0 ]
                }, {
                    visibility: 'visible',
                    delay: 200,
                    duration: 150,
                    easing: 'ease-in'
                });


                //Allow user to fill forms again
                var input = stores_form.find('input[name="location"]');

                input.prop('disabled', false);
                autocomplete = new google.maps.places.Autocomplete(input.get(0));
                autocomplete.addListener('place_changed', onAddressSelected);

                is_swapped = true;
            }
        });
    };

    var Azadi_Results = function () {

    };

    Azadi_Results.DEFAULTS = {
        duration: 300,
        easing: {
            easeout: [0.000, 0.000, 0.580, 1.000]
        }
    };

    Azadi_Results.prototype.init = function () {

        //Decideing which Product to Render
        var suggested_product = window.azadi_customer.suggested_product();

        //Default for testing
        if(!suggested_product) {
            suggested_product = 'Bloom';
        }


        //Change the background color based on selection
        var bg_maps = {
            'Bloom'    : 'bg-yellow',
            'Glow'   : 'bg-red',
            'Rise'  : 'bg-blue',
            'Silk'      : 'bg-sky'
        };

        page.removeClass('bg-yellow bg-red bg-blue bg-sky'); //reset
        page.addClass(bg_maps[suggested_product]);


        //Change logo color
        var logo_colors = {
            'Bloom'    : 'text-blue',
            'Glow'   : 'text-white',
            'Rise'  : 'text-white',
            'Silk'      : 'text-blue'
        };

        $('#main-logo-container').removeClass().addClass(logo_colors[suggested_product]);

        var product_div         = $('.page-results #product-' + suggested_product);

        product_title           = product_div.find('.product-title');
        product_image           = product_div.find('.product-image');
        product_description     = product_div.find('.product-description');

        //Insert image dynamically
        var image_url = '/assets/images/products/product-' + suggested_product.toLowerCase() + '.png';
        product_image.html('<img src="' + image_url + '" class="img-responsive" />');

        //Insert Image on Final Page
        var image_url = '/assets/images/voucher-products/desktop/product-' + suggested_product.toLowerCase() + '.png';
        $('.page-voucher .final-product').html('<img src="' + image_url + '" class="img-responsive" />');

        //Prepare for Animation
        page.find('.form-container').css('visibility', 'hidden');
        product_title.css('visibility', 'hidden');
        product_image.css('visibility', 'hidden');
        product_description.css('visibility', 'hidden');
        store_items.css('visibility', 'hidden');

        product_div.removeClass('hidden');

        page_sequence = [];

        page_sequence.push({
            elements: product_title,
            properties: {
                opacity: [ 1, 0 ],
                translateY: [0, -20],
                translateZ: 0
            },
            options: {
                visibility: "visible",
                duration: 300,
                easing: 'easeOutSine'
            }
        });

        page_sequence.push({
            elements: product_description,
            properties: {
                opacity: [ 1, 0 ],
                translateY: [0, 20],
                translateZ: 0
            },
            options: {
                visibility: "visible",
                duration: 300,
                easing: 'easeOutSine'
            }
        });

        page_sequence.push({
            elements: product_image,
            properties: {
                opacity: [ 1, 0 ],
                scaleX: [1, 0.4],
                scaleY: [1, 0.4],
                blue: [0, 5],
                translateZ: 0
            },
            options: {
                visibility: "visible",
                duration: 300,
                easing: 'easeOutSine'
            }
        });

        page_sequence.push({
            elements: page.find('.form-container'),
            properties: {
                opacity: [ 1, 0 ]
            },
            options: {
                visibility: "visible",
                duration: 150,
                easing: 'easeOutSine',
                complete: function() {
                    $('.background-video').remove();
                }
            }
        });

    };

    Azadi_Results.prototype.animate = function () {
        $.Velocity.RunSequence(page_sequence);
    };

    Azadi_Results.prototype.hide = function () {

        page_sequence = page_sequence.reverse();

        //Reverse the Animation Sequence and Each Properties
        $.each(page_sequence, function(index, sequence_item_properties){

            if(!sequence_item_properties.properties) {
                return;
            }

            $.each(sequence_item_properties.properties, function(property_key, property_value){

                if(typeof property_value !== 'object') {
                    return;
                }

                sequence_item_properties['properties'][property_key] = [property_value[1], property_value[0]];
            });

            page_sequence[index] = sequence_item_properties;
        });


        page_sequence.push({
            elements:  $('#main-logo'),
            properties: {
                opacity: [ 0, 1 ]
            },
            options: {
                display: "none",
                duration: 300,
                easing: 'ease-out',
                complete: function() {
                    goto_voucher_page();
                }
            }
        });

        $.Velocity.RunSequence(page_sequence);
    };

    Azadi_Results.prototype.show_stores = function () {
        var inputs          = form.find('.form-group').not('.form-group-location').toArray();
        inputs              = inputs.reverse();

        var sequence    = [];

        $.each(inputs, function(index, element){
            sequence.push( {
                elements: element,
                properties: {
                    opacity: [ 0, 1 ],
                    translateY: -20,
                    translateZ: 0
                },
                options: {
                    duration: 100,
                    easing: 'ease-out'
                }
            });
        });

        /**
         * Hide All the fields
         * Move Location field from customer to top
         * Fade Out customer form and Fade In Stores Form
         * Gives illusion of hero transition
         */

        //Ensure Form Do not change its height for smooth animation / Hero Transition
        var hero_container = page.find('.hero-transition-container');
        hero_container.css('height', hero_container.height());

        customer_form   = hero_container.find('.customer-information');
        stores_form     = hero_container.find('.store-information');

        //Move Location Field to the Top
        var input_location  = customer_form.find('.form-group-location');
        var new_position    = ((input_location.position().top - customer_form.find('.form-group-firstname').position().top)) * -1;

        //customer_form.css('position', 'absolute').css('width', '100%');
        stores_form.css({
            'position' : 'absolute',
            'opacity' : 0
        }).removeClass('hidden');

        var location_input = input_location.find('input');
        location_input.prop('disabled', 'disabled');

        //Copy the value of Location to new div
        stores_form.find('.form-group-location input').val(location_input.val());

        sequence.push( {
            elements: input_location,
            properties: {
                top: new_position
            },
            options: {
                position: 'absolute',
                top: form.find('.form-group-firstname').position().top,
                duration: 150,
                easing: 'easeInQuint',
                begin: swap_forms_for_hero
            }
        });

        $.Velocity.RunSequence(sequence);
    };

    Azadi_Results.prototype.show_error = function (field_name, error_message) {

        var input  = null;

        if(is_swapped) {
            input = page.find('.store-information [name="' + field_name + '"]');
        }else{
            input = form.find('[name="' + field_name + '"]');
        }

        if(input.length === 0) {
            alert(field_name + ' is ' + error_message);
            return;
        }

        var popover_container = input.parent();

        popover_container.addClass('has-error')
        input.data('error', error_message);

        //Add New One
        popover_container.popover({
            container   : false,
            content     :  function() {
                return input.data('error');
            },
            placement   : 'bottom',
            trigger     : 'manual'
        });

        popover_container.popover('show');

        if(is_swapped) {
            input.one('keyup.remove-popover', function() {
                popover_container.popover('destroy');
                popover_container.removeClass('has-error');
            });
        }
    };

    $(document).ready(function(){
        window.results = new Azadi_Results();

        page                    = $('.page-results');
        form                    = page.find('.customer-information');
        store_items             = page.find('.store-items');

        $('#reload-google-map').on('click.reload', function(e){
            e.preventDefault();
            loadScript('https://maps.googleapis.com/maps/api/js?signed_in=true&libraries=places&callback=mapLoaded', null);
            return false;
        });

        $('#get-your-voucher-btn').on('click.next-page', function(e){
            e.preventDefault();

            var store = window.stores_map.get_by_id(window.azadi_customer.store_id);
            if(store)
            {
                MasterTmsUdo = {};
                MasterTmsUdo['nearestStore'] = store.address;
                captureTracking();
            }

            MasterTmsUdo = {};
            MasterTmsUdo['questionnaireFormCompleted'] = '1';
            window.captureTracking();

            window.azadi_api.sendCustomerEmail().done(function(response) {
                if (response && response.email_preview_url) {
                    window.azadi_customer._email_preview_url = response.email_preview_url;
                }
            });
            window.results.hide();

            return false;
        });

        //stores_map.get_by_geocode({ lat: 52.4534433, lng: -1.8619185000000016 });
        //stores.show_stores();
    });

    window.mapLoaded = function() {
        var input = $('.customer-information input[name="location"]');

        input.prop('disabled', false);

        $('#reload-google-map').parent().remove();

        autocomplete = new google.maps.places.Autocomplete(input.get(0));
        //autocomplete.setComponentRestrictions({'country':'gb'});

        autocomplete.addListener('place_changed', onAddressSelected);
    }

}(jQuery);