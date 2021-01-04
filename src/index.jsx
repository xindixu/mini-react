import React, { Component } from "./x-react";
import ReactDOM from "./x-react-dom";

import "./index.css";
import App from "./App";

const Frc = ({ name }) => (
  <div className="border-red">
    functional component
    <p>{name}</p>
  </div>
);

// eslint-disable-next-line react/prefer-stateless-function
class Crc extends Component {
  render() {
    return (
      <div className="border-red">
        class component
        <p>{this.props.name}</p>
      </div>
    );
  }
}

ReactDOM.render(
  <div className="border-red">
    <h1>React</h1>
    <p>is pretty cool</p>
    <Frc name="react function component" />
    <Crc name="react class component" />
  </div>,
  document.getElementById("root")
);
