const { Server } = require("socket.io");

let io;

module.exports = {
    init: (httpServer) => {
        io = new Server(httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:5173",
                methods: ["GET", "POST", "PATCH", "PUT"],
                credentials: true
            }
        });
        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error("Socket.IO not initialized! Call init(server) first.");
        }
        return io;
    }
};
