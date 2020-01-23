/*

    main.js

    - Load JSON for xml upon the loading of the page.
    - Handle send 'loaded'

*/

const DATA = (function(){
    var URL1 = (getURLParameter("mode") == "testing" ? "https://static.drips.pw/rotmg/testing/current" : "https://static.drips.pw/rotmg/production/current");


    var objects = new Promise(function(resolve, reject){
        $(document).ready(function() {
            $.getJSON(URL1 + "/json/Objects.json", function(res) {
                resolve(res.Object)
            })
        })
    })

    var items = new Promise(async function(resolve, reject){
        resolve( (await objects).filter(object => object.Class == "Equipment") )
    })

    var chars = new Promise(async function(resolve, reject){
        resolve( (await objects).filter(object => object.Class == "Player") )
    })



    function getURLParameter(name) {
      return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
    }

    return {
        objects: objects,
        items: items,                       
        chars: chars,
    }
}());

$(document).ready(function() {
    jQuery.expr[":"].Contains = jQuery.expr.createPseudo(function(arg) {
        return function(elem) {
            return jQuery(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
        };
    });
});
