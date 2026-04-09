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
            store_markup += '   <div class="col-xs-5 text-center">';
            store_markup += '       <a href="' + store.map_link  +'" class="store-image" target="_blank">';
            store_markup += '       <img src="' + store.image + '" alt="" />';
            store_markup += '       </a>';
            store_markup += '   </div>';

            store_markup += '   <div class="col-xs-7">';
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

        customer_form.fadeOut('fast', function() {
            customer_form.remove();

            stores_form.fadeIn('fast', function() {
                stores_form.css('position', 'static');
                stores_form.css('opacity', '1');
                store_items.fadeIn();

                var input = stores_form.find('input[name="location"]');

                input.prop('disabled', false);
                autocomplete = new google.maps.places.Autocomplete(input.get(0));
                autocomplete.addListener('place_changed', onAddressSelected);

                is_swapped = true;
            })
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
            'Bloom'    : 'text-black',
            'Glow'   : 'text-white',
            'Rise'  : 'text-white',
            'Silk'      : 'text-white'
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
        var image_url = '/assets/images/voucher-products/mobile/product-' + suggested_product.toLowerCase() + '.png';
        $('.page-voucher .final-product').html('<img src="' + image_url + '" class="img-responsive" />');

    };

    Azadi_Results.prototype.animate = function () {

    };

    Azadi_Results.prototype.hide = function () {

    };

    Azadi_Results.prototype.show_stores = function () {
        /**
         * Hide All the fields
         * Move Location field from customer to top
         * Fade Out customer form and Fade In Stores Form
         * Gives illusion of hero transition
         */

        //Ensure Form Do not change its height for smooth animation / Hero Transition
        var hero_container = page.find('.hero-transition-container');
        hero_container.css('min-height', hero_container.height());

        customer_form   = hero_container.find('.customer-information');
        stores_form     = hero_container.find('.store-information');

        //Move Location Field to the Top
        var input_location  = customer_form.find('.form-group-location');

        //customer_form.css('position', 'absolute').css('width', '100%');
        stores_form.css({
            'position' : 'absolute',
            'opacity' : 0
        }).removeClass('hidden');

        var location_input = input_location.find('input');
        location_input.prop('disabled', 'disabled');

        //Copy the value of Location to new div
        stores_form.find('.form-group-location input').val(location_input.val());

        swap_forms_for_hero();
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

        //Loading Google Map API
        $(window).on('load.map-api', function() {
            window.loadScript('https://maps.googleapis.com/maps/api/js?signed_in=true&libraries=places&callback=mapLoaded&key=AIzaSyAARy3-Rybhh1o60lzeJfaJiKsnxalRAmI', null);
        });

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