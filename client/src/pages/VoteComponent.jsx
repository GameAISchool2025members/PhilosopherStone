import Countdown from "react-countdown";

function VoteState({ completeClockFn }) {
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
      <p>aa</p>
    </div>
  );
}

export default VoteState;
