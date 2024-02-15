const fs = require('fs');
const readline = require('readline');
const Xray = require('x-ray');
const x = Xray();

let json = {
    "references": []
};

function gen() {
  x('https://minecraft.wiki/w/Block#List_of_blocks', '.div-col ul li', [{
    title: ['a@title'],
    src: 'img@src',
    href: ['a@href']
  }])(function(err, obj) {
      if (err) { console.log(err); }
      else {
          obj.forEach((item) => {
              console.log(item);
              item.src = item.src.split("?")[0].split("/30px")[0];
              item.src = item.src.replace("/thumb", "");
              item.href = item.href[1];
              item.title = item.title[item.title.length-1].toLowerCase().trim();
              json.references.push({"block" : item.title, "image" : item.src, "href" : item.href});
          });
          fs.writeFile(`../references.json`, JSON.stringify(json), function(err) {
            if (err) { console.log(err); }
            else { console.log("File saved."); }
          });
      }
  });
}

gen();