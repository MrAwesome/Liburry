import React, {Component} from "react";
import ReactDOM from "react-dom";
import fuzzysort from "fuzzysort";

import "./cha_taigi.css";

// TODO(high): Copy to clipboard on click or tab-enter

const poj = [];

//const rem_url = "maryknoll_smaller.json";
const rem_url = "maryknoll_normalized_minified.json"


const Taigi = ({poj_unicode, english, poj_normalized}) => {

  // FIXME(https://github.com/farzher/fuzzysort/issues/66)
  const html_poj_unicode = {__html: poj_unicode};
  const html_poj_normalized = {__html: poj_normalized};
  const html_english = {__html: english};
  const poju = <span className="poj-unicode" dangerouslySetInnerHTML={html_poj_unicode}></span>;
  const pojn = <span className="poj-normalized" dangerouslySetInnerHTML={html_poj_normalized}></span>;
  const engl = <span className="english-definition" dangerouslySetInnerHTML={html_english}></span>;
  return (
    <div className="entry-container">
      <div className="poj">
        {poju} {pojn}
      </div>
      <div className="english">
        {engl}
      </div>
    </div>
  );
};

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
    this.placeholder = <div className="placeholder">Loading...</div>;
    this.output = null;

    fetch(rem_url)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        this.placeholder = <div className="placeholder">Type to search!</div>;
        data.forEach(
          t => {
            t.poj_prepped = fuzzysort.prepare(t.poj_unicode);
            t.poj_norm_prepped = fuzzysort.prepare(t.poj_normalized);
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
  }

  update_query() {
    this.searching = true;
    this.setState(this.state);

    const search_results = fuzzysort.go(
      this.query,
      this.local_poj,
      {
        keys: ["poj_norm_prepped", "eng_prepped", "poj_unicode"],
        allowTypo: false,
        limit: 20,
        //threshold: -10000,
      },
    );
    this.searching = false;

    this.output = search_results
      .slice(0, 20)
      .map((x, i) => {
        const poj_norm_pre_paren = fuzzysort.highlight(x[0],
          "<span class=\"poj-normalized-matched-text\" class=hlsearch>", "</span>")
          || x.obj.poj_normalized;
        const poj_norm_high = "(" + poj_norm_pre_paren + ")";
        const eng_high = fuzzysort.highlight(x[1],
          "<span class=\"english-definition-matched-text\" class=hlsearch>", "</span>")
          || x.obj.english;
        const poj_unicode = fuzzysort.highlight(x[2],
          "<span class=\"poj-unicode-matched-text\" class=hlsearch>", "</span>")
          || x.obj.poj_unicode;
        return <Taigi key={i} poj_unicode={poj_unicode} english={eng_high} poj_normalized={poj_norm_high} />;

      })

    this.setState(this.state);
  }

  render() {
    const {onChange} = this;

    return (
      <div className="App">
        <div className="search-bar">
          <input autoFocus={true} placeholder="Search..." onChange={onChange} />
          <svg aria-hidden="true" className="mag-glass" ><path d="M18 16.5l-5.14-5.18h-.35a7 7 0 10-1.19 1.19v.35L16.5 18l1.5-1.5zM12 7A5 5 0 112 7a5 5 0 0110 0z"></path></svg>
        </div>
        <div className="placeholder-container">
          {this.query ? null : this.placeholder}
        </div>
        <div className="results-container">
          {this.output}
        </div>
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
