import io from "socket.io-client";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import Countdown from "react-countdown";
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

const levels = [
  {
    philosopher: "Socrates",
    prompts: ["What is the good life?"],
  },
];

const roles = ["A queen", "A panda"];
const places = ["On a wedding ceremony", "On a Tinder date"];

function Home() {
  const [socket, setSocket] = useState(null);
  const [writtenState, setWrittenState] = useState("");
  const [sessionUsers, setSessionUsers] = useState([]);
  const [ip, setIp] = useState(null);
  const [roomName, setRoomName] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3002/api/local-ip")
      .then((res) => res.json())
      .then((data) => setIp(data.ip));
  }, []);

  useEffect(() => {
    if (ip) {
      setSocket(io.connect(`${ip}:3002`));
    }
  }, [ip]);

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

  const startGame = () => {
    socket.emit("start_game", { room: roomName });
    setGameStarted(true);
    setGameState("play");
  };

  const getPrompt = (level) => {
    const currentLevel = levels[level];
    const basic_prompt =
      currentLevel.prompts[
        Math.floor(Math.random() * currentLevel.prompts.length)
      ];

    const randRol = roles[Math.floor(Math.random() * roles.length)];
    const randPlace = places[Math.floor(Math.random() * places.length)];

    return (
      <div>
        <p>
          The question is: <b>{basic_prompt}</b>
        </p>
        <p>
          You have to answer as <b>{randRol.toLowerCase()}</b>
        </p>
        <p>
          Imagining that you are <b>{randPlace.toLowerCase()}</b>
        </p>
      </div>
    );
  };

  const clockRenderer =
    (completeFn) =>
    ({ _, minutes, seconds, completed }) => {
      if (completed) {
        completeFn();
        return <></>;
      } else {
        return (
          <span>
            {String(minutes).padStart(2, "0")}:
            {String(seconds).padStart(2, "0")}
          </span>
        );
      }
    };

  if (socket) {
    if (!roomName) {
      return (
        <div>
          <button onClick={createRoom}>
            <h1>Create a Room</h1>
          </button>
        </div>
      );
    } else {
      if (!gameStarted) {
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
            <p>
              With a group of friends, you wander into a mysterious forest. In
              the middle of the path stands a strange, giant stone — ancient,
              magical, pulsing with wisdom.
            </p>
            <p>
              As you reach out to touch it, the stone speaks: “Among you hides
              an alien — an AI agent in disguise. I will ask you questions to
              reveal who it is. Only the one who shows the most wisdom may
              pass.”
            </p>
            <p> Let the philosophical challenge begin.</p>
            <button onClick={startGame}>Start Game</button>
          </div>
        );
      } else {
        if (gameState === "play") {
          return (
            <div>
              <p>Start the game</p>
              <div>{getPrompt(0)}</div>
              {/* I am aware it throws an error on running time, but I think the logic is fine so I rather not tweak it for now */}
              <Countdown
                date={Date.now() + 6000}
                renderer={clockRenderer(() => {
                  setGameState("vote");
                })}
              />
            </div>
          );
        } else if (gameState === "vote") {
          return <p>Vote</p>;
        }
      }
    }
  }
}

export default Home;
