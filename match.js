const fs = require('fs');
const details = JSON.parse(fs.readFileSync('./src/assets/details/songs.json', 'utf8'));
const files = fs.readdirSync('./src/assets/audio');

let matched = 0;
files.forEach(file => {
    let match = details.find(d => {
        let name = d.song.song_name.split(' (')[0].split(' [')[0].toLowerCase();
        let fName = file.toLowerCase();
        return fName.includes(name);
    });
    if (!match) {
        // try checking if file includes a word from song name?
        console.log("No match for:", file);
    } else {
        matched++;
    }
});
console.log(`Matched ${matched} out of ${files.length}`);
