import React, {Component, PureComponent} from "react";

export class Taigi extends PureComponent {
  render() {
    const {poj_unicode, poj_normalized, english} = this.props;
    // FIXME(https://github.com/farzher/fuzzysort/issues/66)
    const html_poj_unicode = {__html: poj_unicode};
    const html_poj_normalized = {__html: poj_normalized};
    const html_english = {__html: english};
    const poju = <span className="poj-unicode" dangerouslySetInnerHTML={html_poj_unicode}></span>;
    const pojn = <span className="poj-normalized" dangerouslySetInnerHTML={html_poj_normalized}></span>;
    const engl = <span className="english-definition" dangerouslySetInnerHTML={html_english}></span>;
    return (
      <div className="entry-container">
        <div className="poj-normalized-container">
          {pojn}
        </div>
        <div className="poj-unicode-container">
          {poju}
        </div>
        <div className="english-container">
          {engl}
        </div>
      </div>
    );
  };
}


export class Placeholder extends PureComponent {
  render() {
    const {text} = this.props;
    return <div className="placeholder">{text}</div>;
  }
}
const loading_paceholder = <Placeholder text="Loading..." />;
const loaded_placeholder = <Placeholder text="Type to search!" />;
const searching_placeholder = <Placeholder text="Searching..." />;
const no_results_placeholder = <Placeholder text="No results found!" />;

export class PlaceholderArea extends PureComponent {
  render() {
    const {query, loaded, searching, num_results} = this.props;

    var placeholder = null;
    if (query) {
      if (searching) {
        placeholder = searching_placeholder;
      } else {
        if (!num_results) {
          placeholder = no_results_placeholder;
        } else {
          placeholder = null;
        }
      }
    } else {
      if (loaded) {
        placeholder = loaded_placeholder;
      } else {
        placeholder = loading_paceholder;
      }
    }

    return <div className="placeholder-container">
      {query ? null : placeholder}
    </div>
  }
}


export class ResultsArea extends Component {
  shouldComponentUpdate() {
    const {searching} = this.props;
    return !searching;
  }

  render() {
    const {query, results} = this.props;
    return <div className="results-container">
      {query ? results : null}
    </div>;
  }
}

export class SearchBar extends PureComponent {
  render() {
    const {onChange} = this.props;
    return <div className="search-bar">
      <input autoFocus={true} placeholder="Search..." onChange={onChange} />
      <svg aria-hidden="true" className="mag-glass" ><path d="M18 16.5l-5.14-5.18h-.35a7 7 0 10-1.19 1.19v.35L16.5 18l1.5-1.5zM12 7A5 5 0 112 7a5 5 0 0110 0z"></path></svg>
    </div>
  }
}

