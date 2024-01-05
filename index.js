import Color from "https://colorjs.io/dist/color.js";

document.querySelector("#color").onchange = e => {
    calculateForEach(e.target.value);
}

let json = {}
const html = {
    similarColors: document.getElementById("similar-colors"),
    tooltips : document.getElementById("tooltips"),
}

window.loadJson = function() {
    fetch("blocks.json")
    .then(response => response.json())
    .then(json_ => json = json_)
    .then(() => {
        fetch("references.json")
        .then(response => response.json())
        .then(json_ => json.references = json_.references)
        .then(() => {
            var link = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            const item = json.blocks[Math.floor(Math.random() * json.blocks.length)];
            link.href = item.image;
            document.getElementById("color").value = "#BF6F4A";
            calculateForEach("#BF6F4A");
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
        let ref = json.references.find(ref => ref.block == block);
        if (ref == undefined && block.includes("block")) {
            block = "block of " + block.replace("block", "").trim();
            ref = json.references.find(ref => ref.block == block);
        }
        console.log(ref, block);
        let refimage = "";
        let href = "";
        if (ref != undefined) {
            refimage = ref.image;
            href = ref.href;
        } 
        let colors = json.blocks[i].colors;
        const mean_ = meanDistance(color1, colors);
        let mean = mean_.mean;
        let closest = mean_.closest;
        list.push({block, variant, image, mean, closest, refimage, href});
    }
    list.sort((a, b) => a.mean - b.mean);
    console.log(list);
    list = list.slice(0, 10);

    let html_ = "";
    let tooltip = "";
    list.forEach((item) => {
        const blockID = item.block.replaceAll(" ", "_")+"_"+item.variant;
        const mean = item.mean;
        let percentage = 100 - mean;
        if (percentage < 0) percentage = 0; 
        html_ += `<div onmouseenter="displayTooltip('tooltip_${blockID}',true)" class="similar-color"> <img src="${item.image}" title="${item.block}"/></div>`;
        tooltip += `<div id="tooltip_${blockID}" class="tooltip"><div class="tooltip-left">`
        if (item.href != "") {
            tooltip += `<img href="${item.href}" src="${item.refimage}"/>`
        }
        tooltip += `</div><div class="tooltip-right">`;
        if (item.href != "") {
            tooltip += `<a href="${item.href}" class="similar-title">${item.block}</a>`
        } else {
            tooltip += `<p class="similar-title">${item.block}</p>`
        }
        if (item.variant != "") {
            tooltip += `<div class="tooltip-sub"><p>Texture: <span class="bold">${item.variant}</span></p></div>`            
        }
        tooltip += `<div class="tooltip-sub"><p>Score: <span style="color: ${getCssPercentage(Math.round(percentage))};" class="bold">${Math.round(percentage)}%</span></p></div></div></div>`
    });

    html.similarColors.innerHTML = html_;
    html.tooltips.innerHTML = tooltip;
}

function meanDistance(color1, colorArray) {    
    let distances = [];
    colorArray.forEach((color) => {
        let rgb = color._rgb;
        let color2 = new Color("sRGB", [rgb[0], rgb[1], rgb[2]]);
        //let color2 = new Color("sRGB", [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)]);
        Color.defaults.deltaE = "2000";
        let distance = color1.deltaE(color2);
        distances.push(distance);
    });
    let closest = Math.min(...distances);
    let mean = distances.reduce((a, b) => a + b, 0) / distances.length;
    return {"mean" : mean, "closestDistance" : closest};
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