/*

    ui.js

    - Provides

*/

const UI = (function() {

    DATA.onReady(function() {

        //Loop over items and create buttons in list
        for (var i = 0; i < DATA.items.length; i++) {
            var item = DATA.items[i];

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
            var item = $.grep(DATA.items, function(e) {
                return e.type == ele.attr("itemid")
            })[0];
            trigger((tab) => {
                tab.itemSelected(item)
            });
        });

        // On search change
        $('#search').on('input propertychange paste', function() {
            var search = ":Contains(" + $("input#search").val() + ")"
            visFilters["search"] = search;
            filter();
        });

        // Make view into tabs
        $("#view").tabs({
            active: 0,
        });
    });

    $(document).ready(function() {
        jQuery.expr[":"].Contains = jQuery.expr.createPseudo(function(arg) {
            return function(elem) {
                return jQuery(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
            };
        });
    });


    function setEnabledItemsFilter(filter) {
        if (typeof filter == "function") {

            $(".itemtag").each(function() {
                $(this).removeClass("disabled")

                if (!filter($(this))) {
                    $(this).addClass("disabled")
                }
            })

        } else {

            $(".itemtag").each(function() {
                $(this).removeClass("disabled")

                if (!$(this).is(filter)) {
                    $(this).addClass("disabled")
                }
            })

        }
    }

    var visFilters = {};

    function setVisibleItemsFilter(newfilter) {
        visFilter["external"] = newfilter;
        filter();
    }

    function filter() {
        $(".itemtag").each(function() {
            var search = $(this).is(visFilters["search"])
            var extern;


            if (typeof visFilters["external"] == "function") {
                extern = visFilters["external"]($(this));
            } else {
                extern = $(this).is(visFilters["external"]);
            }

            $(this).show();

            if (!(search && external)) {
                $(this).hide();
            }
        })

        $(".slottype").each(function(i, ele) {
            $(this).show();
            if (!$(this).children(':visible').length > 1) {
                $(this).hide();
            }
        })
    }

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
        setVisibleItemsFilter: setVisibleItemsFilter,
        setEnabledItemsFilter: setEnabledItemsFilter,

        Tab: Tab,
        addTab: function(tab){
            tabs.push(tab)
            $("#tabcontrols").append(tab.opener);
            $("#view").append(tab.display);
        }
    }

}())
