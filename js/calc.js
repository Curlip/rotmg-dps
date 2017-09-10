/*

DPS CALCULATOR MODULE for Curlip's Rotmg Item Calculator. Takes selected items, and if they are weapons they will be plotted onto a DPS graph.

By Curlip

*/

var c;
var canv;
var scale;
var dpsCurves = [];
var selectedX;
var lock = false;

loaders.push(function() {
    $("#tabcontrols").prepend("<li><a href=\"#dps\">DPS</a></li>");

    $("#view").append("\
    <div id=\"dps\" class=\"tab\">    \
        <div id=\"graph-wrapper\">     \
            <canvas width=\"600\" height=\"500\" id=\"graph\"></canvas>    \
        </div>    \
        <div id=\"dps-details\"></div>    \
    </div>")

    $("#scale").val(500);

    // Recalculate the Graph if any input changes
    $("#dps-details").on("input", ".graphControl", function() {
        recalc();
        redraw();
    })

    c = document.getElementById("graph");
    canv = c.getContext("2d");

    //Move selection bar on graph.
    $("#graph").on( "mousemove", function(e){
        if(!lock){
            var rect = c.getBoundingClientRect();
            selectedX = Math.round(e.clientX - rect.left),
            redraw();
        }
    })

    //Lock selection bar on click
    $("#graph").on( "click", function(e){
        lock = !lock;
        redraw();
    })

    redraw();
})

handlers.push(function(item, selected){
    if(selected){
        var char = chars.filter(function(obj) {
            return obj.SlotTypes.split(",")[0] == item.SlotType;
        });

        if(char.length == 0){ return; }

        $("#dps-details").append(" \
            <div class=\"graphControl\" itemid=\"" + item.type + "\">"
                + "<span>" + item.id + "</span>" +
                "<select class=\"chars\">    \
                </select>    \
                <input class=\"graphColor\" type=\"color\" value=\"#" + Math.floor(Math.random() * 16777215).toString(16) + "\" />" +
                /*<div class=\"stats-wrapper\">   \
                    <div class=\"atk-in\">ATK Boost:<input class=\"atk\" type=\"number\" value=\"0\"></input></div>  \
                    <div class=\"dex-in\">DEX Boost:<input class=\"dex\" type=\"number\" value=\"0\"></input></div>  \
                </div>    \*/
                "<div class=\"dps-data\"></div>   \
            </div>")

        for(var i = 0; i < char.length; i++){
            $(".graphControl[itemid=\"" + item.type + "\"] .chars").append("<option>" + char[i].id + "</option>")
        }

        recalc();
        redraw();
    }else{
        $(".graphControl[itemid=\"" + item.type + "\"]").hide("slide",{ direction: "up" }, function(){
            this.remove();
            recalc();
            redraw();
        });
    }
})


// END HANDLERS

//Recalculate all DPS Curves
function recalc() {
    var i = 0;
    dpsCurves = [];

    // Find Canvas, and clear it
    $(".graphControl").each(function() {
        var curve = [];
        var item = getItemByType($(this).attr("itemid"))
        var proj = item.Projectile;
        var shots = (item.NumProjectiles ? item.NumProjectiles : 1);
        var rof = item.RateOfFire;
        var atk = 0;
        var dex = 0;

        if(proj == undefined) return;

        curve["color"] = $(".graphControl[itemid=" + item.type + "] .graphColor").val();

        var charName = $(this).find(".chars").val();
        var char = chars.filter(function(obj) {
            return obj.id == charName;
        })[0];

        atk = parseInt(char.Attack.max) /*+ parseInt($(this).find(".atk").val());*/
        dex = parseInt(char.Dexterity.max) /*+ parseInt($(this).find(".dex").val());*/

        for (var x = 0; x < 201; x++) {
            var aps;
            var dps;

            aps = (dex ? (1.5 + (6.5 * (dex / 75))) * rof : 1)
            dps = calcDPS(parseInt(proj.MaxDamage), parseInt(proj.MinDamage), shots, (proj.ArmorPiercing != "" ? x : 0), atk, aps);
            curve[x] = dps;
        }

        dpsCurves[i] = curve;
        i++;
    })
}

//Redraws the Graph / Outputs DPS
function redraw() {
    var def;

    canv.clearRect(0, 0, c.width, c.height);
    scale = 500;

    // Run through all DPS curves to draw and calculate a scale
    for (var j = 0; j < dpsCurves.length; j++) {
        for (var k = 0; k < dpsCurves[j].length; k++) {
            if (dpsCurves[j][k] > scale) {
                scale = Math.round((dpsCurves[j][k] + dpsCurves[j][k] / 10) /100)*100;
            }
        }
    }

    // Draw Lines on Graph
    for(var i = 0; i < 4; i++){
        canv.strokeStyle = "rgba(100,100,100,0.5)";
        canv.lineWidth = 1

        var j = 4 - i;

        canv.beginPath();
        canv.moveTo(0, j*100);
        canv.lineTo(601, j*100);
        canv.stroke();
    }

    // Draw DPS curves to the graph.
    for (var j = 0; j < dpsCurves.length; j++) {
        canv.strokeStyle = dpsCurves[j]["color"];
        canv.lineWidth = 2

        canv.beginPath();

        for (var x = 0; x < dpsCurves[j].length; x++) {
            y = 500 - (dpsCurves[j][x] / (scale / 500));

            if (x === 0) {
                canv.moveTo(x * 3, y);
            }

            canv.lineTo(x * 3, y);
        }

        canv.stroke();
    }

    //Label Graph Lines
    for(var i = 0; i < 4; i++){
        canv.fillStyle = "rgba(100,100,100,0.5)";
        canv.font = "13px Arial";

        var j = 4 - i;
        var y = j*100;
        var name = Math.round((scale / 5) * (i+1))
        var textWidth = canv.measureText(name).width

        canv.clearRect((600-textWidth)/2-1, y-6, textWidth+2, 12)
        canv.fillText(name, (600-textWidth)/2, y+5)
    }

    // DPS OUTPUT

    canv.fillStyle = "rgba(255,0,0,0.2)";
    if(lock) { canv.fillStyle = "rgb(200,0,0)"; }
    canv.fillRect(selectedX, 0, 2, 500)
    def = Math.floor(selectedX/3);
    if(!def){ def = 0; }

    var i = 0;
    $(".graphControl").each(function() {
        var itemid = $(this).attr("itemid")
        $(this).find(".dps-data").html("<span>" + dpsCurves[i][def]+"DPS <br/> @"+def+"Def </span>");

        $(this).find(".dps-data").css("background-color", $(this).find(".graphColor").val());
        var rgb = $(this).find(".dps-data").css("background-color").match(/\d+/g);
        console.log(rgb);

        if(shouldUseWhiteText(rgb[0], rgb[1], rgb[2])){
            $(this).find(".dps-data span").css("color", "#D9D9D9");
        }else {
            $(this).find(".dps-data span").css("color", "#222");
        }

        i++;
    })
}

function shouldUseWhiteText(r,g,b){
    var a = 1 - (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return (a > 0.5);
}


// Calculates DPS from Damage Range, Shot Number, Enemy DEF, and player ATK / DEX.
function calcDPS(max, min, shots, def, atk, aps) {
    var damageRange = [];
    var damageModifier = (atk ? (0.5 + atk) / 50 : 1)
    var baseDamage = 0;

    if(max != min){
        for (var i = min; i < max; i++) {
            var dam = i * damageModifier;
            var damLessDef = dam - def;

            if (damLessDef < i * 0.15) {
                damLessDef = i * 0.15;
            }

            damageRange[i] = damLessDef;
        }

        for (var i = min; i < max; i++) {
            baseDamage += damageRange[i] / (max - min);
        }
    }else{
        baseDamage = (max*damageModifier)-def;
    }

    return Math.round(baseDamage * shots * aps)
}
