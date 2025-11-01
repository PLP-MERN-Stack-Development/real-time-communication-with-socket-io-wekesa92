import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = 5000;

// 🟢 Store active users
const users = {}; // { socketId: { username, room } }

io.on("connection", (socket) => {
  console.log("✅ New user connected:", socket.id);

  socket.on("join_room", (data) => {
    const { username, room } = data;
    socket.join(room);
    users[socket.id] = { username, room };
    console.log(`👥 ${username} joined room: ${room}`);

    // Send updated user list to everyone in the room
    const roomUsers = Object.values(users)
      .filter((user) => user.room === room)
      .map((u) => u.username);
    io.to(room).emit("update_user_list", roomUsers);
  });

  socket.on("send_message", (data) => {
    io.to(data.room).emit("receive_message", data);
  });

  socket.on("typing", (data) => {
    socket.to(data.room).emit("user_typing", data);
  });

  socket.on("stop_typing", (data) => {
    socket.to(data.room).emit("user_stop_typing", data);
  });

  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {
      const { room } = user;
      delete users[socket.id];

      const roomUsers = Object.values(users)
        .filter((u) => u.room === room)
        .map((u) => u.username);

      io.to(room).emit("update_user_list", roomUsers);
      console.log(`❌ ${user.username} left room: ${room}`);
    }
  });
});

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
