+function ($) {
    'use strict';

    $.support.cors = true;

    window.handlers        = {};
    var firebase_api    = null;

    var ERRORS = {
      NOT_INTERNET          : 'It looks like you are having some internet connectivity issues, retrying',
      SERVER_ERROR          : 'Server is not responding as expected. Please wait',
      TIMEOUT               : 'Server is taking too long to respond, retrying',
      UNKNOWN               : 'Unknown error occurred, retrying.',
      TOO_MANY_ATTEMPTS     : 'Too Many Attempts, trying alternate method'
    };

    var QUERY_DEFAULTS = {
        attempts: 0,
        prefer: 'live',
        method: 'GET',
        url: '',
        data: ''
    };

    var firebase = {
      init: function() {

          var dfd = jQuery.Deferred();

          if(!firebase_api) {
              firebase_api = new Firebase(firebase_url);
              firebase_api.authWithCustomToken("IkGBInRkq7x95Lw1KuwIov2Pqq0yJ2T1MBJ1mMFb",function() {
                  dfd.resolve( firebase_api );
              });
          }else{
              dfd.resolve( firebase_api );
          }

          return dfd.promise();
      },

      getStores: function() {

          var dfd = jQuery.Deferred();
          var api = this.init();

          api.done(function(){
              firebase_api.child('store').once("value", function(snapshot) {

                  var stores     = {};
                  var store      = null;
                  var has_stores = false;
                  snapshot.forEach(function(data) {

                      //Only Active stores
                      store                 = data.val();
                      if(store.is_active == '1') {
                          stores[data.key()]    = store;
                          has_stores            = true;
                      }
                  });

                  if(has_stores) {
                      dfd.resolve(stores);
                  }else{
                      dfd.reject( 'Unable to load stores' );
                  }
              });
          });

          api.fail(function(){
              dfd.reject( 'Unable to load firebase api' );
          });

          return dfd.promise();
      },

      getPromotion: function(promotion_slug) {

          var dfd = jQuery.Deferred();
          var api = this.init();

          api.done(function(){
              firebase_api.child('promotion/' + promotion_slug).once("value", function(snapshot) {

                  var promotion = snapshot.val();

                  if(promotion && promotion.active) {
                      dfd.resolve(promotion);
                  }else{
                      dfd.reject( 'Unable to load promotion link' );
                  }
              });
          });

          api.fail(function(){
              dfd.reject( 'Unable to load firebase api' );
          });

          return dfd.promise();

      }
    };

    var Azadi_Api = function () {

    };

    Azadi_Api.prototype.getStores = function () {
        var dfd = jQuery.Deferred();

        //Try Firebase
        var store_promise = firebase.getStores();
        store_promise.done(function(stores){
            dfd.resolve(stores);
        });

        //Try Server
        store_promise.fail($.proxy(function() {

            var live_server_promise = this.request({url : baseurl_api + 'api/v1/survey/stores'});

            live_server_promise.done(function(response){
                dfd.resolve(response.stores);
            });

            live_server_promise.fail(function(response){
                dfd.reject('unable to load stores from live server');
            });

        }, this));

        return dfd.promise();
    };

    Azadi_Api.prototype.getPromotion = function(promotion_slug) {

        var dfd         = jQuery.Deferred();
        promotion_slug  = promotion_slug ? promotion_slug : main_promotion_slug;

        //Try Firebase
        var promotion_promise = firebase.getPromotion(promotion_slug);
        promotion_promise.done(function(promotion){
            dfd.resolve(promotion);
        });

        //Try Server
        promotion_promise.fail($.proxy(function() {

            var live_server_promise = this.request({url : baseurl_api + 'api/v1/survey/promotion/' + promotion_slug});

            live_server_promise.done(function(response){
                dfd.resolve(response.promotion);
            });

            live_server_promise.fail(function(response){
                dfd.reject('unable to load promotion from live server');
            });

        }, this));

        return dfd.promise();

    };

    Azadi_Api.prototype.storeCustomer = function() {
        var dfd         = jQuery.Deferred();

        var customer_data = {};

        //@FIXME any suitable way?
        $.each(window.azadi_customer, function(key, value){
            if(typeof value === 'function') {
                return;
            }

            customer_data[key] = value;
        });

        var live_server_promise = this.request({
            url :   baseurl_api + 'api/v1/survey/customer',
            method: 'POST',
            data:   customer_data
        });

        live_server_promise.done(function(response){
            dfd.resolve(response);
        });

        live_server_promise.fail(function(response){
            dfd.reject('unable to store on live server');
        });

        return dfd.promise();
    };

    Azadi_Api.prototype.updateCustomerStore = function() {
        var dfd         = jQuery.Deferred();


        var live_server_promise = this.request({
            url :   baseurl_api + 'api/v1/survey/updatestore',
            method: 'POST',
            data:   {
                email       : window.azadi_customer.email,
                store_id    : window.azadi_customer.store_id
            }
        });

        live_server_promise.done(function(response){
            dfd.resolve(response);
        });

        live_server_promise.fail(function(response){
            dfd.reject('unable to store on live server');
        });

        return dfd.promise();
    };

    Azadi_Api.prototype.sendCustomerEmail = function() {
        var dfd         = jQuery.Deferred();

        var customer_data = {};

        //@FIXME any suitable way?
        $.each(window.azadi_customer, function(key, value){
            if(typeof value === 'function') {
                return;
            }

            customer_data[key] = value;
        });

        var live_server_promise = this.request({
            url :   baseurl_api + 'api/v1/survey/email',
            method: 'POST',
            data:   customer_data
        });

        live_server_promise.done(function(response){
            dfd.resolve(response);
        });

        live_server_promise.fail(function(response){
            dfd.reject('unable to store on live server');
        });

        return dfd.promise();
    };

    Azadi_Api.prototype.getProducts = function() {
        var dfd = jQuery.Deferred();

        var live_server_promise = this.request({url : baseurl_api + 'api/v1/survey/products'});

        live_server_promise.done(function(response){
            dfd.resolve(response.products || response);
        });

        live_server_promise.fail(function(){
            dfd.reject('unable to load products from server');
        });

        return dfd.promise();
    };

    Azadi_Api.prototype.getQuestions = function() {
        var dfd = jQuery.Deferred();

        var live_server_promise = this.request({url : baseurl_api + 'api/v1/survey/questions'});

        live_server_promise.done(function(response){
            dfd.resolve(response);
        });

        live_server_promise.fail(function(){
            dfd.reject('unable to load questions from server');
        });

        return dfd.promise();
    };

    Azadi_Api.prototype.reportDowntime = function() {

    };

    Azadi_Api.prototype.request = function(params) {

        var dfd         = jQuery.Deferred();

        var params      = $.extend({}, QUERY_DEFAULTS, params);
        params.attempts = params.attempts + 1;

        //@FIXME too many attempts
        if(params.attempts > 3) {
            dfd.reject( ERRORS.TOO_MANY_ATTEMPTS );
        }

        var ajax_params = {
            url             : params.url,
            //cache           : false,
            crossDomain     : true,
            method          : params.method,
            timeout         : 5000,
            beforeSend      : function( xhr ) {

            }
        };

        if(params.method === 'POST') {
            ajax_params.data = params.data;
        }

        var request = $.ajax(ajax_params);

        request.done(function(response){
            dfd.resolve( response );
        });

        request.fail($.proxy(function(jqXHR, textStatus, errorThrown) {

            var error = ERRORS.UNKNOWN;

            console.log(textStatus);
            console.log(JSON.stringify(jqXHR));

            if(jqXHR.statusText === 'timeout') {
                error = ERRORS.TIMEOUT;
            }else if(jqXHR.status === 0) {
                error = ERRORS.NOT_INTERNET;
            }else if(jqXHR.status === 500) {
                error = ERRORS.SERVER_ERROR;
            }

            //Inform UI about Error
            $(document).trigger($.Event('network.error', { error: error }))

            //Slack Error Reporting
            if(params.attempts >= 3) {
                this.reportDowntime(jqXHR, textStatus);
            }

            //Retry with some delay
            setTimeout($.proxy(function() {
                this.request(params);
            }, this), params.attempts * 3000);

        }, this));

        return dfd.promise();
    };

    window.azadi_api = new Azadi_Api();

}(jQuery);