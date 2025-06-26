import io from "socket.io-client";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import Countdown from "react-countdown";
import PlayState from "./PlayComponent";
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

const timerSeconds = 6;

function Home() {
  const [socket, setSocket] = useState(null);
  const [writtenState, setWrittenState] = useState("");
  const [sessionUsers, setSessionUsers] = useState([]);
  const [ip, setIp] = useState(null);
  const [roomName, setRoomName] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [countdownTime, setCountdownTime] = useState(null);
  const [promptData, setPromptData] = useState(null);
  const [answers, setAnswers] = useState([]);

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
    if (socket) {
      socket.on("recieve_message", (data) => {
        setWrittenState(data.message);
        console.log(data);
      });

      socket.on("user_join", (data) => {
        setSessionUsers([...sessionUsers, data.userName]);
      });

      socket.on("player_answer", (data) => {
        setAnswers((prevAnswers) => {
          const index = prevAnswers.findIndex(
            (item) => item.userName === data.userName
          );

          if (index !== -1) {
            // Update existing item
            const updatedItems = [...prevAnswers];
            updatedItems[index] = data;
            return updatedItems;
          } else {
            // Add new item
            return [...prevAnswers, data];
          }
        });
      });
    }
  }, [answers, sessionUsers, socket]);

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

  useEffect(() => {
    if (gameState === "play") {
      const basic_prompt =
        levels[currentLevel].prompts[
          Math.floor(Math.random() * levels[currentLevel].prompts.length)
        ];

      const randRole = roles[Math.floor(Math.random() * roles.length)];
      const randPlace = places[Math.floor(Math.random() * places.length)];

      const timeLimit = Date.now() + timerSeconds * 1000;

      setPromptData({
        prompt: basic_prompt,
        role: randRole,
        place: randPlace,
      });

      setCountdownTime(timeLimit);

      socket.emit("send_prompt", {
        room: roomName,
        prompt: basic_prompt,
        role: randRole,
        place: randPlace,
        timeLimit: timeLimit,
        level: currentLevel,
        total_levels: levels.length,
      });

      setAnswers([{ userName: "PhilosopherLLM", answer: "LLM Answer" }]);
    }
  }, [currentLevel, gameState, roomName, socket]);

  // When all answers collected, send to users
  useEffect(() => {
    if (answers.length === sessionUsers.length && answers.length > 0) {
      socket.emit("send_all_answers", {
        room: roomName,
        answers: [...answers].sort(() => Math.random() - 0.5), //Randomize order, just in case
      });
      // Reset, just in case
      // setAnswers([]);
    }
  }, [answers, roomName, sessionUsers, socket]);

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
            <PlayState
              currentLevel={currentLevel}
              totalLevels={levels.length}
              promptData={promptData}
              countdownTime={countdownTime}
              completeClockFn={() => setGameState("vote")}
            />
          );
        } else if (gameState === "vote") {
          return (
            <div>
              <p>
                {currentLevel + 1}/{levels.length}
              </p>
              <p>Vote</p>
              <div>
                {[...answers]
                  .sort(() => Math.random() - 0.5)
                  .map((randAnswer, i) => {
                    return <p key={randAnswer.username}>{randAnswer.answer}</p>;
                  })}
              </div>
            </div>
          );
        }
      }
    }
  }
}

export default Home;
