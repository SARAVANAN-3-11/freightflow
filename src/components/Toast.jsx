import Icon from "./Icon";

export default function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="toast">
      <span className="toast-icon">
        <Icon name="check" size={17} />
      </span>
      <span>{message}</span>
      <button onClick={onClose}>
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
