import React, { useEffect, useState } from "react";

import styles from "./SingleSelect.module.scss";

function SingleSelect({
  id = "s-s",
  label,
  subLabel,
  options = [],
  onChange,
  defaultOption,
  error = "",
}) {
  const [selected, setSelected] = useState("");

  useEffect(() => {
    if (onChange) onChange(selected);
  }, [selected]);

  useEffect(() => {
    if (defaultOption) setSelected(defaultOption);
  }, [id]);

  return (
    <div className={styles.container}>
      {label ? <label>{label}</label> : ""}
      {subLabel ? <label className={styles.subLabel}>{subLabel}</label> : ""}

      <div className={styles.options}>
        {options.map((option) => (
          <div className={styles.option} key={option}>
            <input
              type="radio"
              id={id + option}
              checked={option == selected}
              onChange={(event) =>
                event.target.checked ? setSelected(option) : ""
              }
            />
            <label htmlFor={id + option} className={styles.text}>
              {option}
            </label>
          </div>
        ))}
        {error ? <p className={`error-msg ${styles.errorMsg}`}>{error}</p> : ""}
      </div>
    </div>
  );
}

export default SingleSelect;
