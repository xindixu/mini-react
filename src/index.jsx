import { Component, useState } from "./x-react";
import ReactDOM from "./x-react-dom";

import "./index.css";

const Frc = ({ name }) => {
  const [count, setCount] = useState(0);
  return (
    <div className="border-red">
      <h2>functional component</h2>
      <p>{name}</p>
      <button type="button" onClick={() => setCount(count + 1)}>
        Add
      </button>
      <p>{count}</p>
      {count % 2 === 0 ? (
        <p>
          <strong>Even: </strong>
          <span>a number that can be divided by 2</span>
        </p>
      ) : (
        <h2>
          <strong>Odd: </strong>
          <span>a number that can't be divided by 2</span>
        </h2>
      )}
    </div>
  );
};
// eslint-disable-next-line react/prefer-stateless-function
class Crc extends Component {
  render() {
    return (
      <div className="border-red">
        <h2>class component</h2>
        <p>{this.props.name}</p>
      </div>
    );
  }
}

const fragment = (
  <>
    <li>hah</li>
    <li>hah</li>
  </>
);

ReactDOM.render(
  <div className="border-red">
    <h1>React</h1>
    <p>is pretty cool</p>
    <Frc name="react function component" />
    <Crc name="react class component" />
    <ul>{fragment}</ul>
  </div>,
  document.getElementById("root")
);
