import React, { useEffect, useState } from "react";
import RcSlider from "rc-slider";

import { getDebounceFunc } from "utils/util";

function Slider({
  min,
  max,
  value,
  defaultValue,
  onChange,
  onChangeDebounce,
  dotDetails = [],
  ...props
}) {
  const debounce = getDebounceFunc();

  const [firstRender, setFirstRender] = useState(true);
  const [val, setVal] = useState([]);

  const handleRender = (handle) => {
    let correspondingDetail = dotDetails.find(
      (item) => item.label == handle.props["aria-label"]
    );
    if (!correspondingDetail?.style) correspondingDetail = { style: {} };

    return React.cloneElement(handle, {
      style: { ...handle.props.style, ...correspondingDetail.style },
      children: [
        <div className="handle-inner">
          <p>{handle.props["aria-label"]}</p>
        </div>,
      ],
    });
  };

  useEffect(() => {
    if (firstRender) return;

    const updatedVal = val.map((item) => parseFloat(item.toFixed(3)));

    if (onChange) {
      onChange(updatedVal);
      return;
    }

    if (!onChangeDebounce) return;

    debounce(() => onChangeDebounce(updatedVal), 500);
  }, [val]);

  useEffect(() => {
    if (!Array.isArray(value)) return;

    const originalVal = JSON.stringify(value.map((item) => parseInt(item)));
    const currentVal = JSON.stringify(val.map((item) => parseInt(item)));

    if (currentVal == originalVal || onChangeDebounce) return;

    setVal(value);
  }, [value]);

  useEffect(() => {
    setFirstRender(false);
  }, []);

  return (
    <RcSlider
      range
      className="custom-rc-slider"
      min={min}
      max={max}
      marks={{
        [min]: isNaN(min) ? min : min.toFixed(2),
        [max]: isNaN(max) ? max : max.toFixed(2),
      }}
      value={val}
      step={(max - min) / 100}
      onChange={setVal}
      allowCross={false}
      ariaLabelForHandle={dotDetails.map((item) => item.label)}
      handleRender={handleRender}
      {...props}
    />
  );
}

export default Slider;
