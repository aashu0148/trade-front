import React from "react";

import styles from "./Banner.module.scss";

function Banner({ bannerDetails = {} }) {
  return (
    <div
      className={`${styles.banner} ${
        bannerDetails.green
          ? styles.greenBanner
          : bannerDetails.red
          ? styles.redBanner
          : ""
      } ${bannerDetails.blinking ? styles.blink : ""}`}
    >
      <p className={styles.title}>{bannerDetails.text}</p>
    </div>
  );
}

export default Banner;
