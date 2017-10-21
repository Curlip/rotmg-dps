/*

    main.js

    - Load JSON for xml upon the loading of the page.
    - Handle send 'loaded'

*/

const DATA = (function(){

    var URL1 = (getURLParameter("mode") == "testing" ? "https://static.drips.pw/rotmg/testing/current" : "https://static.drips.pw/rotmg/production/current");
    var items = [];
    var chars = [];

    var readyListener = [];

    function addReadyListener(func){
        readyListener.push(func);
    }

    $(document).ready(function() {
        jQuery.expr[":"].Contains = jQuery.expr.createPseudo(function(arg) {
            return function(elem) {
                return jQuery(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
            };
        });

        $.getJSON(URL1 + "/json/Objects.json", function(res) {
            // Load Character and Item Data into 'chars' and 'main'
            for (i = 0; i < res.Object.length; i++) {
                if (res.Object[i].Class == "Equipment") {
                    items.push(res.Object[i]);
                }
                if (res.Object[i].Class == "Player") {
                    chars.push(res.Object[i]);
                }
            }

            // Run functions waitinf for load
            for(var i = 0; i<readyListener.length; i++){
                readyListener[i]();
            }
        });
    });

    function getURLParameter(name) {
      return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
    }



    return {
        items: items,                       
        chars: chars,
        onReady: addReadyListener
    }

}());
