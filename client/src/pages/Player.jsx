import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";

function Player() {
  const { roomName, ip } = useParams();

  const [socket, setSocket] = useState(null);
  const [writtenState, setWrittenState] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    console.log(ip);

    //passing getData method to the lifecycle method
    setSocket(io.connect(`${ip}:3002`));
  }, [ip]);

  const joinRoom = () => {
    console.log(`Joining ${roomName}`);

    socket.emit("join_room", { room: roomName, userName: userName });
  };

  return (
    <div>
      <h1>Player Page</h1>
      <p>Room name: {roomName}</p>
      <input
        onChange={(event) => {
          setUserName(event.target.value);
        }}
      />
      <button onClick={joinRoom}>Join</button>
    </div>
  );
}

export default Player;
