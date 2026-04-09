+function ($) {
    'use strict';

    //More Products
    var recommendation  = {};

    recommendation.uk   = {};
    recommendation.ie   = {};

    recommendation.uk.bloom     = 'http://uk.azadi.com/bloom,83,1,73761,803118.htm';
    recommendation.uk.glow      = 'http://uk.azadi.com/glow,83,1,73761,803205.htm';
    recommendation.uk.rise      = 'http://uk.azadi.com/rise,83,1,73761,803204.htm';
    recommendation.uk.silk      = 'http://uk.azadi.com/silk,83,1,73761,803206.htm';

    recommendation.ie.bloom     = 'http://ie.azadi.com/bloom,103,1,73764,803212.htm';
    recommendation.ie.glow      = 'http://ie.azadi.com/glow,103,1,73764,803214.htm';
    recommendation.ie.rise      = 'http://ie.azadi.com/rise,103,1,73764,803213.htm';
    recommendation.ie.silk      = 'http://ie.azadi.com/silk,103,1,73764,803216.htm';


    function find_out_out_more_link() {
        var suggested_product   = window.azadi_customer.suggested_product();
        suggested_product       = suggested_product.toLowerCase();

        var country             = azadi_customer.country;
        country                 = country.toLowerCase();

        if(country !== 'ie') {
            country = 'uk';
        }

        $('#find-out-more').attr('href', recommendation[country][suggested_product]);
    }

    window.find_out_out_more_link = find_out_out_more_link;


}(jQuery);