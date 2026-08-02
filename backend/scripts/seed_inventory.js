const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const dotenv = require("dotenv");
const Inventory = require("../modules/inventory/models/inventory.model");

dotenv.config({ path: path.join(__dirname, "../.env") });

const datasetPath = path.join(__dirname, "../../Dataset/Drug Labels Dataset.csv");

const seedInventory = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected for Inventory Seeding...");

        const fileStream = fs.createReadStream(datasetPath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        const items = [];
        let count = 0;
        let isHeader = true;

        for await (const line of rl) {
            if (isHeader) {
                isHeader = false;
                continue;
            }

            // Simple CSV parsing (handling quotes)
            const parts = parseCSVLine(line);
            
            if (parts.length >= 2) {
                const name = parts[0]?.trim();
                const price = parseFloat(parts[1]) || 0;
                const manufacturer = parts[3]?.trim() || "Generic";
                const category = parts[4]?.trim() || "Medicine";

                if (name && name.length > 2) {
                    items.push({
                        name: name,
                        price: price > 0 ? price : 50 + Math.floor(Math.random() * 500), // Default price if 0
                        stock: Math.floor(Math.random() * 100) + 20,
                        minStockLevel: 15,
                        unit: "tablets",
                        category: category
                    });
                    count++;
                }
            }

            if (count >= 50) {
                rl.close();
                break;
            }
        }

        if (items.length > 0) {
            await Inventory.deleteMany({}); // Clear existing to replace with dataset
            await Inventory.insertMany(items);
            console.log(`Successfully seeded ${items.length} medicines from dataset into Inventory.`);
        }

        mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error("Error seeding inventory:", error);
        process.exit(1);
    }
};

function parseCSVLine(text) {
    const result = [];
    let start = 0;
    let insideQuote = false;

    for (let i = 0; i < text.length; i++) {
        if (text[i] === '"') {
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
    let field = text.substring(start);
    if (field.startsWith('"') && field.endsWith('"')) {
        field = field.slice(1, -1).replace(/""/g, '"');
    }
    result.push(field);
    return result;
}

seedInventory();
