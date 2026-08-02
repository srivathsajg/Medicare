const { searchDrugs } = require('./service');

const search = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.length < 2) {
            return res.json({ success: true, data: [] });
        }

        const drugs = await searchDrugs(query);
        res.json({ success: true, data: drugs });
    } catch (error) {
        console.error("Error searching drugs:", error);
        res.status(500).json({ success: false, message: "Error searching drugs" });
    }
};

module.exports = {
    search
};
