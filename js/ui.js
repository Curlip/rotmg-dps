(async function() {
    var chars = await DATA.chars
    var items = await DATA.items


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
        var item = $.grep(items, e => e.type == ele.attr("itemid"))[0];

        $(document).trigger("item:selected", [item])
    });

    // On search change
    $('#search').on('input propertychange paste', function() {
        var search = `:Contains(${ $("input#search").val()} )`

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
})();

// Contains operator
$(document).ready(function() {
    jQuery.expr[":"].Contains = jQuery.expr.createPseudo(function(arg) {
        return function(elem) {
            return jQuery(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
        };
    });
}())
