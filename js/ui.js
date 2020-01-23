/*

    ui.js

    - Provides

*/

const UI = (function() {

    Promise.all([DATA.chars, DATA.items]).then(function(res){

        var chars = res[0]
        var items = res[1]


        //Loop over items and create buttons in list
        for(var item of items){
            if (!$(".slottype#slot" + item.SlotType).length) {
                $("#list").append("   \
                    <div class=\"slottype\" id=\"slot" + item.SlotType + "\">   \
                    <h4>Slot " + item.SlotType + "</h4>   \
                    </div>   \
                ")
            }

            $(".slottype#slot" + item.SlotType).append("<div class=\"itemtag\" itemid=\"" + item.type + "\">" + item.id + "</div>")
        }

        //Sort Boxes by slottype
        $(".slottype").sort(function(a, b) {
            return parseInt(a.id.substring(4)) - parseInt(b.id.substring(4));
        }).each(function() {
            var elem = $(this);
            elem.remove();
            $(elem).appendTo("#list");
        });

        /* On selection change */
        $("#list").on("click", ".itemtag", function() {
            var ele = $(this)
            var item = $.grep(items, function(e) {
                return e.type == ele.attr("itemid")
            })[0];
            trigger((tab) => {
                tab.itemSelected(item)
            });
        });

        // On search change
        $('#search').on('input propertychange paste', function() {
            var search = ":Contains(" + $("input#search").val() + ")"
            $(".itemtag").show()
            $(".slottype").show()
            $(".itemtag").filter(":not(" + search + ")").hide();

            $(".slottype").each(function(){
                console.log($(this).find('*:visible').length);

                if($(this).find('*:visible').length <= 1){
                    $(this).hide();
                }
            })
        });
    });

    $(document).ready(function() {
        jQuery.expr[":"].Contains = jQuery.expr.createPseudo(function(arg) {
            return function(elem) {
                return jQuery(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
            };
        });
    });



    // Handle Events
    var tabs = []

    function trigger(func) {
        for (var i = 0; i < tabs.length; i++) {
            func(tabs[i])
        }
    }


    class Tab {
        constructor(name, id){
            this.name = name;
            this.id = id;

            this.display = $("<div id=\"dps\" class=\"tab\"></div>")
            this.opener = $("<li><a href=\"#" + id + "\">" + name + "</a></li>")
        }

        destroy(){
            this.display.remove();
            this.opener.remove();
        }

        itemSelected(item){}

    }

    Tab

    return {
        Tab: Tab,
        addTab: function(tab){
            tabs.push(tab)
            $("#view").append(tab.display);
        }
    }

}())
