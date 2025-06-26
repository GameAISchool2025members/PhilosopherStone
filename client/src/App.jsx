import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Player from "./pages/Player";
import { useEffect, useState } from "react";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/player/:roomName/:ip" element={<Player />} />
      </Routes>
    </Router>
  );
}

export default App;
