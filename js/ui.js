function loadUI() {
    /* Loop items and add them to the list */
    loopItems(function(item) {
        $("#list").append("<div class=\"itemtag\" itemid=\"" + item.type + "\">" + item.id + "</div>")
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
    $(".itemtag" + selector).show()
    $(".itemtag:not(" + selector + ")").hide()
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
