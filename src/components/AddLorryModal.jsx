import { useState } from "react";
import Icon from "./Icon";

const blankForm = {
  registration: "",
  driver: "",
  type: "Container",
  capacity: "14",
  location: "Bengaluru depot",
  fuel: "85",
  rfidTag: "",
};

export default function AddLorryModal({ onClose, onSubmit }) {
  const [form, setForm] = useState(blankForm);
  const [errors, setErrors] = useState({});
  const update = (event) =>
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  const submit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.registration.trim())
      nextErrors.registration = "Registration is required";
    if (!form.driver.trim()) nextErrors.driver = "Driver name is required";
    if (!form.capacity || Number(form.capacity) < 1)
      nextErrors.capacity = "Enter a valid capacity";
    if (!form.rfidTag.trim()) nextErrors.rfidTag = "RFID tag is required";
    if (Object.keys(nextErrors).length) return setErrors(nextErrors);
    onSubmit(form);
  };
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form
        className="add-modal"
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="modal-icon">
              <Icon name="truck" size={21} />
            </span>
            <h2>Add a lorry</h2>
            <p>It’ll appear as available in your fleet.</p>
          </div>
          <button type="button" className="close-button" onClick={onClose}>
            <Icon name="close" size={19} />
          </button>
        </div>
        <div className="form-grid">
          <label className={errors.registration ? "has-error" : ""}>
            <span>Registration number</span>
            <input
              autoFocus
              name="registration"
              value={form.registration}
              onChange={update}
              placeholder="e.g. KA-01-MX-2804"
            />
            {errors.registration && <em>{errors.registration}</em>}
          </label>
          <label className={errors.driver ? "has-error" : ""}>
            <span>Driver name</span>
            <input
              name="driver"
              value={form.driver}
              onChange={update}
              placeholder="e.g. Ravi Kumar"
            />
            {errors.driver && <em>{errors.driver}</em>}
          </label>
          <label>
            <span>Vehicle type</span>
            <select name="type" value={form.type} onChange={update}>
              <option>Container</option>
              <option>Refrigerated</option>
              <option>Flatbed</option>
              <option>Tanker</option>
            </select>
          </label>
          <label className={errors.capacity ? "has-error" : ""}>
            <span>Capacity (tonnes)</span>
            <input
              name="capacity"
              type="number"
              min="1"
              max="100"
              value={form.capacity}
              onChange={update}
            />
            {errors.capacity && <em>{errors.capacity}</em>}
          </label>
          <label>
            <span>Current location</span>
            <select name="location" value={form.location} onChange={update}>
              <option>Bengaluru depot</option>
              <option>Chennai depot</option>
              <option>Hyderabad depot</option>
              <option>Pune depot</option>
              <option>Coimbatore depot</option>
            </select>
          </label>
          <label>
            <span>Fuel level (%)</span>
            <input
              name="fuel"
              type="number"
              min="0"
              max="100"
              value={form.fuel}
              onChange={update}
            />
          </label>
          <label className={errors.rfidTag ? "has-error" : ""}>
            <span>RFID tag</span>
            <input
              name="rfidTag"
              value={form.rfidTag}
              onChange={update}
              placeholder="e.g. RFID-DOST-009"
            />
            {errors.rfidTag && <em>{errors.rfidTag}</em>}
          </label>
        </div>
        <div className="modal-note">
          <Icon name="info" size={16} /> This lorry is stored in the connected fleet database.
        </div>
        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="new-lorry-button">
            <Icon name="plus" size={17} /> Add to fleet
          </button>
        </div>
      </form>
    </div>
  );
}
