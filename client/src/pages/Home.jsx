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
];

const roles = ["A queen", "A panda"];
const places = ["On a wedding ceremony", "On a Tinder date"];

const timerSeconds = 6;
const voteTimerSeconds = 7;

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
        console.log(data);
      });

      socket.on("user_join", (data) => {
        console.log("JOINED");
        
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
        console.log("VOTING");

        // If user got the correct solution
        if (data.vote === "PhilosopherLLM") {
          setSessionUsers((prevUsers) =>
            prevUsers.map((user) =>
              user.userName === data.userName
                ? { ...user, score: user.score + 1 }
                : user
            )
          );
        }
      });
    }
  }, [socket]);

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
  };

  const getLLMAnswer = (prompt, role, place) => {

    const full_prompt = "Answer the question: " + prompt + "\n" + "You have to answer as " + role + " and as if you are " + place + ".\nIt is very important to keep the answer below 70 characters and with only one sentence. Make the text be inconspicous and like a human wrote it in less than 30 seconds. Remove any quotation marks from the answer. Remove any emoji from the answer. Skip any introduction."
    var data = {
        "model": "llama3",
        "messages": [
            {"role": "user", "content": full_prompt}
        ],
        "options": {
            "num_ctx": 2048
        }
    }
    data = JSON.stringify(data)

    const url="http://localhost:11434/api/chat"

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            // Typical action to be performed when the document is ready:
            // document.getElementById("demo").innerHTML = xhttp.responseText;
            var response = ""
            var responselist = xhttp.responseText.split('\n')
            responselist.splice(responselist.length-1, 1)
            for (let i = 0; i < responselist.length; i++){
                response = response + JSON.parse(responselist[i])["message"]["content"]
            }
            setAnswers([{ userName: "PhilosopherLLM", answer: response}])
        }
    };
    xhttp.open("Post", url, true);
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
    
      getLLMAnswer(basic_prompt, randRole, randPlace)
      
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
        <div>
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
            <h1>{roomName}</h1>
            <QRCode value={`http://${ip}:3000/player/${roomName}/${ip}`} />
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
              reveal who it is. Only the one who shows the most wisdom may
              pass.”
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
              completeClockFn={() => setGameState("vote")}
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
            </div>
          );
        } else if (gameState === "gameover") {
        }
      }
    }
  }
}

export default Home;
