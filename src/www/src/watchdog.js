import React from "react";
import qs from "query-string";
import axios from "axios";
import shortid from "shortid";
import moment from "moment";
import { Redirect } from "react-router-dom";
const apiUrl = "http://192.168.1.78:3000/api/";

export default class WatchDog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: [],
      shouldRefresh: false
    };

    this.ItemList = this.ItemList.bind(this);
  }

  ItemList() {
    return this.state.items.map(item => {
      return (
        <tr key={shortid.generate()}>
          <td>
            <a
              href={`/img?camera=${item.camera}&date=${item.date}`}
              target="_blank"
            >
              {item.camera}
            </a>
          </td>
          <td>
            {JSON.parse(item.predictions)
              .map(p => `${p.class} ${Math.round(p.score * 100)}%`)
              .join()}
          </td>
          <td>{moment(item.date).calendar()}</td>
        </tr>
      );
    });
  }

  CameraList() {
    const cameras = [
      "porch1",
      "street1",
      "street2",
      "street3",
      "burgos",
      "kitchen",
      "garage1",
      "garage2",
      "gate1"
    ];
    return cameras.map(camera => {
      return (
        <a
          key={shortid.generate()}
          className="dropdown-item"
          onClick={() => this.setState({ camera })}
          href="#"
        >
          {camera}
        </a>
      );
    });
  }
  async componentDidMount() {
    try {
      const response = await axios.get(`${apiUrl}log${window.location.search}`);

      if (response.data.length > 0) this.setState({ items: response.data });
      else this.setState({ items: [] });
    } catch (err) {}
  }

  render() {
    return (
      <div>
        {this.state.shouldRefresh ? <Redirect to="/img" /> : <div />}
        <div className="dropdown">
          <button
            className="btn btn-secondary dropdown-toggle"
            type="button"
            id="dropdownMenuButton"
            data-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
          >
            Choose camera
          </button>
          <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
            {this.CameraList()}
          </div>
        </div>
        <div className="dropdown">
          <button
            className="btn btn-secondary dropdown-toggle"
            type="button"
            id="dropdownMenuButton"
            data-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
          >
            Time
          </button>
          <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
            <a
              className="dropdown-item"
              onClick={() => this.setState({ range: "1" })}
              href="#"
            >
              from last 3 mins
            </a>
            <a
              className="dropdown-item"
              onClick={() => this.setState({ range: "1" })}
              href="#"
            >
              from last hour
            </a>
            <a
              className="dropdown-item"
              onClick={() => this.setState({ range: "1" })}
              href="#"
            >
              from last 3 hours
            </a>
            <a
              className="dropdown-item"
              onClick={() => this.setState({ range: "1" })}
              href="#"
            >
              from last 6 hours
            </a>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            this.setState({ shouldRefresh: true });
          }}
        >
          Go
        </button>
        <table id="predictions" className="table table-striped">
          <thead>
            <tr>
              <th>Camera</th>
              <th>Detected</th>
              <th>Identified On</th>
            </tr>
          </thead>
          <tbody>{this.ItemList()}</tbody>
        </table>
      </div>
    );
  }
}
