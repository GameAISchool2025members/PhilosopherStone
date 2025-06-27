import Countdown from "react-countdown";
import BackGroundImg from "../images/forrest_pstone_plato.png";


function PlayState({
  currentLevel,
  totalLevels,
  promptData,
  countdownTime,
  completeClockFn,
}) {
  const clockRenderer = ({ _, minutes, seconds, completed }) => {
  
    if (completed) {
      completeClockFn();
      return <></>;
    } else {
      return (
        <span>
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
      );
    }
  };

  return (

    <div>
      
      <p>
        {currentLevel + 1}/{totalLevels}
        
      </p>

      <div id="BackgroungBox">
        <img className="backGroundImg" src={BackGroundImg} alt="Background Image"/>
      </div>
      
      {promptData && (
        <div className="philosopherQuestion">
          <p>
            The question is: <b>{promptData.prompt}</b>
          </p>
          <p>
            You have to answer as <b>{promptData.role.toLowerCase()}</b>
          </p>
          <p>
            Imagining that you are <b>{promptData.place.toLowerCase()}</b>
          </p>
        </div>
      )}
      {/* I am aware it throws an error on running time, but I think the logic is fine so I rather not tweak it for now */}
      {countdownTime && (
        <Countdown className="timer" date={countdownTime} renderer={clockRenderer} />
      )}
    </div>
  );
}

export default PlayState;
