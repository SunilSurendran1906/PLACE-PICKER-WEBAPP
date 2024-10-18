import React, { useEffect, useState } from "react";

export default function ProgressBar({ timer }) {
  const [remaining, setRemaining] = useState(timer);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prevTime) => prevTime - 10);
    }, 10);
    return () => {
      clearInterval(interval);
    };
  }, []);
  return <progress value={remaining} max={timer} />;
}
