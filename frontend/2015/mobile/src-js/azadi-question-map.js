/**
 * Question Map
 */

+function ($) {
    'use strict';


    var question_label = function(main_heading, sub_heading) {

        var html = '';

        html += ' <div class="question-value">' + main_heading + '</div>';

        html += ' <div class="question-label">';
        html += '   <div class="question-label-inner">(' + sub_heading + ')</div>';
        html += ' </div>';

        return html;
    };

//First Question
    var questions_age          = {
        'question-item-container-3'  : 'Under 25',
        'question-item-container-6'  : '25-35',
        'question-item-container-4'  : '35-45',
        'question-item-container-9'  : '45-55',
        'question-item-container-7'  : '55+',
        'question-item-container-10' : 'That\'s my secret'
    };


//Second Question about Skin
    var questions_skin      = {} ;

    questions_skin['Under 25'] = {
        'question-item-container-4'  : question_label('Dry', 'lacks moisture & comfort'),
        'question-item-container-6'  : question_label('Normal', 'oily/oily in certain areas/not dry'),
        'question-item-container-7'  : question_label('Oily/Combination', 'shiny all over with visible pores'),
    } ;

    questions_skin['Under 25']  = questions_skin['Under 25'];
    questions_skin['25-35']     = questions_skin['Under 25'];


    questions_skin['35-45'] = {
        'question-item-container-4'  : question_label('Dry', 'lacks moisture & comfort'),
        'question-item-container-6'  : question_label('Normal', 'oily/oily in certain areas/not dry'),
        'question-item-container-7'  : question_label('Oily/Combination', 'shiny all over with visible pores'),
        'question-item-container-9'  : question_label('Mature', 'signs of ageing')
    } ;

    questions_skin['45-55']             = questions_skin['35-45'];
    questions_skin['45-55']             = questions_skin['35-45'];
    questions_skin['55+']               = questions_skin['35-45'];
    questions_skin["That's my secret"]  = questions_skin['35-45'];


//Third Question about Concern
    var questions_concern           = {};

    questions_concern['Under 25']   = {
        'question-item-container-1'  : 'Dark spots/Uneven skin tone',
        'question-item-container-4'  : 'Visible pores and blemishes',
        'question-item-container-7'  : 'Dullness/Lack of radiance',
        'question-item-container-6'  : 'Delicate with dry or red patches',
        'question-item-container-9'  : 'Comfort and nourishment',
        'question-item-container-11' : 'Sensitivity',
        'question-item-container-12' : 'Oil control'

    };

    questions_concern['25-35']   = {
        'question-item-container-1'  : 'Dark spots/Uneven skin tone',
        'question-item-container-2'  : 'Visible pores and blemishes',
        'question-item-container-3'  : 'Dullness/Lack of radiance',
        'question-item-container-4'  : 'Delicate with dry or red patches',
        'question-item-container-5'  : 'Comfort and nourishment',
        'question-item-container-6'  : 'Sensitivity',
        'question-item-container-7'  : 'Fine lines and wrinkles',
        'question-item-container-8'  : 'Early signs of ageing',
        'question-item-container-9'  : 'Loss of firmness and elasticity',
        'question-item-container-10' : 'Oil control'
    };

    questions_concern['35-45']   = {
        'question-item-container-1'  : 'Dark spots/Uneven skin tone',
        'question-item-container-2'  : 'Visible pores and blemishes',
        'question-item-container-3'  : 'Dullness/Lack of radiance',
        'question-item-container-4'  : 'Delicate with dry or red patches',
        'question-item-container-5'  : 'Comfort and nourishment',
        'question-item-container-6'  : 'Sensitivity',
        'question-item-container-7'  : 'Fine lines and wrinkles',
        'question-item-container-8'  : 'Visible lines and deep wrinkles',
        'question-item-container-9'  : 'Loss of firmness and elasticity',
        'question-item-container-10' : 'Oil control'
    };

    questions_concern['45-55']             = questions_concern['35-45'];
    questions_concern['45-55']             = questions_concern['35-45'];
    questions_concern['55+']               = questions_concern['35-45'];
    questions_concern["That's my secret"]  = questions_concern['35-45'];

//Results Product
    var questions_products = {};

    questions_products['Under 25']   = {
        'Dark spots/Uneven skin tone'       : 'Glow',
        'Visible pores and blemishes'       : 'Glow',
        'Dullness/Lack of radiance'         : 'Glow',
        'Delicate with dry or red patches'  : 'Silk',
        'Comfort and nourishment'           : 'Silk',
        'Sensitivity'                       : 'Silk',
        'Oil control'                       : 'Glow'
    };

    questions_products['25-35']   = {
        'Dark spots/Uneven skin tone'       : 'Glow',
        'Visible pores and blemishes'       : 'Glow',
        'Dullness/Lack of radiance'         : 'Glow',
        'Delicate with dry or red patches'  : 'Silk',
        'Comfort and nourishment'           : 'Silk',
        'Sensitivity'                       : 'Silk',
        'Fine lines and wrinkles'           : 'Rise',
        'Early signs of ageing'             : 'Rise',
        'Loss of firmness and elasticity'   : 'Rise',
        'Oil control'                       : 'Glow'
    };

    questions_products['35-45']   = {
        'Dark spots/Uneven skin tone'       : 'Bloom',
        'Visible pores and blemishes'       : 'Glow',
        'Dullness/Lack of radiance'         : 'Bloom',
        'Delicate with dry or red patches'  : 'Silk',
        'Comfort and nourishment'           : 'Bloom',
        'Sensitivity'                       : 'Bloom',
        'Fine lines and wrinkles'           : 'Rise',
        'Visible lines and deep wrinkles'    : 'Bloom',
        'Loss of firmness and elasticity'   : 'Bloom',
        'Oil control'                       : 'Glow'
    };

    questions_products['45-55']             = questions_products['35-45'];
    questions_products['45-55']             = questions_products['35-45'];
    questions_products['55+']               = questions_products['35-45'];
    questions_products["That's my secret"]  = questions_products['35-45'];


//Working out Priority
    var products_priority = {};

    products_priority['Under 25']          = ['Glow', 'Silk'];
    products_priority['25-35']             = ['Rise', 'Glow', 'Silk'];
    products_priority['35-45']             = ['Bloom', 'Rise', 'Glow', 'Silk'];

    products_priority['45-55']             = products_priority['35-45'];
    products_priority['45-55']             = products_priority['35-45'];
    products_priority['55+']               = products_priority['35-45'];
    products_priority["That's my secret"]  = products_priority['35-45'];


    var QuestionMap = function () {

    };


    QuestionMap.prototype.getAge = function () {
        return questions_age;
    };

    QuestionMap.prototype.getSkin = function (age) {
        if(questions_skin[age]) {
            return questions_skin[age];
        }

        console.log('unable to find skin option for age ' + age);
    };

    QuestionMap.prototype.getConcerns = function (age) {
        if(questions_concern[age]) {
            return questions_concern[age];
        }

        console.log('unable to find concern option for age ' + age);
    };

    QuestionMap.prototype.getProduct = function (age, concerns) {

        if(typeof questions_products[age] !== 'object') {
            console.log('Unable to find products for provided age');
            return;
        }

        concerns = typeof concerns == 'string' ? [concerns] : concerns;

        var possible_products = [];

        $.each(concerns, function(index, concern) {
            if(questions_products[age][concern]) {
                possible_products.push(questions_products[age][concern]);
            }
        });

        //Only Unique Products
        possible_products = $.grep(possible_products, function(el, index) {
            return index === $.inArray(el, possible_products);
        });

        if(possible_products.length === 1) {
            return possible_products[0];
        }

        //Work out the priority of products
        var priority = products_priority[age];
        var product  = null;

        $.each(priority, function(index, priority_product){

            if($.inArray(priority_product, possible_products) === -1) {
                return;
            }

            //Product has already been filled
            if(product) {
               return;
            }

            product = priority_product;
        });

        return product;
    };

    window.questions_map = new QuestionMap();

    window.applyBackendQuestionConfig = function(config) {
        if (config && config.productMapping) {
            $.each(config.productMapping, function(age, mapping) {
                questions_products[age] = mapping;
            });
            console.log('[Questions] Backend mapping applied');
        }
        if (config && config.priority) {
            $.each(config.priority, function(age, prio) {
                products_priority[age] = prio;
            });
        }
    };

}(jQuery);


























