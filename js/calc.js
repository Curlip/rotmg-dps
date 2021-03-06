/*

DPS CALCULATOR MODULE for Curlip's Rotmg Item Calculator. Takes selected items, and if they are weapons they will be plotted onto a DPS graph.

By Curlip

*/

const DPS_CALC = (function() {

    var canv;
    var tab;

    var dpsCurves = [];
    var selection;
    var lock = false;

    $(document).ready(function() {
        tab = new UI.Tab("DPS", "dps")

        tab.display.append(
            "<div id=\"graph-wrapper\">     \
                <canvas width=\"600\" height=\"500\" id=\"dps-graph\"></canvas>    \
            </div>    \
            <div id=\"dps-details\"></div>"
        )

        tab.display.find("#dps-graph").on("mousemove", function(e) {
            if (!lock) {
                var rect = tab.display.find("#dps-graph")[0].getBoundingClientRect();
                selection = Math.round(e.clientX - rect.left),

                updateGraph();
            }
        })

        tab.display.find("#dps-graph").on("click", function(e) {
            lock = !lock;
            updateGraph();
        })

        tab.itemSelected = function(item){
            var curve = new Curve(item);

            dpsCurves.push(curve);
            updateGraph();
        }

        canv = tab.display.find("#dps-graph")[0].getContext("2d");

        UI.addTab(tab)
        updateGraph();
    })



    class Curve {

        constructor(item){
            this.item = item
            this.char = $.grep(DATA.chars, function(obj) {
                return obj.SlotTypes.split(",")[0] == item.SlotType;
            })

            if (this.char.length == 0)  return;

            this.color = "#" + Math.floor(Math.random() * 16777215).toString(16);

            var uid = Math.round(Math.random() * 9999);

            this.dom = $(
                "<div class=\"graphControl\" itemid=\"" + this.item.type + "\">" +
                    "<div class=\"close\">&#10006;</div>                                 \
                    <span>" + this.item.id + "</span><br />" +
                    "<select class=\"chars\">                                       \
                    </select>                                                       \
                    <div class=\"modifiers\">                                       \
                        <input id=\"berzerk" + uid +"\" class=\"berzerk\" type=\"checkbox\" />      \
                        <label for=\"berzerk" + uid +"\" class=\"berzerk\"></label>                      \
                        <input id=\"damaging" + uid +"\" class=\"damaging\" type=\"checkbox\" />     \
                        <label for=\"damaging" + uid +"\" class=\"damaging\"></label>                    \
                        <input id=\"daze" + uid +"\" class=\"daze\" type=\"checkbox\" />         \
                        <label for=\"daze" + uid +"\" class=\"daze\"></label>                           \
                        <input id=\"weak" + uid +"\" class=\"weak\" type=\"checkbox\" />         \
                        <label for=\"weak" + uid +"\" class=\"weak\"></label>                            \
                        <input id=\"curse" + uid +"\" class=\"curse\" type=\"checkbox\" />        \
                        <label for=\"curse" + uid +"\" class=\"curse\"></label>                          \
                    </div>                                                          \
                    <input class=\"graphColor\" type=\"color\" value=\"" + this.color + "\" />" +
                    "<div class=\"dps-data\"></div>   \
                </div>"
            )

            $("#dps-details").append(this.dom)

            var me = this;

            this.dom.find(".graphColor").on("change", function(){
                me.color = $(this).val();
                updateGraph();
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

        recalculateCurve() {
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

                var aps = calcAPS(dex, rof)
                var mod = calcDamMod(atk)

                if (berzerk && !daze) aps *= 1.5;
                if (damaging && !weak) mod *= 1.5;

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

        displayDPS(def) {
            if(!def){
                def = 0;
            }

            this.dom.find(".dps-data").html("<span>" + this.points[def] + "DPS @ " + def + "Def </span>");
            this.dom.find(".dps-data").css("background-color", this.dom.find(".graphColor").val())
            var rgb = this.dom.find(".dps-data").css("background-color").match(/\d+/g);
            this.dom.find(".dps-data").find("span").css("color", (shouldUseWhiteText(rgb[0], rgb[1], rgb[2]) ? "#D9D9D9" : "#222"));
        };
    }

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
        canv.clearRect(0, 0, tab.display.find("#dps-graph")[0].width, tab.display.find("#dps-graph")[0].height);

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
        var trueDamageAverage = 0;

        var i = min;
        var damageAverage = [];

        do{
            var dam = i * mod;
            var damLessDef = dam - def;

            if (damLessDef < dam * 0.15) {
                damLessDef = dam * 0.15;
            }

            damageAverage[i] = damLessDef;

            i++;
        }
        while(i < max);

        i = min;

        do{
            trueDamageAverage += damageAverage[i];
            i++;
        }while(i < max);

        trueDamageAverage /= ((max - min)||1);

        return trueDamageAverage;
    }



    return {
        calculateScale: calculateScale,
        calcShotDamage: calcShotDamage,
        calcAttackPerSec: calcAPS
    }



}())
