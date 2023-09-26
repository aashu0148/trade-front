import React from "react";

import styles from "./SimpleSelect.module.scss";

function SimpleSelect({
  className,
  optionClassName,
  options = [],
  onChange,
  ...props
}) {
  return (
    <select
      className={`${styles.container} ${className}`}
      onChange={(e) =>
        onChange
          ? onChange(options.find((item) => item.value == e.target.value))
          : ""
      }
      {...props}
    >
      {options.map((item) => (
        <option
          key={item.value}
          value={item.value}
          className={`${optionClassName || ""}`}
        >
          {item.label}
        </option>
      ))}
    </select>
  );
}

export default SimpleSelect;
