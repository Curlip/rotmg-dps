(async function(){

    let classes = await DATA.CLASSES
    let weapons = await DATA.WEAPONS


    const slot_template = $("#slot-template").html() 
    const weapon_template = $("#weapon-template").html() 

    Mustache.parse(slot_template)
    Mustache.parse(weapon_template)

    const $list = $("#list")
    const $slots = $(".slot")
    const $weapons = $(".weapon")


    //Loop over items and create buttons in list
    for(let weapon of weapons){

        let $slot = $(`.slot#slot${weapon.SlotType}`)
    
        // If div#slot{{x}} has not been created, create it from the template
        if ( $slot.length == 0) {
            let slot_view = { slot: weapon.SlotType }
            let slot_dom = $( Mustache.render(slot_template, slot_view) )
            $list.append(slot_dom);
        }

        let weapon_dom = $( Mustache.render(weapon_template, {
            name: weapon.id,
            id: weapon.type
        }) ) 

        $slot.append(weapon_dom)
    }



    //Sort Boxes by slottype
    $slots.sort(function(a, b) {
        return parseInt(a.id.substring(4)) - parseInt(b.id.substring(4));
    }).appendTo($list)


    /* On selection change */
    $list.on("click", ".weapon", function() {
        var ele = $(this)
        var weapon = $.grep(weapons, e => e.type == ele.attr("itemid"))[0];

        $(document).trigger("item:selected", [weapon])
    });

    // On search change
    $('#search').on('input propertychange paste', function() {
        var search = `:Contains(${ $("input#search").val()} )`

        $weapons.show()
        $slots.show()
        $weapons.filter(":not(" + search + ")").hide();

        $(".slottype").each(function(){
            if($(this).find('*:visible').length <= 1){
                $(this).hide();
            }
        })
    });
})()

