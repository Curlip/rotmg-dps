/*

DPS CALCULATOR MODULE for Curlip's Rotmg Item Calculator. Takes selected items, and if they are weapons they will be plotted onto a DPS graph.

By Curlip

*/

const DPS_CALC = (function() {

    var c;
    var canv;

    var dpsCurves = [];
    var selection;
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

        //Move selection bar on graph.
        $("#graph").on("mousemove", function(e) {
            if (!lock) {
                var rect = c.getBoundingClientRect();
                selection = Math.round(e.clientX - rect.left),
                updateGraph();
            }
        })

        //Lock selection bar on click
        $("#graph").on("click", function(e) {
            lock = !lock;
            updateGraph();
        })

        updateGraph();
    })

    UI.on("addItem", function(item) {
        var curve = new Curve(item);

        dpsCurves.push(curve);
        updateGraph();
    })


    var Curve = function(item){
        this.item = item
        this.char = $.grep(DATA.chars, function(obj) {
            return obj.SlotTypes.split(",")[0] == item.SlotType;
        })

        if (this.char.length == 0)  return;

        this.color = "#" + Math.floor(Math.random() * 16777215).toString(16);

        this.dom = $(
            "<div class=\"graphControl\" itemid=\"" + this.item.type + "\">" +
                "<div class=\"close\">&#10006;</div>                                 \
                <span>" + this.item.id + "</span>" +
                "<select class=\"chars\">                                       \
                </select>                                                       \
                <div class=\"modifiers\">                                       \
                    <input class=\"modifier berzerk\" type=\"checkbox\" />      \
                    <label for=\"berzerk\">Berzerk</label>                      \
                    <input class=\"modifier damaging\" type=\"checkbox\" />     \
                    <label for=\"damaging\">Damaging</label>                    \
                    <input class=\"modifier daze\" type=\"checkbox\" />         \
                    <label for=\"daze\">Dazed</label>                           \
                    <input class=\"modifier weak\" type=\"checkbox\" />         \
                    <label for=\"weak\">Weak</label>                            \
                    <input class=\"modifier curse\" type=\"checkbox\" />        \
                    <label for=\"weak\">Cursed</label>                          \
                </div>                                                          \
                <input class=\"graphColor\" type=\"color\" value=\"" + this.color + "\" />" +
                "<div class=\"dps-data\"></div>   \
            </div>"
        )

        $("#dps-details").append(this.dom)

        var me = this;

        me.dom.find(".dps-data").css("background-color", me.dom.find(".graphColor").val())
        var rgb = me.dom.find(".dps-data").css("background-color").match(/\d+/g);
        me.dom.find(".dps-data").find("span").css("color", (shouldUseWhiteText(rgb[0], rgb[1], rgb[2]) ? "#D9D9D9" : "#222"));

        this.dom.find(".graphColor").on("change", function(){
            me.color = $(this).val();

            me.dom.find(".dps-data").css("background-color", me.dom.find(".graphColor").val())
            var rgb = me.dom.find(".dps-data").css("background-color").match(/\d+/g);
            me.dom.find(".dps-data").find("span").css("color", (shouldUseWhiteText(rgb[0], rgb[1], rgb[2]) ? "#D9D9D9" : "#222"));
        })

        function refresh(){
            me.recalculateCurve();
            updateGraph();
        }

        this.dom.find(".modifiers").on("change", refresh)
        this.dom.find(".chars").on("change", refresh)

        this.dom.find(".close").on("click", function(){
            $(this).parent().remove();
            dpsCurves.splice(dpsCurves.indexOf(me),1);
            updateGraph();
        })

        for (var i = 0; i < this.char.length; i++) {
            this.dom.find(".chars").append("<option>" + this.char[i].id + "</option>")
        }

        this.recalculateCurve()
    }

    Curve.prototype.recalculateCurve = function () {
        var charName = this.dom.find(".chars").val();
        var char = $.grep(DATA.chars, function(obj) {
            return obj.id == charName;
        })[0];

        var weak = this.dom.find(".weak").is(":checked");
        var daze = this.dom.find(".daze").is(":checked");
        var berzerk = this.dom.find(".berzerk").is(":checked");
        var damaging = this.dom.find(".damaging").is(":checked");
        var curse = this.dom.find(".curse").is(":checked");

        this.points = [];

        for (var x = 0; x < 201; x++) {
            var rof = this.item.RateOfFire;
            var atk = parseInt(char.Attack.max);
            var dex = parseInt(char.Dexterity.max);
            var shots = (this.item.NumProjectiles ? this.item.NumProjectiles : 1);

            if (weak) atk = 0;
            if (daze) dex = 0;
            if (berzerk && !daze) aps *= 1.5;
            if (damaging && !weak) mod *= 1.5;

            var aps = calcAPS(dex, rof)
            var mod = calcDamMod(atk)

            var baseDamage = calcShotDamage(
                parseInt(this.item.Projectile.MaxDamage),
                parseInt(this.item.Projectile.MinDamage),
                (this.item.Projectile.ArmorPiercing != "" ? x : 0),
                mod
            );

            var dps = aps * baseDamage * shots;
            if (curse) dps *= 1.2;

            this.points[x] = Math.round(dps);
        }
    }

    Curve.prototype.displayDPS = function (def) {
        if(!def){
            def = 0;
        }

        this.dom.find(".dps-data").html("<span>" + this.points[def] + "DPS <br/> @" + def + "Def </span>");
    };

    // END HANDLERS


    function calculateScale(curves){
        var scale = 500;

        // Run through all DPS curves to draw and calculate a scale
        for (var j = 0; j < curves.length; j++) {
            for (var k = 0; k < curves[j].points.length; k++) {
                if (curves[j].points[k] > scale) {
                    scale = Math.round((curves[j].points[k] + curves[j].points[k] / 10) / 100) * 100;
                }
            }
        }

        return scale;
    }


    function drawCurve(canv, curve, scale){
        canv.strokeStyle = curve.color;
        canv.lineWidth = 2

        canv.beginPath();

        for (var x = 0; x < curve.points.length; x++) {
            y = 500 - (curve.points[x] / (scale / 500));

            if (x == 0)  canv.moveTo(x * 3, y);
            canv.lineTo(x * 3, y);
        }

        canv.stroke();
    }


    function updateGraph(){
        canv.clearRect(0, 0, c.width, c.height);

        var scale = calculateScale(dpsCurves);

        for (var i = 0; i < 4; i++) {
            canv.strokeStyle = "rgba(100,100,100,0.5)";
            canv.lineWidth = 1

            var j = 4 - i;

            canv.beginPath();
            canv.moveTo(0, j * 100);
            canv.lineTo(601, j * 100);
            canv.stroke();
        }

        var def = Math.floor(selection / 3);

        for (var j = 0; j < dpsCurves.length; j++) {
            drawCurve(canv, dpsCurves[j], scale)
            dpsCurves[j].displayDPS(def)
        }

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

        canv.fillStyle = "rgba(255,0,0,0.2)";
        if (lock) canv.fillStyle = "rgb(200,0,0)";
        canv.fillRect(selection, 0, 2, 500)
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

            if (baseDamage < baseDamage * 0.15) {
                baseDamage = baseDamage * 0.15
            }
        }

        return baseDamage;
    }



    return {
        calculateScale: calculateScale,
        calcShotDamage: calcShotDamage,
        calcAttackPerSec: calcAPS
    }



}())
