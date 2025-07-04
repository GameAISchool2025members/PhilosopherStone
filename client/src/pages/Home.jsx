import io from "socket.io-client";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import Countdown from "react-countdown";
import PlayState from "./PlayComponent";
import VoteState from "./VoteComponent";

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
  {
    philosopher: "Plato",
    prompts: ["What is truly real—what you see, or what you imagine?"],
  },
  {
    philosopher: "Aristotle",
    prompts: ["What is the purpose of a human being?"],
  }
];

const roles = ["A queen", "A panda", "A penniless guy", "A college student", "The European central bank", "An AI agent", "A widow", "An uemployed programmer", "A drug dealer", "Jack The Ripper", "A priest", "A game developper", "A dentist", "A rapper", "A weather anchor", "A drunk taxi driver", "Snow White", "A Swedish forest", "A watermelon", "A life coach", "Your ex", "A weird neighbor", "A magic mirror"];
const places = ["On a wedding ceremony", "On a Tinder date", "On a tree", "In the sea", "On a presidential election campaign", "In your grandmother's memory", "During a job interview", "In a dentist’s chair", "In a museum", "On the day of the end of the world", "On a medical operation table", "In a karaoke bar", "At a tax office", "In the waiting line of a supermarket", "In a doctor's office", "On Mars", "In a courtroom", "At a funeral", "In a cinema", "In the elevator with your (present/previous) boss", "At a therapist’s office", "On a pirate ship", "At a funeral"];

const timerSeconds = 30;
const voteTimerSeconds = 10;

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
  const [votingCountdownTime, setVotingCountdownTime] = useState(null);
  const [promptData, setPromptData] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [updateLevel, setUpdateLevel] = useState(false);
  const [LLManswers, setLLMAnswers] = useState("");

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
      });

      socket.on("user_join", (data) => {
        setSessionUsers([
          ...sessionUsers,
          { userName: data.userName, score: 0 },
        ]);
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
  }, [sessionUsers, socket]);

  useEffect(() => {
    if (socket) {
      socket.on("new_vote", (data) => {
        // If user got the correct solution
        if (data.vote === "PhilosopherLLM") {
          setSessionUsers((prevUsers) =>
            prevUsers.map((user) =>
              user.userName === data.userName
                ? { ...user, score: user.score + 1 }
                : user
            )
          );
        } else {
          setSessionUsers((prevUsers) =>
            prevUsers.map((user) =>
              user.userName === data.vote
                ? { ...user, score: user.score + 1 }
                : user
            )
          );
        }
      });
    }
  }, [socket]);

  useEffect(() => {
    if (updateLevel && currentLevel) {
      setUpdateLevel(false);
      setCountdownTime(null);
      setVotingCountdownTime(null);

      if (currentLevel >= levels.length) {
        setGameState("gameover");
      } else {
        setGameState("play");
      }
    }
  }, [currentLevel, updateLevel]);

  const createRoom = () => {
    const randColor = colors[Math.floor(Math.random() * colors.length)];
    const randanimal = animals[Math.floor(Math.random() * animals.length)];

    setRoomName(`${randColor}-${randanimal}`);

    socket.emit("join_room", {
      room: `${randColor}-${randanimal}`,
      userName: "PhilosopherLLM",
    });

    setSessionUsers([{ userName: "PhilosopherLLM", score: 0 }]);
  };

  const startGame = () => {
    socket.emit("start_game", { room: roomName });
    setGameStarted(true);
    setGameState("play");
    setCountdownTime(null);
    setVotingCountdownTime(null);
  };

  const getLLMAnswer = (prompt, role, place) => {
    const full_prompt =
      "Answer the question: " +
      prompt +
      "\n" +
      "You have to answer as " +
      role +
      " and as if you are " +
      place +
      ".\nIt is very important to keep the answer below 70 characters and with only one sentence. Make the text be inconspicous and like a human wrote it in less than 30 seconds. Remove any quotation marks from the answer. Remove any emoji from the answer. Skip any introduction.";
    var data = {
      model: "llama3",
      messages: [{ role: "user", content: full_prompt }],
      options: {
        num_ctx: 2048,
      },
    };
    data = JSON.stringify(data);

    const url = "http://localhost:3001/api/chat";

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      console.log(this.status);
      console.log(this);

      if (this.readyState === 4 && this.status === 200) {
        // Typical action to be performed when the document is ready:
        // document.getElementById("demo").innerHTML = xhttp.responseText;
        var response = "";
        var responselist = xhttp.responseText.split("\n");
        responselist.splice(responselist.length - 1, 1);
        for (let i = 0; i < responselist.length; i++) {
          response =
            response + JSON.parse(responselist[i])["message"]["content"];
        }
        setAnswers([{ userName: "PhilosopherLLM", answer: response }]);
      }
    };
    xhttp.open("Post", url, true);
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(data);
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

      getLLMAnswer(basic_prompt, randRole, randPlace);
    } else if (gameState === "vote") {
      const voteTimeLimit = Date.now() + voteTimerSeconds * 1000;
      setVotingCountdownTime(voteTimeLimit);
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
      /* This is the default page. Only a button exist here to create a room. Starting page */
      return (
        <div className="btn">
          <button onClick={createRoom}>
            <h1>Create a Room</h1>
          </button>
        </div>
      );
    } else {
      if (!gameStarted) {
        /* After the button is clicked, it shows the room name, the QR code and the link in case the QR does not work (feel free to change anything here). Afterwards, I added the intro text (it is a bit ugly and probably I did not set it in the correct place). As users join the room, they appear in a list format (the map function). Lastly, there is a button to start the game */
        return (
          <div>
            <h1 className="roomName">{roomName}</h1>
            <QRCode
              className="qr"
              size={128}
              value={`http://${ip}:3000/player/${roomName}/${ip}`}
            />
            <p>{`${ip}:3000/player/${roomName}/${ip}`} </p>
            {sessionUsers.map((user, i) => {
              return (
                <p key={`${user.userName}-${i}`}>
                  User {i}: {user.userName} -- score: {user.score}
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
              reveal who it is. Only the one who shows the most
              wisdom may pass.”
            </p>
            <p> Let the philosophical challenge begin.</p>
            <button onClick={startGame}>Start Game</button>
          </div>
        );
      } else {
        if (gameState === "play") {
          /* This part is the main game loop, where the players are playing. It only shows the timer, and the prompts */

          return (
            <PlayState
              currentLevel={currentLevel}
              totalLevels={levels.length}
              promptData={promptData}
              countdownTime={countdownTime}
              completeClockFn={() => {
                setGameState("vote");
              }}
            />
          );
        } else if (gameState === "vote") {
          /* In here it is the voting system. W.I.P */
          return (
            <VoteState
              currentLevel={currentLevel}
              totalLevels={levels.length}
              answers={answers}
              countdownTime={votingCountdownTime}
              completeClockFn={() => {
                setGameState("scores");
                socket.emit("end_voting", { room: roomName });
              }}
            />
          );
        } else if (gameState === "scores") {
          return (
            <div>
              {sessionUsers
                .sort((a, b) => b.score - a.score)
                .map((user, i) => {
                  return (
                    <p key={`${user.userName}-${i}`}>
                      User {i}: {user.userName} -- score: {user.score}
                    </p>
                  );
                })}
              <button
                onClick={() => {
                  setCurrentLevel(currentLevel + 1);
                  setUpdateLevel(true);
                }}
              >
                Next round
              </button>
            </div>
          );
        } else if (gameState === "gameover") {
          return (
            <div>
              <h1>Final Scores</h1>
              {sessionUsers
                .sort((a, b) => b.score - a.score)
                .map((user, i) => {
                  return (
                    <p key={`${user.userName}-${i}`}>
                      User {i}: {user.userName} -- score: {user.score}
                    </p>
                  );
                })}
            </div>
          );
        }
      }
    }
  }
}

export default Home;
