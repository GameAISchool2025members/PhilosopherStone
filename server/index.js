const express = require("express");

const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const os = require("os");

app.use(cors());
const server = http.createServer(app);

app.get("/api/local-ip", (req, res) => {
  const interfaces = os.networkInterfaces();
  console.log(interfaces);
  let localIP = "";

  for (const iface of Object.values(interfaces)) {
    for (const config of iface) {
      if (config.family === "IPv4" && !config.internal) {
        localIP = config.address;
        break;
      }
    }
    if (localIP) break;
  }

  res.json({ ip: localIP });
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`New User: ${socket.id}`);

  socket.on("send_message", (data) => {
    console.log(data);
    socket.broadcast.emit("recieve_message", data);
  });

  socket.on("join_room", (data) => {
    console.log(`User ${data.userName} joined room ${data.room}`);
    socket.join(data.room);
    socket.to(data.room).emit("user_join", data);
  });
});

server.listen(3002, "0.0.0.0", () => {
  console.log("Server is running");
});
