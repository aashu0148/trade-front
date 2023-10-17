import React, { useRef, useEffect } from "react";

import styles from "./Dropdown.module.scss";

let closeFn = () => console.log("func not attached");
function Dropdown({
  onClose,
  children,
  startFromRight,
  startFromMiddle = false,
  className,
  startFromTop,
}) {
  const dropdown = useRef();

  const handleClick = (event) => {
    if (
      dropdown.current &&
      !dropdown.current.contains(event.target) &&
      closeFn
    ) {
      closeFn();
    }
  };

  useEffect(() => {
    if (onClose && typeof onClose == "function") closeFn = onClose;
  }, [onClose]);

  useEffect(() => {
    setTimeout(() => {
      document.addEventListener("mouseup", handleClick);
    }, 500);

    return () => {
      document.removeEventListener("mouseup", handleClick);
    };
  }, []);

  return (
    <div
      ref={dropdown}
      className={`${styles.dropDown} ${
        startFromRight ? styles.startFromRight : ""
      } ${startFromMiddle ? styles.startFromMiddle : ""} ${
        startFromTop ? styles.startFromTop : ""
      } ${className ? className : ""}`}
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </div>
  );
}

export default Dropdown;
