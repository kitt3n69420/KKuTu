var fs = require('fs');
var path = require('path');

var globalPath = path.join(__dirname, 'lib', 'sub', 'global.json');

try {
    var globalData = fs.readFileSync(globalPath, 'utf8');
    var globalConfig = JSON.parse(globalData);

    if (!globalConfig.NICKNAME_LIMIT) {
        console.log('NICKNAME_LIMIT missing. Adding...');
        globalConfig.NICKNAME_LIMIT = {
            "TERM": 0,
            "REGEX": [
                "[\\{\\}\\[\\]\\/?.,;:|\\)*~`!^\\-+<>@#$%&\\\\=\\(\\'\"]",
                "gi"
            ]
        };
        fs.writeFileSync(globalPath, JSON.stringify(globalConfig, null, 4), 'utf8');
        console.log('global.json updated successfully.');
    } else {
        console.log('NICKNAME_LIMIT already exists.');
    }
} catch (e) {
    console.error('Error updating global.json:', e);
}
