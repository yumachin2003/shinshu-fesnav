import { FaHeart, FaRegHeart } from "react-icons/fa";

export default function Favorite({ selected, onToggle }) {
  return (
    <span
      onClick={onToggle}
      style={{ cursor: "pointer", fontSize: "1.5rem", color: "red" }}
    >
      {selected ? <FaHeart /> : <FaRegHeart />}
    </span>
  );
}
