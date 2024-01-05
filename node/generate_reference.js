const fs = require('fs');
const readline = require('readline');

let json = {
    "references": []
};

async function processLineByLine() {
  const fileStream = fs.createReadStream('reference.txt');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  for await (const line_ of rl) {
    let split = line_.split('<');
    const href = "https://minecraft.wiki" + line_.split('href="')[2].split('"')[0];
    let src = "https://minecraft.wiki" + split[3].split('src="')[1].split('"')[0].split("?")[0].split("/30px")[0];
    src = src.replace("/thumb", "");
    const title = line_.split('title="')[1].split('"')[0].toLowerCase().trim();
    
    json.references.push({"block" : title, "image" : src, "href" : href});

    // <li><a href="/w/File:Zombie_Head_(8).png" class="image"><img alt="Zombie Head (8).png" src="/images/thumb/Zombie_Head_%288%29.png/30px-Zombie_Head_%288%29.png?af5c1" decoding="async" loading="lazy" width="30" height="30" srcset="/images/thumb/Zombie_Head_%288%29.png/60px-Zombie_Head_%288%29.png?af5c1 2x" data-file-width="300" data-file-height="300"></a> <a href="/w/Zombie_Head" title="Zombie Head">Zombie Head</a></li>
  }
  fs.writeFile(`../references.json`, JSON.stringify(json), function(err) {
    if (err) { console.log(err); }
    else { console.log("File saved."); }
  });
}

processLineByLine();