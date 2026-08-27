import { useState } from "react";
import Icon from "./Icon";

const locations = {
  Bengaluru: [12.9716, 77.5946],
  Chennai: [13.0827, 80.2707],
  Hyderabad: [17.385, 78.4867],
  Pune: [18.5204, 73.8567],
  Coimbatore: [11.0168, 76.9558],
  Mumbai: [19.076, 72.8777],
};

const blankForm = {
  customer: "",
  origin: "Bengaluru",
  destination: "Chennai",
  weight: "",
  volume: "",
  priority: "Normal",
  deadline: "",
  value: "",
};

export default function AddShipmentModal({ onClose, onSubmit }) {
  const [form, setForm] = useState(blankForm);
  const [error, setError] = useState("");
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = (event) => {
    event.preventDefault();
    if (!form.customer || !form.weight || !form.volume || !form.deadline) {
      setError("Customer, weight, volume and deadline are required.");
      return;
    }
    const [originLat, originLon] = locations[form.origin];
    const [destinationLat, destinationLon] = locations[form.destination];
    onSubmit({ ...form, weight: Number(form.weight), volume: Number(form.volume), originLat, originLon, destinationLat, destinationLon });
  };
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="add-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="modal-icon"><Icon name="package" size={21} /></span>
            <h2>Add a shipment</h2>
            <p>It will be stored and included in the next route calculation.</p>
          </div>
          <button type="button" className="close-button" onClick={onClose}><Icon name="close" size={19} /></button>
        </div>
        <div className="form-grid">
          <label><span>Customer</span><input name="customer" value={form.customer} onChange={update} placeholder="e.g. Acme Logistics" /></label>
          <label><span>Declared value</span><input name="value" type="number" min="0" value={form.value} onChange={update} placeholder="Optional" /></label>
          <label><span>Origin</span><select name="origin" value={form.origin} onChange={update}>{Object.keys(locations).map((city) => <option key={city}>{city}</option>)}</select></label>
          <label><span>Destination</span><select name="destination" value={form.destination} onChange={update}>{Object.keys(locations).map((city) => <option key={city}>{city}</option>)}</select></label>
          <label><span>Weight (tonnes)</span><input name="weight" type="number" min="0.1" step="0.1" value={form.weight} onChange={update} /></label>
          <label><span>Volume (m³)</span><input name="volume" type="number" min="0.1" step="0.1" value={form.volume} onChange={update} /></label>
          <label><span>Priority</span><select name="priority" value={form.priority} onChange={update}><option>Critical</option><option>High</option><option>Normal</option></select></label>
          <label><span>Delivery deadline</span><input name="deadline" type="datetime-local" value={form.deadline} onChange={update} /></label>
        </div>
        {error && <div className="action-message" role="alert">{error}</div>}
        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="new-lorry-button"><Icon name="plus" size={17} /> Add shipment</button>
        </div>
      </form>
    </div>
  );
}
