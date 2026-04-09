+function ($) {
    'use strict';

    var page    = null;
    var header  = null;
    var body    = null;

    //More Products
    var recommendation = {};
    recommendation['Bloom'] = [
        {
            name:  'Bloom Lotion',
            type:  'Tone',
            image: 'bloom_lotion.jpg',
            price: '£42',
            url:   'http://uk.azadi.com/bloom-lotion,83,1,29786,433798.htm#s=62149'
        },
        {
            name:  'Bloom Extract',
            type:  'Treat',
            image: 'bloom_extract.jpg',
            price: '£76',
            url:   'http://uk.azadi.com/bloom-extract,83,1,29786,271943.htm#s=62149'
        },
        {
            name:  'Bloom Oil',
            type:  'Repair',
            image: 'bloom_youth_oil.jpg',
            price: '£72',
            url:   'http://uk.azadi.com/bloom-youth-oil,83,1,29786,604957.htm#s=62149'
        },
        {
            name:  'Bloom Eyes',
            type:  'Treat',
            image: 'bloom_bloom_eyes.jpg',
            price: '£49',
            url:   'http://uk.azadi.com/bloom-bloom-eyes,83,1,29786,271944.htm#s=62149'
        },
        {
            name:  'Bloom Cream',
            type:  'Moisturise',
            image: 'bloom_cream.jpg',
            price: '£74',
            url:   'http://uk.azadi.com/bloom-cream,83,1,29786,320140.htm#s=62149'
        }
    ];

    recommendation['Glow'] = [
        {
            name:  'Perfecting Mist',
            type:  'Tone',
            image: 'glow_sublime_perfecting_mist.jpg',
            price: '£14',
            url:   'http://uk.azadi.com/glow-sublime-perfecting-mist,83,1,66855,702649.htm#s=66856'
        },
        {
            name:  'Perfecting Essence',
            type:  'Treat',
            image: 'glow_sublime_perfecting_essence.jpg',
            price: '£38',
            url:   'http://uk.azadi.com/glow-sublime-perfecting-essence,83,1,66855,702657.htm#s=66856'
        },
        {
            name:  'Full Size Moisturiser',
            type:  'Moisturise',
            image: 'glow_sublime_perfecting_cream.jpg',
            price: '£32',
            url:   'http://uk.azadi.com/glow-sublime-perfecting-cream,83,1,67060,702652.htm#s=66856'
        }
    ];

    recommendation['Rise'] = [
        {
            name:  'Cleansing Foam',
            type:  'Cleanse',
            image: 'rise_cleansing_foam.jpg',
            price: '£19',
            url:   'http://uk.azadi.com/rise-cleansing-foam,83,1,29786,270004.htm#s=62152'
        },
        {
            name:  'Essential Water',
            type:  'Tone',
            image: 'essential_face_water.jpg',
            price: '£18',
            url:   'http://uk.azadi.com/essential-face-water,83,1,29786,269940.htm#s=62152'
        },

        {
            name:  'Rise Serum',
            type:  'Treat',
            image: 'bloom_rise_serum.jpg',
            price: '£49',
            url:   'http://uk.azadi.com/bloom-rise-serum,83,1,29786,798985.htm'
        },
        {
            name:  'Eye Balm',
            type:  'Treat',
            image: 'rise_eye_balm.jpg',
            price: '£32',
            url:   'http://uk.azadi.com/rise-eye-balm,83,1,29786,270013.htm#s=62152'
        },
        {
            name:  'Full Size Moisturiser',
            type:  'Moisturise',
            image: 'rise_cream.jpg',
            price: '£46',
            url:   'http://uk.azadi.com/rise-cream,83,1,29786,269737.htm#s=62152'
        }
    ];

    recommendation['Silk'] = [
        {
            name:  'Silk Cleansing Oil',
            type:  'Cleanse',
            image: 'silk_cleansing_oil.jpg',
            price: '£17',
            url:   'http://uk.azadi.com/silk-cleansing-oil,83,1,29776,649983.htm#s=29953'
        },
        {
            name:  'Silk Toner',
            type:  'Treat',
            image: 'silk_gentle_toner.jpg',
            price: '£15',
            url:   'http://uk.azadi.com/silk-gentle-toner,83,1,29776,649982.htm#s=29953'
        },
        {
            name:  'Full Size Moisturiser',
            type:  'Moisturise',
            image: 'silk_light_comforting_cream.jpg',
            price: '£26',
            url:   'http://uk.azadi.com/silk-light-comforting-cream,83,1,29776,649980.htm#s=29953'
        }
    ];

    var Azadi_Voucher = function () {

    };

    Azadi_Voucher.DEFAULTS = {
        duration: 300,
        easing: {
            easeout: [0.000, 0.000, 0.580, 1.000]
        }
    };

    Azadi_Voucher.prototype.init = function () {

        if(window.azadi_customer.country.toLowerCase() === 'ie') {
            $('.terms-and-condition-link').attr('href', 'http://ie.azadi.com/terms-conditions,103,1,70225,440019.htm#Codes');
            $('.currency').html('€');
            $('.amount1').html('15');
            $('.amount2').html('35');

            //Product Links
            recommendation['Silk'][0]['url'] = 'http://ie.azadi.com/silk-gentle-toner,103,1,47808,649988.htm';
            recommendation['Silk'][1]['url'] = 'http://ie.azadi.com/silk-gentle-toner,103,1,47808,649988.htm';
            recommendation['Silk'][2]['url'] = 'http://ie.azadi.com/silk-light-comforting-cream,103,1,47808,649986.htm';

            recommendation['Silk'][0]['price'] = '&euro;20';
            recommendation['Silk'][1]['price'] = '&euro;18';
            recommendation['Silk'][2]['price'] = '&euro;32';

            recommendation['Glow'][0]['url'] = 'http://ie.azadi.com/glow-sublime-perfecting-mist,103,1,66858,702901.htm';
            recommendation['Glow'][1]['url'] = 'http://ie.azadi.com/glow-sublime-perfecting-essence,103,1,66858,702909.htm';
            recommendation['Glow'][2]['url'] = 'http://ie.azadi.com/glow-sublime-perfecting-cream,103,1,67061,702904.htm';

            recommendation['Glow'][0]['price'] = '&euro;17';
            recommendation['Glow'][1]['price'] = '&euro;46';
            recommendation['Glow'][2]['price'] = '&euro;37';

            recommendation['Rise'][0]['url'] = 'http://ie.azadi.com/rise-cleansing-foam,103,1,47815,440116.htm';
            recommendation['Rise'][1]['url'] = 'http://ie.azadi.com/essential-face-water,103,1,47815,457540.htm';
            recommendation['Rise'][2]['url'] = 'http://ie.azadi.com/rise-serum,103,1,47815,799092.htm';
            recommendation['Rise'][3]['url'] = 'http://ie.azadi.com/rise-eye-balm,103,1,47815,440119.htm';
            recommendation['Rise'][4]['url'] = 'http://ie.azadi.com/rise-cream,103,1,47815,440112.htm';

            recommendation['Rise'][0]['price'] = '&euro;23';
            recommendation['Rise'][1]['price'] = '&euro;21';
            recommendation['Rise'][2]['price'] = '&euro;58';
            recommendation['Rise'][3]['price'] = '&euro;37';
            recommendation['Rise'][4]['price'] = '&euro;54';

            recommendation['Bloom'][0]['url'] = 'http://ie.azadi.com/bloom-lotion,103,1,47815,440145.htm';
            recommendation['Bloom'][1]['url'] = 'http://ie.azadi.com/bloom-extract,103,1,47815,440123.htm';
            recommendation['Bloom'][2]['url'] = 'http://ie.azadi.com/bloom-youth-oil,103,1,47815,618320.htm';
            recommendation['Bloom'][3]['url'] = 'http://ie.azadi.com/bloom-bloom-eyes,103,1,47815,440129.htm';
            recommendation['Bloom'][4]['url'] = 'http://ie.azadi.com/bloom-cream,103,1,47815,440134.htm';

            recommendation['Bloom'][0]['price'] = '&euro;49';
            recommendation['Bloom'][1]['price'] = '&euro;90';
            recommendation['Bloom'][2]['price'] = '&euro;84';
            recommendation['Bloom'][3]['price'] = '&euro;58';
            recommendation['Bloom'][4]['price'] = '&euro;88';
        }

        var suggested_product = window.azadi_customer.suggested_product();

        var product_full_names = {
            'Bloom'     : 'Bloom',
            'Glow'      : 'Glow',
            'Rise'      : 'Rise',
            'Silk'      : 'Silk'
        };

        var store = window.stores_map.get_by_id(window.azadi_customer.store_id);
        if(store)
        {
            page.find('#store-address').text(store.address);
        }

        page.find('#firstname').text(azadi_customer.firstname);
        page.find('#product-name').text(product_full_names[suggested_product]);

        header.css('visibility', 'hidden');
        body.css('visibility', 'hidden');

        //PDF Link
        var print_link = pdf_link + $.param({
            name: azadi_customer.firstname,
            address: store.address,
            product: product_full_names[suggested_product],
            country: azadi_customer.country.toLowerCase()
        });

        $('#print_link').attr('href', print_link);

        //Setup Carousel
        var carousel = $('.product-carousel');

        carousel.empty();

        var html = '';

        $.each(recommendation[suggested_product], function(index, product){
            html += '<div class="product-item item">';
            html += '<h4 class="text-uppercase">' + product.type + '</h4>';

            html += '<a href="' + product.url + '" class="external-image" target="_blank">';
            html += '<img src="/assets/carousel-images/' + product.image + '" class="img-responsive"  target="_blank" />';
            html += '</a>';

            html += '<p>';
            html += product.name + '<br />';
            html += '<strong>' + product.price + '</strong>';
            html += '</p>';

            html += '<a href="' + product.url + '" class="external-link" target="_blank">View Product</a>';
            html += '</div>';
        });

        if(recommendation[suggested_product].length > 3) {
            var html_template = html;

            for(var i = 1; i <= 4; i++) {
                html += html_template;
            }

            carousel.html(html);
        }else{
            carousel.html(html);
        }

        window.enableSharing();
        window.find_out_out_more_link();

        // Show email preview link if available
        if (window.azadi_customer._email_preview_url) {
            var $actions = page.find('.voucher-actions');
            if ($actions.length) {
                $actions.append(
                    '<a href="' + window.azadi_customer._email_preview_url +
                    '" target="_blank" class="btn btn-default email-preview-link">View your voucher email</a>'
                );
            }
        }

        MasterTmsUdo = {};
        MasterTmsUdo['skincareRecommendationResult'] = suggested_product;
        window.captureTracking();
    };

    Azadi_Voucher.prototype.animate = function () {

        var page_sequence = [];

        page_sequence.push({
            elements: header,
            properties: {
                opacity: [ 1, 0 ],
                translateY: [0, -200],
                translateZ: 0
            },
            options: {
                visibility: "visible",
                duration: 300,
                easing: 'easeOutSine'
            }
        });

        page_sequence.push({
            elements: $('.indicator'),
            properties: {
                opacity: [ 0, 1 ],
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
            elements: body,
            properties: {
                opacity: [ 1, 0 ],
                translateZ: 0
            },
            options: {
                visibility: "visible",
                duration: 300,
                easing: 'easeOutSine',
                complete: function() {

                    var number_of_items = $('.product-carousel .product-item').length;
                    var carousel_config = {};

                    if(number_of_items <= 3) {

                        carousel_config = {
                            items: number_of_items,
                            margin:10,
                            nav:false,
                            loop:false,
                            dots: false,
                            autoplay:false
                        };

                    }else{

                        carousel_config = {
                            items: 3,
                            slideBy: 1,
                            nav:true,
                            margin:10,
                            loop:false,
                            dots: false,
                            autoplay:true,
                            navText: ['<svg class="prev-icon"><use xlink:href="#arrow-prev"></use></svg>', '<svg class="next-icon"><use xlink:href="#arrow-next"></use></svg>']
                        };

                    }

                    $('.product-carousel').owlCarousel(carousel_config);


                }
            }
        });

        $.Velocity.RunSequence(page_sequence);
    };

    window.applyBackendProducts = function(products) {
        if (!products) return;
        $.each(products, function(brand, items) {
            if ($.isArray(items) && items.length > 0) {
                recommendation[brand] = items;
            }
        });
        console.log('[Voucher] Backend products applied');
    };

    $(document).ready(function(){
        window.voucher = new Azadi_Voucher();

        page    = $('.page-voucher');
        header  = page.find('.page-header');
        body    = page.find('.page-content');
    });

}(jQuery);