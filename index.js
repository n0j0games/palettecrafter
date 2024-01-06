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
            console.log("MAX",max);
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
        let block = json.blocks[i].block;
        let variant = json.blocks[i].variant;
        let image = json.blocks[i].image;
        let variety = json.blocks[i].variety;
        block = block.replace("lapis", "lapis lazuli");
        block = block.replace("hay block", "hay bale");
        block = block.replace("magma", "magma block");
        let ref = json.references.find(ref => ref.block == block);
        if (ref == undefined && block.includes("block")) {
            block = "block of " + block.replace("block", "").trim();
            ref = json.references.find(ref => ref.block == block);
        }
        let refimage = "";
        let href = "";
        if (ref != undefined) {
            refimage = ref.image;
            href = ref.href;
        } 
        let colors = json.blocks[i].colors;

        // Caclulates the score for the block
        const mean_ = meanDistance(color1, colors);
        let percentage = 100 - mean_.closest;
        if (percentage < 0) percentage = 0;
        let score = (percentage + variety * 0.5) / 150 * 100; // score = 100 % percentage + 50% variety
        //let score = percentage < variety ? percentage : variety;
        if (score < 40) continue;
        list.push({block, variant, image, score, percentage, refimage, href, colors, variety});
    }
    list.sort((a, b) => b.score - a.score);
    list = list.slice(0, 10);

    let html_ = "";
    let tooltip = "";
    list.forEach((item) => {
        const blockID = item.block.replaceAll(" ", "_")+"_"+item.variant;
        const imageConv = item.image.replace("\\", "%2F");
        html_ += `<div onclick="addToPalette('${blockID}','${item.block}','${imageConv}')" onmouseenter="displayTooltip('tooltip_${blockID}',true)" class="similar-color"> <img src="${item.image}" title="${item.block}"/></div>`;
        tooltip += getTooltip(blockID, item);
    });

    html.similarColors.innerHTML = html_;
    html.tooltips.innerHTML = tooltip;
}

function getTooltip(blockID, item) {
    let tooltip = "";
    tooltip += `<div id="tooltip_${blockID}" class="tooltip"><div class="tooltip-left">`
    if (item.href != "") {
        tooltip += `<img src="${item.refimage}"/>`
    }
    tooltip += `</div><div class="tooltip-right">`;
    tooltip += `<p class="similar-title">${item.block}</p>`
    /*if (item.href != "") {
        tooltip += `<a href="${item.href}" target="_blank" class="similar-title">${item.block}</a>`
    } else {
        tooltip += `<p class="similar-title">${item.block}</p>`
    }*/
    if (item.variant != "") {
        tooltip += `<div class="tooltip-sub"><p>Texture: <span class="bold">${item.variant}</span></p></div>`            
    }
    tooltip += `<div class="tooltip-sub"><p>Score: <span style="color: ${getCssPercentage(Math.round(item.score))};" class="bold">${Math.round(item.score)}%</span></p></div>`
    /*tooltip += `<div class="tooltip-sub"><p>Similarity: <span style="color: ${getCssPercentage(Math.round(item.percentage))};" class="bold">${Math.round(item.percentage)}%</span></p></div>`
    tooltip += `<div class="tooltip-sub"><p>Smoothness: <span style="color: ${getCssPercentage(Math.round(item.variety))};" class="bold">${Math.round(item.variety)}%</span></p></div>`*/
    tooltip += `<div class="tooltip-sub"><p>Colors: </p><svg>`
    for (let c in item.colors) {
        let rgb = item.colors[c]._rgb;
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

window.addToPalette = function(blockID, block, image) {
    const item = document.getElementById(`item_${blockID}`);
    if (item != undefined) return;

    const html_ = `<div id="item_${blockID}" onclick="removeFromPalette('${blockID}')" class="similar-color"> <img src="${image}" title="${block}"/></div>`;
    if (html.palette.innerHTML.trim() == '<i class="fa-solid fa-palette" aria-hidden="true"></i>') {
        html.palette.innerHTML = html_;
    } else {
        html.palette.innerHTML += html_;
    }
}

window.removeFromPalette = function(blockID) {
    const item = document.getElementById(`item_${blockID}`);
    if (item == undefined) return;
    item.remove();
    if (html.palette.innerHTML.trim() == "") {
        html.palette.innerHTML = '<i class="fa-solid fa-palette" aria-hidden="true"></i>';
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
