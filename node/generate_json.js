const path = require('path')
const fs = require('fs');
const getColors = require('get-image-colors');
const Color = require('colorjs.io');

let filenames = [];
let json = {
    "blocks": []
};

const endings = ["top","bottom","side","open","closed","side0","side1","side2","side3","moist","front","0","front honey","on","corner","data","load","save"];

fs.readdir("../blocks", (err, files) => {
    files.forEach(file => {
        filenames.push(file);
    });
    for (let i in filenames) {
        const filename = filenames[i];
        if (!filename.endsWith(".png")) continue;
        const options = {
            count: 5,
        }
        getColors(path.join("../blocks/", filename),options).then(colors => {
            let new_filename = filename.replace(".png", "").replaceAll("_", " ").toLowerCase().trim();
            let variant = "";
            for (let ending in endings) {
                if (new_filename.endsWith(" " + endings[ending])) {
                    new_filename = new_filename.replace(" " + endings[ending], "").trim();
                    variant = endings[ending];
                }
            }
            let json_ = {
                block: new_filename,
                image: path.join("blocks", filename),
                colors: colors,
                variant: variant
                //variety: calcColorVariety(colors),
            }
            json.blocks.push(json_);
            console.log(`File ${filename} processed.`);
            if (i == filenames.length-1) {
                fs.writeFile(`../blocks.json`, JSON.stringify(json), function(err) {
                    if (err) { console.log(err); }
                    else { console.log("File saved."); }
                });
            }
        })
    }
});

