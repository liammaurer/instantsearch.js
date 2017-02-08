import React from 'react';
import omit from 'lodash/omit';

import Nouislider from 'react-nouislider';

const cssPrefix = 'ais-range-slider--';

import isEqual from 'lodash/isEqual';

import autoHideContainerHOC from '../../decorators/autoHideContainer.js';
import headerFooterHOC from '../../decorators/headerFooter.js';

export class RawSlider extends React.Component {
  componentWillMount() {
    this.handleChange = this.handleChange.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    return !isEqual(this.props.range, nextProps.range) ||
      !isEqual(this.props.start, nextProps.start);
  }

  // we are only interested in rawValues
  handleChange(formattedValues, handleId, rawValues) {
    this.props.onChange(rawValues);
  }

  render() {
    if (this.props.range.min === this.props.range.max) {
      // There's no need to try to render the Slider, it will not be usable
      // and will throw
      return null;
    }

    // setup pips
    let pips;
    if (this.props.pips === false) {
      pips = undefined;
    } else if (this.props.pips === true || typeof this.props.pips === 'undefined') {
      pips = {
        mode: 'positions',
        density: 3,
        values: [0, 50, 100],
        stepped: true,
      };
    } else {
      pips = this.props.pips;
    }

    return (
      <Nouislider
        // NoUiSlider also accepts a cssClasses prop, but we don't want to
        // provide one.
        {...omit(this.props, ['cssClasses'])}
        animate={false}
        behaviour={'snap'}
        connect
        cssPrefix={cssPrefix}
        onChange={this.handleChange}
        pips={pips}
      />
    );
  }
}

RawSlider.propTypes = {
  onChange: React.PropTypes.func,
  onSlide: React.PropTypes.func,
  pips: React.PropTypes.oneOfType([
    React.PropTypes.bool,
    React.PropTypes.object,
  ]),
  range: React.PropTypes.object.isRequired,
  start: React.PropTypes.arrayOf(React.PropTypes.number).isRequired,
  tooltips: React.PropTypes.oneOfType([
    React.PropTypes.bool,
    React.PropTypes.arrayOf(
      React.PropTypes.shape({
        to: React.PropTypes.func,
      })
    ),
  ]),
};

export default autoHideContainerHOC(headerFooterHOC(RawSlider));
