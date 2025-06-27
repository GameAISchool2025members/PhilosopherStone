import Countdown from "react-countdown";

function VoteState({
  currentLevel,
  totalLevels,
  countdownTime,
  answers,
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
      <p>Vote</p>
      <div>
        {[...answers]
          .sort(() => Math.random() - 0.5)
          .map((randAnswer, i) => {
            return <p key={randAnswer.username}>{randAnswer.answer}</p>;
          })}
      </div>
      {countdownTime && (
        <Countdown date={countdownTime} renderer={clockRenderer} />
      )}
    </div>
  );
}

export default VoteState;
