/*

DPS CALCULATOR MODULE for Curlip's Rotmg Item Calculator. Takes selected items, and if they are weapons they will be plotted onto a DPS graph.

By Curlip

*/

const DPS_CALC = (function() {

    var c;
    var canv;
    var dpsCurves = [];
    var selectedX;
    var lock = false;

    $(document).ready(function() {
        $("#tabcontrols").prepend("<li><a href=\"#dps\">DPS</a></li>");

        $("#view").append("\
        <div id=\"dps\" class=\"tab\">    \
            <div id=\"graph-wrapper\">     \
                <canvas width=\"600\" height=\"500\" id=\"graph\"></canvas>    \
            </div>    \
            <div id=\"dps-details\"></div>    \
        </div>")



        c = document.getElementById("graph");
        canv = c.getContext("2d");

        // Recalculate curve if control is modified
        $("#dps-details").on("change", ".graphControl", function() {
            dpsCurves[$(this).index()] = calculateCurveFromControl(this);
            updateDisplay(canv, dpsCurves, selectedX, lock);
        })

        //Move selection bar on graph.
        $("#graph").on("mousemove", function(e) {
            if (!lock) {
                var rect = c.getBoundingClientRect();
                selectedX = Math.round(e.clientX - rect.left),
                    updateDisplay(canv, dpsCurves, selectedX, lock);
            }
        })

        //Lock selection bar on click
        $("#graph").on("click", function(e) {
            lock = !lock;
            updateDisplay(canv, dpsCurves, selectedX, lock);
        })

        drawLines(canv);
        drawLabels(canv, 500)
    })

    UI.on("selectionChange", function(item, selected) {
        if (selected) {
            var char = $.grep(DATA.chars, function(obj) {
                return obj.SlotTypes.split(",")[0] == item.SlotType;
            });

            if (char.length == 0) {
                return;
            }

            $("#dps-details").append(" \
                <div class=\"graphControl\" itemid=\"" + item.type + "\">" +
                "<span>" + item.id + "</span>" +
                "<select class=\"chars\">    \
                    </select>    \
                    <div class=\"modifiers\">    \
                    <input class=\"modifier berzerk\" type=\"checkbox\" />    \
                    <label for=\"berzerk\">Berzerk</label>  \
                    <input class=\"modifier damaging\" type=\"checkbox\" />    \
                    <label for=\"damaging\">Damaging</label>  \
                    <input class=\"modifier daze\" type=\"checkbox\" />    \
                    <label for=\"daze\">Dazed</label>  \
                    <input class=\"modifier weak\" type=\"checkbox\" />    \
                    <label for=\"weak\">Weak</label>  \
                    <input class=\"modifier curse\" type=\"checkbox\" />    \
                    <label for=\"weak\">Cursed</label>  \
                    </div>    \
                    \
                    <input class=\"graphColor\" type=\"color\" value=\"#" + Math.floor(Math.random() * 16777215).toString(16) + "\" />" +
                /*<div class=\"stats-wrapper\">   \
                    <div class=\"atk-in\">ATK Boost:<input class=\"atk\" type=\"number\" value=\"0\"></input></div>  \
                    <div class=\"dex-in\">DEX Boost:<input class=\"dex\" type=\"number\" value=\"0\"></input></div>  \
                </div>    \*/
                "<div class=\"dps-data\"></div>   \
                </div>")

            for (var i = 0; i < char.length; i++) {
                $(".graphControl[itemid=\"" + item.type + "\"] .chars").append("<option>" + char[i].id + "</option>")
            }

            $(".graphControl[itemid=\"" + item.type + "\"]").each(function() {
                dpsCurves.push(calculateCurveFromControl(this))
            })

            updateDisplay(canv, dpsCurves, selectedX, lock);
        } else {
            $(".graphControl[itemid=\"" + item.type + "\"]").hide("slide", {
                direction: "up"
            }, function() {
                this.remove();

                dpsCurves.splice($(this).index(),1)
                updateDisplay(canv, dpsCurves, selectedX, lock);
            });
        }
    })


    // END HANDLERS

    function calculateCurve(item, char, weak, daze, berzerk, damaging, curse){
        var curve = [];

        var proj = item.Projectile;

        for (var x = 0; x < 201; x++) {
            var aps;
            var baseDamage;
            var shots;
            var damageMod;
            var atk;
            var dex;
            var rof;

            rof = item.RateOfFire;
            atk = parseInt(char.Attack.max);
            dex = parseInt(char.Dexterity.max);

            if (weak) atk = 0;
            if (daze) dex = 0;

            aps = calcAPS(dex, rof)
            damageMod = calcDamMod(atk)

            if (berzerk && !daze) aps *= 1.5;
            if (damaging && !weak) damageMod *= 1.5;


            baseDamage = calcShotDamage(
                parseInt(proj.MaxDamage),
                parseInt(proj.MinDamage),
                (proj.ArmorPiercing != "" ? x : 0),
                damageMod
            );

            shots = (item.NumProjectiles ? item.NumProjectiles : 1);

            var dps = aps * baseDamage * shots;
            if (curse) dps *= 1.2;

            curve[x] = Math.round(dps);
        }

        return curve;
    }

    function calculateCurveFromControl(control){
        var item = $.grep(DATA.items, function(e) {
            return e.type == $(control).attr("itemid")
        })[0];

        var weak = $(control).find(".weak").is(":checked");
        var daze = $(control).find(".daze").is(":checked");
        var berzerk = $(control).find(".berzerk").is(":checked");
        var damaging = $(control).find(".damaging").is(":checked");
        var curse = $(control).find(".curse").is(":checked");

        var charName = $(control).find(".chars").val();
        var char = DATA.chars.filter(function(obj) {
            return obj.id == charName;
        })[0];

        var curve = calculateCurve(item, char, weak, daze, berzerk, damaging, curse);
        curve["color"] = $(control).find(".graphColor").val();

        return curve;
    }

    //Recalculate all DPS Curves
    function recalculateAllCurves() {
        var i = 0;
        dpsCurves = [];

        // Find Canvas, and clear it
        $(".graphControl").each(function() {
            dpsCurves.push(calculateCurveFromControl(this));
        })
    }

    function calculateScale(curves){
        var scale = 500;

        // Run through all DPS curves to draw and calculate a scale
        for (var j = 0; j < curves.length; j++) {
            for (var k = 0; k < curves[j].length; k++) {
                if (curves[j][k] > scale) {
                    scale = Math.round((curves[j][k] + curves[j][k] / 10) / 100) * 100;
                }
            }
        }

        return scale;
    }

    function drawLines(canv){
        // Draw Lines on Graph
        for (var i = 0; i < 4; i++) {
            canv.strokeStyle = "rgba(100,100,100,0.5)";
            canv.lineWidth = 1

            var j = 4 - i;

            canv.beginPath();
            canv.moveTo(0, j * 100);
            canv.lineTo(601, j * 100);
            canv.stroke();
        }
    }

    function drawCurves(canv, curves, scale){
        // Draw DPS curves to the graph.
        for (var j = 0; j < curves.length; j++) {
            canv.strokeStyle = curves[j]["color"];
            canv.lineWidth = 2

            canv.beginPath();

            for (var x = 0; x < curves[j].length; x++) {
                y = 500 - (curves[j][x] / (scale / 500));

                if (x === 0) {
                    canv.moveTo(x * 3, y);
                }

                canv.lineTo(x * 3, y);
            }

            canv.stroke();
        }
    }

    function drawLabels(canv, scale){
        //Label Graph Lines
        for (var i = 0; i < 4; i++) {
            canv.fillStyle = "rgba(100,100,100,0.5)";
            canv.font = "13px Arial";

            var j = 4 - i;
            var y = j * 100;
            var name = Math.round((scale / 5) * (i + 1))
            var textWidth = canv.measureText(name).width

            canv.clearRect((600 - textWidth) / 2 - 1, y - 6, textWidth + 2, 12)
            canv.fillText(name, (600 - textWidth) / 2, y + 5)
        }
    }

    //Redraws the Graph / Outputs DPS
    function updateDisplay(canv, curves, selection, locked) {
        canv.clearRect(0, 0, c.width, c.height);

        var scale = calculateScale(dpsCurves);

        drawLines(canv);
        drawCurves(canv, dpsCurves, scale);
        drawLabels(canv, scale)

        // DPS OUTPUT

        canv.fillStyle = "rgba(255,0,0,0.2)";
        if (locked) canv.fillStyle = "rgb(200,0,0)";
        canv.fillRect(selection, 0, 2, 500)

        var def = Math.floor(selection / 3);

        $("#dps-details .dps-data").each(function(){
            var itemid = $(this).parent().attr("itemid")
            var parent = $(this).parent()


            $(this).html("<span>" + dpsCurves[parent.index()][def] + "DPS <br/> @" + def + "Def </span>");

            $(this).css("background-color", parent.find(".graphColor").val());
            var rgb = $(this).css("background-color").match(/\d+/g);
            var textColor = (shouldUseWhiteText(rgb[0], rgb[1], rgb[2]) ? "#D9D9D9" : "#222")

            $(this).find("span").css("color", textColor);

        })
    }

    function shouldUseWhiteText(r, g, b) {
        var a = 1 - (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return (a > 0.5);
    }


    // Calculates DPS from Damage Range, Shot Number, Enemy DEF, and player ATK / DEX.
    function calcAPS(dex, rof) {
        return (1.5 + (6.5 * (dex / 75))) * rof;
    }

    function calcDamMod(atk){
        return 0.5 + (atk / 50);
    }

    function calcShotDamage(max, min, def, mod) {
        var damageRange = [];
        var baseDamage = 0;

        if (max != min) {
            for (var i = min; i < max; i++) {
                var dam = i * mod;
                var damLessDef = dam - def;

                if (damLessDef < i * 0.15) {
                    damLessDef = i * 0.15;
                }

                damageRange[i] = damLessDef;
            }

            for (var i = min; i < max; i++) {
                baseDamage += damageRange[i] / (max - min);
            }
        } else {
            baseDamage = (max * mod) - def;
        }

        return baseDamage;
    }



    return {
        calculateScale: calculateScale,
        calcShotDamage: calcShotDamage,
        calcAttackPerSec: calcAPS
    }



}())
