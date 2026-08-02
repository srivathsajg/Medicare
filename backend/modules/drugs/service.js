const fs = require('fs');
const path = require('path');
const readline = require('readline');

const DATASET_PATH = path.join(__dirname, '../../../Dataset/Drug Labels Dataset.csv');

const searchDrugs = (query) => {
    return new Promise((resolve, reject) => {
        const results = [];
        const stream = fs.createReadStream(DATASET_PATH);
        const rl = readline.createInterface({
            input: stream,
            crlfDelay: Infinity
        });

        let isHeader = true;

        rl.on('line', (line) => {
            if (isHeader) {
                isHeader = false;
                return;
            }

            // Simple check before parsing to speed up
            if (!line.toLowerCase().includes(query.toLowerCase())) {
                return;
            }

            const row = parseCSVLine(line);
            // name is index 0
            if (row[0] && row[0].toLowerCase().includes(query.toLowerCase())) {
                results.push({
                    name: row[0],
                    price: row[1],
                    manufacturer: row[3],
                    composition: row[13]
                });
            }

            if (results.length >= 20) {
                rl.close();
                rl.removeAllListeners('line');
                stream.destroy();
                resolve(results);
            }
        });

        rl.on('close', () => {
            resolve(results);
        });

        rl.on('error', (err) => {
            reject(err);
        });
    });
};

function parseCSVLine(text) {
    const result = [];
    let start = 0;
    let insideQuote = false;

    for (let i = 0; i < text.length; i++) {
        if (text[i] === '"') {
            // Check for escaped quote
            if (insideQuote && text[i + 1] === '"') {
                i++;
            } else {
                insideQuote = !insideQuote;
            }
        } else if (text[i] === ',' && !insideQuote) {
            let field = text.substring(start, i);
            if (field.startsWith('"') && field.endsWith('"')) {
                field = field.slice(1, -1).replace(/""/g, '"');
            }
            result.push(field);
            start = i + 1;
        }
    }
    
    // Push last field
    let field = text.substring(start);
    if (field.startsWith('"') && field.endsWith('"')) {
        field = field.slice(1, -1).replace(/""/g, '"');
    }
    result.push(field);

    return result;
}

module.exports = {
    searchDrugs
};
