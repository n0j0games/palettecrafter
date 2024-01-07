import Color from "https://colorjs.io/dist/color.js";
import colorVariety from "./colorVariety.js";

document.querySelector("#color").onchange = e => {
    calculateForEach(e.target.value);
}

let json = {}
const html = {
    similarColors: document.getElementById("similar-colors"),
    tooltips : document.getElementById("tooltips"),
    palette : document.getElementById("palette"),
    palette_tooltips : document.getElementById("palette-tooltips"),
    saved_palettes : document.getElementById("saved-palettes"),
}

const starter = ["#6B423D","#CF9D96","#428494","#24500C","#B94ABF","#41AA93","#BF6F4A","#707070"]
window.loadJson = function() {
    fetch("blocks.json")
    .then(response => response.json())
    .then(json_ => json = json_)
    .then(() => {
        fetch("references.json")
        .then(response => response.json())
        .then(json_ => json.references = json_.references)
        .then(() => {
            let max = 0;
            for (let i in json.blocks) {
                json.blocks[i].variety = colorVariety.calcColorVariety(json.blocks[i].colors);
                if (json.blocks[i].variety > max) {
                    max = json.blocks[i].variety;
                }
            }
            for (let i in json.blocks) {
                json.blocks[i].variety = 100 - Math.round((json.blocks[i].variety / max) * 100);
            }
            var link = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            const item = json.blocks[Math.floor(Math.random() * json.blocks.length)];
            link.href = item.image;
            //get random color from starter
            const color = starter[Math.floor(Math.random() * starter.length)];
            document.getElementById("color").value = color;
            calculateForEach(color);
            displayPalettes();
        });
    });
}

function calculateForEach(color) {
    let list = [];
    let hex = color.replace("#", "");    
    let color1 = new Color("sRGB", [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)]);
    if (hex == "000000") {
        color1 = new Color("sRGB", [5, 5, 5]);
    }
    for (let i in json.blocks) {
        const block = json.blocks[i];
        const variety = json.blocks[i].variety;
        const colors = json.blocks[i].colors;
        // Caclulates the score for the block
        const mean_ = meanDistance(color1, colors);
        let percentage = 100 - mean_.closest;
        if (percentage < 0) percentage = 0;
        let score = (percentage + variety * 0.5) / 150 * 100; // score = 100 % percentage + 50% variety
        //let score = percentage < variety ? percentage : variety;
        if (score < 40) continue;
        list.push({block, score});
    }
    list.sort((a, b) => b.score - a.score);
    list = list.slice(0, 10);

    let html_ = "";
    let tooltip = "";
    list.forEach((item) => {        
        const imageConv = item.block.image.replace("\\", "%2F");
        html_ += `<div onclick="addToPalette('${item.block.id}','${item.block.name}','${imageConv}')" onmouseenter="displayTooltip('tooltip_main_${item.block.id}',true)" class="similar-color"> <img src="${item.block.image}" title="${item.block.name}"/></div>`;
        tooltip += getTooltip(item,"main");
    });

    html.similarColors.innerHTML = html_;
    html.tooltips.innerHTML = tooltip;
}

function getTooltip(item,type) {
    let tooltip = "";
    tooltip += `<div id="tooltip_${type}_${item.block.id}" class="tooltip"><div class="tooltip-left">`
    if (item.href != "") {
        tooltip += `<img src="${item.block.refimage}"/>`
    }
    tooltip += `</div><div class="tooltip-right">`;
    tooltip += `<p class="similar-title">${item.block.name}</p>`
    /*if (item.href != "") {
        tooltip += `<a href="${item.href}" target="_blank" class="similar-title">${item.block}</a>`
    } else {
        tooltip += `<p class="similar-title">${item.block}</p>`
    }*/
    if (item.block.variant != "") {
        tooltip += `<div class="tooltip-sub"><p>Texture: <span class="bold">${item.block.variant}</span></p></div>`            
    }
    if (item.score != undefined) {
        tooltip += `<div class="tooltip-sub"><p>Score: <span style="color: ${getCssPercentage(Math.round(item.score))};" class="bold">${Math.round(item.score)}%</span></p></div>`
    }
    tooltip += `<div class="tooltip-sub"><p>Colors: </p><svg>`
    for (let c in item.block.colors) {
        let rgb = item.block.colors[c]._rgb;
        tooltip += `<rect x=${c*20} style="fill: rgb(${rgb[0]},${rgb[1]},${rgb[2]});"/>`
    }
    tooltip += `</svg></div></div></div>`
    return tooltip;
}

function meanDistance(color1, colorArray) {    
    let distances = [];
    let closest = 10000;
    colorArray.forEach((color) => {
        let rgb = color._rgb;
        let color2 = new Color("sRGB", [rgb[0], rgb[1], rgb[2]]);
        //let color2 = new Color("sRGB", [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)]);
        Color.defaults.deltaE = "2000";
        let distance = color1.deltaE(color2);
        distances.push(distance);
        if (distance < closest) {
            closest = distance;
        }
    });
    let mean = distances.reduce((a, b) => a + b, 0) / distances.length;
    return {"mean" : mean, "closest" : closest};
}

window.displayTooltip = function(id, enable) {
    const elems = document.getElementsByClassName("tooltip");
    if (elems.length == 0) return;
    for (const elem in elems) {
        elems.item(elem).style.display = "none";
    }
    if (enable) {
        document.getElementById(id).style.display = "flex";
    }
}

window.addToPalette = function(blockID) {
    const block = getBlockById(blockID);
    const item = document.getElementById(`item_${blockID}`);
    if (item != undefined) return;

    const html_ = `<div id="item_${block.id}" onclick="removeFromPalette('${block.id}')" onmouseenter="displayTooltip('tooltip_palette_${block.id}',true)" class="similar-color palette-item"> <img src="${block.image}" title="${block.name}"/></div>`;
    const tooltip = getTooltip({"block":block},"palette");
    if (html.palette.innerHTML.trim() == '<i class="fa-solid fa-palette" aria-hidden="true"></i>') {
        html.palette.innerHTML = html_;
    } else {
        html.palette.innerHTML += html_;
    }
    html.palette_tooltips.innerHTML += tooltip;
}

window.removeFromPalette = function(blockID) {
    const item = document.getElementById(`item_${blockID}`);
    if (item == undefined) return;
    item.remove();
    if (html.palette.innerHTML.trim() == "") {
        html.palette.innerHTML = '<i class="fa-solid fa-palette" aria-hidden="true"></i>';
    }
    const tooltip = document.getElementById(`tooltip_palette_${blockID}`);
    tooltip.remove();
}

window.clearPalette = function() {
    html.palette.innerHTML = '<i class="fa-solid fa-palette" aria-hidden="true"></i>';
    html.palette_tooltips.innerHTML = "";
}

window.replacePalette = function(palette) {   
    window.clearPalette();
    for (let j = 0; j < palette.length; j++) {
        const block = getBlockById(palette[j]);
        window.addToPalette(block.id);
    }
}

window.savePalette = function() {
    let palette = [];
    const items = document.getElementsByClassName("palette-item");
    if (items.length == 0) return;
    for (let i = 0; i < items.length; i++) {
        const item = items.item(i);
        const id = item.id.replace("item_", "");
        palette.push(id);
    }
    const storage = localStorage.getItem("palette");
    let json_ = [];
    if (storage != null) {
        json_ = JSON.parse(storage);
    }
    json_.push(palette);
    localStorage.setItem("palette", JSON.stringify(json_));
    displayPalettes();
}

window.clearSaves = function() {
    localStorage.removeItem("palette");
    displayPalettes();
}

function displayPalettes() {
    const storage = localStorage.getItem("palette");
    if (storage == null) {
        html.saved_palettes.innerHTML = "";
        return;
    }
    const json_ = JSON.parse(storage);
    html.saved_palettes.innerHTML = "";
    for (let i = 0; i < json_.length; i++) {
        const palette = json_[i];
        let html__ = "";
        for (let j = 0; j < palette.length; j++) {
            const block = getBlockById(palette[j]);
            html__ += `<div id="mini_${block.id}" class="mini-color"><img src="${block.image}"/></div>`;
        }
        const str = JSON.stringify(palette);
        const textpalette = str.replaceAll('"', "'");
        html.saved_palettes.innerHTML += `<div class="mini-palette"><div class="mini-palette-items">${html__}</div>
        <button class="load-button" onclick="replacePalette(${textpalette})"><i class="fa-solid fa-arrow-up-from-bracket"></i></button>
        <!--<button><i class="fa-regular fa-trash-can"></i></button>-->
        </div>`;
    }
}

function getCssPercentage(percentage) {
    if (percentage > 90) {
        return "#14A02E";
    } else if (percentage > 80) {
        return "#59C135";
    } else if (percentage > 70) {
        return "#9CDB43";
    } else if (percentage > 60) {
        return "#D6F264";
    } else if (percentage > 50) {
        return "#FFFC40";
    } else if (percentage > 40) {
        return "#FFD541";
    } else {
        return "#DF3E23";
    }
}

function getBlockById(id) {
    return json.blocks.find(block => block.id == id);
}