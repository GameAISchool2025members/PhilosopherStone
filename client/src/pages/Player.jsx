import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";

function Player() {
  const { roomName, ip } = useParams();

  const [socket, setSocket] = useState(null);
  const [userName, setUserName] = useState("");

  const [joined, setJoined] = useState(false);
  const [waiting, setWaiting] = useState(false);

  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    console.log(ip);

    //passing getData method to the lifecycle method
    setSocket(io.connect(`${ip}:3002`));
  }, [ip]);

  const joinRoom = () => {
    socket.emit("join_room", { room: roomName, userName: userName });
    setJoined(true);
    setWaiting(true);
  };

  if (!joined) {
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
  } else {
    if (waiting) {
      return <p>Waiting for the player to start the game...</p>;
    }
  }
}

export default Player;
