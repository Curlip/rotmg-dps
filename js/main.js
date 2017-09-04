var URL1 = "https://static.drips.pw/rotmg/production/current";
var main = [];
var chars = [];

var handlers = [];
var loaders = [];

$(document).ready(function() {
    jQuery.expr[":"].Contains = jQuery.expr.createPseudo(function(arg) {
        return function(elem) {
            return jQuery(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
        };
    });

    if(getURLParameter("mode") == "testing"){
        URL1 = "https://static.drips.pw/rotmg/testing/current"
    }

    fetchItems(URL1 + "/json/Objects.json").then(function(data) {
        main = data.items;
        chars = data.chars;

        loadUI();

        for(var i = 0; i < loaders.length; i++){
            loaders[i]();
        }

        $("#view").tabs({
            active: 0,
        });
    });
});

function fetchItems(URL) {
    return new Promise(function(resolve, reject) {
        var itemst = []
        var charst = []

        var data = {}

        $.getJSON(URL, function(data) {
            for (i = 0; i < data.Object.length; i++) {
                if (data.Object[i].Class == "Equipment") {
                    itemst.push(data.Object[i]);
                }
                if (data.Object[i].Class == "Player") {
                    charst.push(data.Object[i]);
                }
            }

            data.items = itemst;
            data.chars = charst;

            resolve(data);
        });
    });
}

function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}

/* Helper Functions */

function loopItems(func) {
    for (var i = 0; i < main.length; i++) {
        func(main[i]);
    }
}

function getItemByType(id) {
    return main.filter(function(obj) {
        return obj.type === id;
    })[0];
}
