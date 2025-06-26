import io from "socket.io-client";
import { useEffect, useState } from "react";
import axios from "axios";
import QRCode from "react-qr-code";

const colors = [
  "red",
  "blue",
  "green",
  "yellow",
  "orange",
  "purple",
  "violet",
  "pink",
  "magenta",
  "cyan",
  "olive",
  "ivory",
];

const animals = [
  "monkey",
  "lion",
  "dog",
  "cat",
  "butterfly",
  "dolphin",
  "tiger",
  "cow",
  "reindeer",
  "crocodile",
  "horse",
];

function Home() {
  const [socket, setSocket] = useState(null);
  const [writtenState, setWrittenState] = useState("");
  const [sessionUsers, setSessionUsers] = useState([]);
  const [ip, setIp] = useState(null);

  useEffect(() => {
    console.log("HETE");
    fetch("http://localhost:3002/api/local-ip")
      .then((res) => res.json())
      .then((data) => setIp(data.ip));
  }, []);

  useEffect(() => {
    //passing getData method to the lifecycle method
    console.log("HERE");

    if (ip) {
      setSocket(io.connect(`${ip}:3002`));
    }
  }, [ip]);

  const [roomName, setRoomName] = useState(null);

  const sendMessage = () => {
    socket.emit("send_message", { message: writtenState });
  };

  useEffect(() => {
    console.log(socket);

    if (socket) {
      socket.on("recieve_message", (data) => {
        setWrittenState(data.message);
        console.log(data);
      });

      socket.on("user_join", (data) => {
        setSessionUsers([...sessionUsers, data.userName]);
      });
    }
  }, [sessionUsers, socket]);

  const createRoom = () => {
    const randColor = colors[Math.floor(Math.random() * colors.length)];
    const randanimal = animals[Math.floor(Math.random() * animals.length)];

    setRoomName(`${randColor}-${randanimal}`);

    socket.emit("join_room", {
      room: `${randColor}-${randanimal}`,
      userName: "PhilosopherLLM",
    });

    setSessionUsers(["PhilosopherLLM"]);
  };

  if (socket) {
    if (!roomName) {
      return (
        <div>
          <input
            placeholder="Message"
            onChange={(event) => {
              setWrittenState(event.target.value);
            }}
          />
          <button onClick={sendMessage}>Send message</button>
          <p>Message: {writtenState}</p>
          <div>AAA</div>

          <button onClick={createRoom}>
            <h1>Create a Room</h1>
          </button>
        </div>
      );
    } else {
      return (
        <div>
          <h1>{roomName}</h1>
          <QRCode value={`http://${ip}:3000/player/${roomName}/${ip}`} />
          <p>{`${ip}:3000/player/${roomName}/${ip}`} </p>
          {sessionUsers.map((user, i) => {
            return (
              <p key={`${user}-${i}`}>
                User {i}: {user}
              </p>
            );
          })}
        </div>
      );
    }
  }
}

export default Home;
