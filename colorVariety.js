import Color from "https://colorjs.io/dist/color.js";

export default {
    calcColorVariety
  };

function calcColorVariety(colorArray) {    

    let colorArrayCopy = [];
    colorArray.forEach((color) => {
        colorArrayCopy.push(color);
    });

    let previous = null;
    let sum = 0;
    for (let i=0; i<colorArray.length; i++) {
        let res = null;
        if (i==0) {
            res = nearestColor([1,1,1],colorArrayCopy);
        } else {
            res = nearestColor(previous._rgb,colorArrayCopy);
            sum += res.distance;
        }
        previous = res.color;
        const index = colorArrayCopy.indexOf(previous);
        colorArrayCopy.splice(index,1);                
    }

    return sum;
}

function nearestColor(color, colorArray) {    
    let color1 = new Color("sRGB", [color[0], color[1], color[2]]);
    let closest = 10000;
    let closestColor = null;
    colorArray.forEach((c) => {
        let rgb = c._rgb;
        let color2 = new Color("sRGB", [rgb[0], rgb[1], rgb[2]]);
        Color.defaults.deltaE = "2000";
        let distance = color1.deltaE(color2);
        if (distance < closest) {
            closest = distance;
            closestColor = c;
        }
    });
    return {"color" : closestColor, "distance" : closest};
}