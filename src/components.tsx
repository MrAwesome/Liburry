import React, {Component, PureComponent} from "react";

export class EntryContainer extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      clicked: false,
    }
    this.myOnClick = this.myOnClick.bind(this);
    this.resetClicked = this.resetClicked.bind(this);
    this.clickedNotif = this.clickedNotif.bind(this);
  }

  myOnClick(_) {
    navigator.clipboard.writeText(this.props.poj_unicode_text)
    this.setState({clicked: true});
    setTimeout(() => this.resetClicked(), 500);
  }

  resetClicked() {
    this.setState({clicked: false});
  }

  clickedNotif() {
    return <div className="clicked-notif">Copied POJ to clipboard!</div>;
  }

  render() {
    const {poj_unicode, poj_normalized, english, hoabun} = this.props;
    const {clicked} = this.state;
    // FIXME(https://github.com/farzher/fuzzysort/issues/66)
    const html_poj_unicode = {__html: poj_unicode};
    const html_poj_normalized = {__html: poj_normalized};
    const html_english = {__html: english};
    const html_hoabun = {__html: hoabun};
    const poju = <span className="poj-unicode" dangerouslySetInnerHTML={html_poj_unicode}></span>;
    const pojn = <span className="poj-normalized" dangerouslySetInnerHTML={html_poj_normalized}></span>;
    const engl = <span className="english-definition" dangerouslySetInnerHTML={html_english}></span>;
    const hoab = <span className="hoabun" dangerouslySetInnerHTML={html_hoabun}></span>;

    // NOTE: the nbsp below is for copy-paste convenience if you want both hoabun and poj
    return (
      <div className={clicked ? "entry-container-clicked" : "entry-container"} onClick={this.myOnClick}>
        <div className="poj-normalized-container">
          {pojn}
        </div>
        <span className="poj-unicode-container">
          {poju}
        </span>
        &nbsp;
        <div className="hoabun-container">
          ({hoab})
        </div>
        <div className="english-container">
          {engl}
        </div>
        {clicked ? this.clickedNotif() : null}
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
  // TODO: Doesn't seem to work as intended
  //  shouldComponentUpdate() {
  //    const {searching} = this.props;
  //    return !searching;
  //  }

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

