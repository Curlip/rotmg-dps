/**
 *
 * data.js
 *
 * Loads Object.json from static.drips and sort weapons and classes into an array
 *
 */
const DATA = (function(){
    // Decide whether to get data from testing
    const URL1 = (getURLParameter("mode") == "testing" ? "https://static.drips.pw/rotmg/testing/current" : "https://static.drips.pw/rotmg/production/current");

    // Load Objects.json from static.drips
    const OBJECTS = new Promise(function(resolve){
        $.getJSON(URL1 + "/json/Objects.json", function(res) {
            resolve(res.Object)
        })
    })

    // Sort out graph-able weapons
    const WEAPONS = new Promise(async function(resolve){
        resolve( (await OBJECTS).filter(object => 
               object.Class == "Equipment" 
            && object.Projectile != undefined
            && object.RateOfFire != undefined
        ))
    })

    // Sort out classes
    const CLASSES = new Promise(async function(resolve){
        resolve( (await OBJECTS).filter(object => object.Class == "Player") )
    })



    return {
        objects: OBJECTS,
        WEAPONS: WEAPONS,                       
        CLASSES: CLASSES,
    }
}())
