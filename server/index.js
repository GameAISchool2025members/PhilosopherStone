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
    socket.broadcast.emit("recieve_message", data);
  });

  socket.on("join_room", (data) => {
    console.log(`User ${data.userName} joined room ${data.room}`);
    socket.join(data.room);
    socket.to(data.room).emit("user_join", data);
  });

  socket.on("send_prompt", (data) => {
    console.log(`Sending new prompt to users in room: ${data.room}`);
    socket.to(data.room).emit("new_prompt", data);
  });

  socket.on("player_text", (data) => {
    console.log(
      `User ${data.userName} submitted and answer in room ${data.room}`
    );

    socket.to(data.room).emit("player_answer", data);
  });

  socket.on("send_all_answers", (data) => {
    console.log(`Collected all answers in room ${data.room}`);

    socket.to(data.room).emit("all_answers", data);
  });

  socket.on("cast_vote", (data) => {
    console.log(
      `User ${data.userName} casted a vote in room ${data.room} for ${data.vote}`
    );

    socket.to(data.room).emit("new_vote", data);
  });

  socket.on("end_voting", (data) => {
    console.log(`TIme over for voting in ${data.room}`);

    socket.to(data.room).emit("voting_over", data);
  });
});

server.listen(3002, "0.0.0.0", () => {
  console.log("Server is running");
});
