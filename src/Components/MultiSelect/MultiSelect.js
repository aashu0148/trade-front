import React, { useEffect, useState } from "react";

import styles from "./MultiSelect.module.scss";

function MultiSelect({
  id = "m-s",
  label,
  subLabel,
  options = [],
  onChange,
  error = "",
  className,
  textClassName,
}) {
  const [firstRender, setFirstRender] = useState(true);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    if (firstRender) return;

    if (onChange)
      onChange(
        options.map((item) => ({
          ...item,
          selected: selected.some((o) => o.value == item.value),
        }))
      );
  }, [selected]);

  useEffect(() => {
    if (firstRender) setFirstRender(false);

    if (
      Array.isArray(options) &&
      options.filter((item) => item.selected).length
    )
      setSelected(options.filter((item) => item.selected));
    else if (selected.length) setSelected([]);
  }, [id]);

  return (
    <div className={`${styles.container} ${className || ""}`}>
      {label ? <label>{label}</label> : ""}
      {subLabel ? <label className={styles.subLabel}>{subLabel}</label> : ""}

      <div className={styles.options}>
        {options.map((option) => (
          <div className={styles.option} key={option.value}>
            <input
              type="checkbox"
              id={id + option.value}
              checked={selected.some((item) => item.value == option.value)}
              onChange={() =>
                setSelected((prev) =>
                  prev.some((item) => item.value == option.value)
                    ? prev.filter((item) => item.value !== option.value)
                    : [...prev, option]
                )
              }
            />
            <label
              htmlFor={id + option.value}
              className={`${styles.text} ${textClassName || ""}`}
            >
              {option.label}
            </label>
          </div>
        ))}
        {error ? <p className={`error-msg ${styles.errorMsg}`}>{error}</p> : ""}
      </div>
    </div>
  );
}

export default MultiSelect;
