import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";
import PlayState from "./PlayComponent";
function Player() {
  const { roomName, ip } = useParams();

  const [socket, setSocket] = useState(null);
  const [userName, setUserName] = useState("");

  const [joined, setJoined] = useState(false);

  const [gameState, setGameState] = useState(null);
  const [countdownTime, setCountdownTime] = useState(null);
  const [promptData, setPromptData] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [totalLevels, setTotalLevels] = useState(0);
  const [answer, setAnswer] = useState("");
  const [votingOptions, setVotingOptions] = useState([]);

  const castVote = (opt) => () => {
    socket.emit("cast_vote", {
      room: roomName,
      userName: userName,
      vote: opt.userName,
    });
  };

  useEffect(() => {
    //passing getData method to the lifecycle method
    setSocket(io.connect(`${ip}:3002`));
  }, [ip]);

  useEffect(() => {
    if (socket) {
      socket.on("new_prompt", (data) => {
        setGameState("play");
        setPromptData({
          prompt: data.prompt,
          role: data.role,
          place: data.place,
        });
        setCurrentLevel(data.level);
        setTotalLevels(data.total_levels);
        setCountdownTime(data.timeLimit);
      });

      socket.on("all_answers", (data) => {
        setVotingOptions(data.answers);
      });
    }
  }, [socket]);

  const joinRoom = () => {
    socket.emit("join_room", { room: roomName, userName: userName });
    setJoined(true);
    setGameState("wait");
  };

  const timeOver = () => {
    console.log("AA");

    socket.emit("player_text", {
      room: roomName,
      userName: userName,
      answer: answer,
    });
    setGameState("vote");
    setAnswer("");
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
    if (gameState === "wait") {
      return <p>Waiting for the player to start the game...</p>;
    } else if (gameState === "play") {
      return (
        <div>
          <PlayState
            currentLevel={currentLevel}
            totalLevels={totalLevels}
            promptData={promptData}
            countdownTime={countdownTime}
            completeClockFn={timeOver}
          />
          <textarea
            onChange={(event) => {
              setAnswer(event.target.value);
            }}
          />
        </div>
      );
    } else if (gameState === "vote") {
      return (
        <div>
          {votingOptions.map((opt, i) => {
            return (
              <div>
                <button
                  onClick={castVote(opt)}
                  key={i}
                  disabled={opt.userName === userName}
                >
                  {opt.answer}
                </button>
              </div>
            );
          })}
        </div>
      );
    }
  }
}

export default Player;
