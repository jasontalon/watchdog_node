import React from "react";
import logo from "./logo.svg";
import "./App.css";
import WatchDog from "./watchdog";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";

function App() {
  return (
    <div>
      <Routes />
    </div>
  );
}

function Routes() {
  return (
    <Router>
      <Route path="/watchdog" component={WatchDog} />
    </Router>
  );
}
export default App;
