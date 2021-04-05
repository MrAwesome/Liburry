import React, {Component} from "react";
import ReactDOM from "react-dom";
import fuzzysort from "fuzzysort";
//import diacritics from "diacritics";

const poj = [];

const rem_url = "maryknoll_smaller.json";

// TODO: go ahead and generate latinized version of poj in maryknoll_smaller, for searching

const Taigi = ({taigi}) => {
  const {poj_unicode, english} = taigi;

  return (
    <div style={{margin: "1rem", padding: "1rem", border: "1px solid"}}>
      <div>
        <b>{poj_unicode}</b>
      </div>
      <div>
        <i>{english}</i>
      </div>
    </div>
  );
};

const pre_load_placeholder = {poj_unicode: "Please wait, loading...", english: ""};
const post_load_placeholder = {poj_unicode: "Type to search!", english: ""};

//const MyLoader = <Loader
//  type="Bars"
//  color="#00BFFF"
//  height={100}
//  width={100}
//  timeout={300} //3 secs
///>;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      query: "",
    };
    this.local_poj = poj;
    this.fuzzysort = fuzzysort;
    this.timeout = 0;
    this.searching = false;
    // TODO: Don't use taigi elem
    this.placeholder = <Taigi key={0} taigi={pre_load_placeholder} />;
    this.output = this.placeholder;

    fetch(rem_url)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        this.placeholder = <Taigi key={0} taigi={post_load_placeholder} />;
        this.output = this.placeholder;

        data.forEach(
          t => {
            t.poj_prepped = fuzzysort.prepare(t.poj_unicode);
            t.eng_prepped = fuzzysort.prepare(t.english);
          }
        )

        this.local_poj = data;
        this.setState(this.state);
      });

    this.onChange = this.onChange.bind(this);
  }

  onChange(e) {
    const {target = {}} = e;
    const {value = ""} = target;

    this.query = value;
    this.update_query();

//    if (this.timeout) {
//      clearTimeout(this.timeout);
//    }
//
//    this.timeout = setTimeout(() => {
//      this.update_query();
//    }, 10);
  }

  update_query() {
    this.searching = true;
    this.setState(this.state);

    const search_results = fuzzysort.go(
      this.query,
      this.local_poj,
      {
        keys: ["poj_prepped", "eng_prepped"],
        allowTypo: false,
        limit: 20,
        threshold: -10000,
      },
    );
    this.searching = false;

    this.output = search_results
      .slice(0, 20)
      .map((x, i) => <Taigi key={i} taigi={x.obj} />);

    this.setState(this.state);
  }

  render() {
    const {onChange} = this;

    return (
      <div className="App">
        <div>
          <input placeholder="query" onChange={onChange} />
        </div>
        {this.searching ? null : 
            this.query ? this.output : this.placeholder}
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
