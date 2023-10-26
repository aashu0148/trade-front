import React, { useEffect, useState } from "react";

import Spinner from "Components/Spinner/Spinner";

import { getAllTrades } from "apis/trade";
import { monthNameIndexMapping } from "utils/constants";

import styles from "./CalendarPage.module.scss";

function CalendarPage() {
  const [allTrades, setAllTrades] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [dayDetails, setDayDetails] = useState({});

  const monthWiseSegregatedTrades = allTrades.reduce(
    (acc, curr, i) =>
      !acc.length || curr.month !== acc[acc.length - 1].month
        ? [
            ...acc,
            {
              ...curr,
              tradeIndex: i,
            },
          ]
        : acc,
    []
  );

  const fetchAllTrades = async () => {
    const res = await getAllTrades();
    setLoadingPage(false);
    if (!res?.data) return;

    const trades = res.data;
    trades.sort((a, b) =>
      new Date(a.createdAt) < new Date(b.createdAt) ? -1 : 1
    );
    setAllTrades(
      trades.map((item) => ({
        ...item,
        month: new Date(item.createdAt).getMonth(),
      }))
    );
  };

  const handleDayTradeHove = (event, dayTrades = []) => {
    const rect = event.target.getBoundingClientRect();

    const profitable = dayTrades.filter((item) => item.status == "profit");
    const lossMaking = dayTrades.filter((item) => item.status == "loss");

    setDayDetails({
      x: rect.x,
      y: rect.y,
      total: dayTrades.length,
      profitable: profitable.length,
      lost: lossMaking.length,
    });
  };

  useEffect(() => {
    fetchAllTrades();
  }, []);

  const monthCalendar = ({ monthNumber = 0, trades = [] }) => {
    const monthData = {
      0: {
        days: 31,
        name: {
          ...monthNameIndexMapping[0],
        },
      },
      1: {
        days: 28,
        name: {
          ...monthNameIndexMapping[1],
        },
      },
      2: {
        days: 31,
        name: {
          ...monthNameIndexMapping[2],
        },
      },
      3: {
        days: 30,
        name: {
          ...monthNameIndexMapping[3],
        },
      },
      4: {
        days: 31,
        name: {
          ...monthNameIndexMapping[4],
        },
      },
      5: {
        days: 30,
        name: {
          ...monthNameIndexMapping[5],
        },
      },
      6: {
        days: 31,
        name: {
          ...monthNameIndexMapping[6],
        },
      },
      7: {
        days: 31,
        name: {
          ...monthNameIndexMapping[7],
        },
      },
      8: {
        days: 30,
        name: {
          ...monthNameIndexMapping[8],
        },
      },
      9: {
        days: 31,
        name: {
          ...monthNameIndexMapping[9],
        },
      },
      10: {
        days: 30,
        name: {
          ...monthNameIndexMapping[10],
        },
      },
      11: {
        days: 31,
        name: {
          ...monthNameIndexMapping[11],
        },
      },
    };

    const tradeDetails = trades.map((item) => ({
      day: new Date(item.createdAt).getDate(),
      ...item,
    }));

    let profitDays = 0;
    let lostDays = 0;

    new Array(monthData[monthNumber].days).fill(1).forEach((_e, i) => {
      const todayTrades = tradeDetails.filter((item) => item.day == i + 1);
      const profitable = todayTrades.filter((item) => item.status == "profit");
      const lossMaking = todayTrades.filter((item) => item.status == "loss");

      const isGreen = profitable.length >= lossMaking.length;

      if (todayTrades.length) {
        if (isGreen) profitDays++;
        else lostDays++;
      }
    });

    return (
      <div
        className={`${styles.calendar} ${
          profitDays >= lostDays ? styles.greenish : styles.reddish
        }`}
        key={monthNumber + "" + trades.length}
      >
        <div className={styles.top}>
          <p className={styles.title}>{monthData[monthNumber].name?.long}</p>

          <div className={styles.right}>
            <p className={styles.profit}>{profitDays}</p>
            <p className={styles.loss}>{lostDays}</p>
          </div>
        </div>

        <div className={styles.days}>
          {new Array(monthData[monthNumber].days).fill(1).map((_e, i) => {
            const todayTrades = tradeDetails.filter(
              (item) => item.day == i + 1
            );
            const profitable = todayTrades.filter(
              (item) => item.status == "profit"
            );
            const lossMaking = todayTrades.filter(
              (item) => item.status == "loss"
            );

            const isGreen = profitable.length >= lossMaking.length;

            return (
              <div
                className={`${styles.day} ${
                  todayTrades.length
                    ? isGreen
                      ? styles.green
                      : styles.red
                    : ""
                }`}
                onMouseEnter={(e) =>
                  todayTrades.length ? handleDayTradeHove(e, todayTrades) : ""
                }
                onMouseLeave={() => setDayDetails({})}
              >
                {i + 1}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return loadingPage ? (
    <div className="spinner-container">
      <Spinner />
    </div>
  ) : (
    <div className={styles.container}>
      <p className={styles.heading}>Trades calendar</p>

      <div className={styles.boxes}>
        <div
          className={`${styles.dayDetails} ${
            dayDetails.x && dayDetails.y ? styles.active : ""
          }`}
          style={{
            top: `${dayDetails.y + 40}px`,
            left: `${dayDetails.x + 20}px`,
          }}
        >
          <div className={styles.item}>
            <label>Total</label>
            <span>{dayDetails.total || "_"}</span>
          </div>
          <div className={`${styles.green} ${styles.item}`}>
            <label>Profitable</label>
            <span>{dayDetails.profitable || "_"}</span>
          </div>
          <div className={`${styles.red} ${styles.item}`}>
            <label>Lost</label>
            <span>{dayDetails.lost || "_"}</span>
          </div>
        </div>

        {monthWiseSegregatedTrades.map((item, i) =>
          monthCalendar({
            monthNumber: item.month,
            trades: allTrades.slice(
              item.tradeIndex,
              monthWiseSegregatedTrades.length - 1 == i
                ? allTrades.length
                : monthWiseSegregatedTrades[i + 1].tradeIndex
            ),
          })
        )}
      </div>
    </div>
  );
}

export default CalendarPage;
