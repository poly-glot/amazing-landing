/**
 * Question Map
 */

+function ($) {
    'use strict';


    var stores = {};

    //Distance Calculator for stores
    function deg2rad(val) {
        var pi = Math.PI;
        var de_ra = ((eval(val)) * (pi / 180));
        return de_ra;
    }

    function distances(lat1, lon1, lat2, lon2) {

        // meters
        var R = 3963.189;

        // Find the deltas
        var delta_lon = deg2rad(lon2) - deg2rad(lon1);

        // Find the Great Circle distance
        var distance = Math.acos(Math.sin(deg2rad(lat1)) * Math.sin(deg2rad(lat2)) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.cos(delta_lon)) * R;

        return distance;
    }

    var StoresMap = function () {

    };


    StoresMap.prototype.update = function (provided_stores) {
        $.each(provided_stores, function(index, store){
            stores[store.id] = store;
        });
    };

    StoresMap.prototype.get_by_town = function (town) {

    };

    StoresMap.prototype.get_by_id = function (store_id) {
        return stores[store_id];
    };

    StoresMap.prototype.all = function () {
        return stores;
    };

    StoresMap.prototype.get_by_geocode = function (geo_address) {

        var store_list_all  = [];
        var store_list      = [];

        geo_address.lat = parseFloat(geo_address.lat).toFixed(8);
        geo_address.lng = parseFloat(geo_address.lng).toFixed(8);

        $.each(stores, function (index, store) {
            store.distance = distances(geo_address.lat, geo_address.lng, store.lat, store.lng);

            store_list_all.push(store);
        });

        //Only Close Stores
        store_list = $.grep(store_list_all, function( store, index ) {
            // return ( store.distance > 0 && store.distance < 20 );
            return ( (store.is_active == "1") && (store.distance >= 0 && store.distance < 20 ));
        });


        //Try Greater Distance
        if(store_list.length === 0) {
            store_list = $.grep(store_list_all, function( store, index ) {
                return ( (store.is_active == "1") && (store.distance > 0 && store.distance < 1000 ));
            });
        }


        //Ordered By Distance
        store_list.sort(function (a, b) {
            var a1 = a.distance;
            var b1 = b.distance;

            if (a1 == b1) {
                return 0;
            }
            return a1 > b1 ? 1 : -1;
        });

        if(store_list.length > 5) {
            store_list = store_list.slice(0, 5);
        }

        return store_list;
    };

    window.stores_map = new StoresMap();

}(jQuery);
