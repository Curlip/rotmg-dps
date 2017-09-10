function loadUI() {
    /* Loop items and add them to the list */
    loopItems(function(item) {
        if(!$(".box#slot" + item.SlotType).length){
            $("#list").append("   \
                <div class=\"box\" id=\"slot" + item.SlotType + "\">   \
                <h4>Slot " + item.SlotType + "</h4>   \
                </div>   \
            ")
        }

        $(".box#slot" + item.SlotType).append("<div class=\"itemtag\" itemid=\"" + item.type + "\">" + item.id + "</div>")
    });

    //Sort Boxes by slottype
    $(".box").sort(function (a, b) {
        return parseInt(a.id.substring(4)) - parseInt(b.id.substring(4));
    }).each(function () {
        var elem = $(this);
        elem.remove();
        $(elem).appendTo("#list");
    });

    /* When an item in the list is clicked add it to the DPS graph */
    $("#list").on("click", ".itemtag", function() {
        var item = getItemByType($(this).attr("itemid"));
        $(this).toggleClass("selected")

        //Notify Modules of selection change.
        for(var i = 0; i < handlers.length; i++){
            handlers[i](item, $(this).hasClass("selected"));
        }
    });

    /*  List Search Function
        Make elements that match search display (as a block), then remove the elements that don't
    */
    $('#search').on('input propertychange paste', function() {
        var search = ":Contains(" + $("input#search").val() + ")"

        filterList(search)
    });
}

function filterList(selector){
    $(".box").css("display", "block")

    $(".itemtag" + selector).show()
    $(".itemtag:not(" + selector + ")").hide()

    $(".box").each(function(i, ele) {
        //must remember header
        if($(this).children(':visible').length > 1){
            $(this).css("display", "block")
        }else{
            $(this).css("display", "none")
        }
    })
}

function filterListByFunc(func){
    $(".itemtag").each(function() {
        if(getItemByType($(this).attr("itemid"))){
            $(this).show();
        }else{
            $(this).hide();
        }
    })
}
