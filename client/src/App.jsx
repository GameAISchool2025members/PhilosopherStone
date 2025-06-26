import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Player from "./pages/Player";
import { useEffect, useState } from "react";

function App() {
  const [ip, setIp] = useState(null);
  useEffect(() => {
    fetch("http://localhost:3001/api/local-ip")
      .then((res) => res.json())
      .then((data) => setIp(data.ip));
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home ip={ip} />} />
        <Route path="/player/:roomName/:ip" element={<Player />} />
      </Routes>
    </Router>
  );
}

export default App;
