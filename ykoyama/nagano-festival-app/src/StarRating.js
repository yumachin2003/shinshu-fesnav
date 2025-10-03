// StarRating.js
import React, { useState, useEffect } from "react";
import { FaStar } from "react-icons/fa";

const createArray = length => [...Array(length)];

const Star = ({ selected = false, onSelect = f => f }) => (
  <FaStar
    style={{ cursor: "pointer", fontSize: "2rem" }}
    color={selected ? "gold" : "lightgray"}
    onClick={onSelect}
  />
);

export default function StarRating({ count = 5, value = 0, onRate = f => f }) {
  const [selectedStars, setSelectedStars] = useState(value);

  // props.value が変わったら selectedStars を更新
  useEffect(() => {
    setSelectedStars(value);
  }, [value]);

  return (
    <div>
      {createArray(count).map((n, i) => (
        <Star
          key={i}
          selected={selectedStars > i}
          onSelect={() => {
            setSelectedStars(i + 1);
            onRate(i + 1);
          }}
        />
      ))}
      <p>{selectedStars} / {count} stars</p>
    </div>
  );
}
