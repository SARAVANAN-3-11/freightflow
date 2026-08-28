import { useState } from "react";
import Icon from "../components/Icon";

export default function RfidSimulator({ data }) {
  const [rfidTag, setRfidTag] = useState(data.lorries[0]?.rfidTag || "RFID-DOST-002");
  const [gate, setGate] = useState("service");
  const [readerId, setReaderId] = useState("reader-demo-01");
  const [webhookUrl, setWebhookUrl] = useState("http://localhost:5678/webhook/freightflow-rfid-maintenance");
  const [result, setResult] = useState(null);
  const [sending, setSending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    setResult(null);
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfidTag, gate, readerId }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || `n8n returned ${response.status}`);
      setResult({ ok: true, message: `n8n updated ${body.lorry?.id || rfidTag} to Maintenance.` });
    } catch (error) {
      setResult({ ok: false, message: error.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="page rfid-page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">HARDWARE AUTOMATION</p>
          <h1>RFID reader simulator</h1>
          <p className="page-subtitle">Send a reader event to n8n and update the live fleet record.</p>
        </div>
        <span className="result-live"><i></i> n8n ready</span>
      </div>
      <div className="rfid-grid">
        <article className="panel rfid-panel">
          <div className="panel-head">
            <div><h2>Simulate RFID scan</h2><p>This behaves like a real reader POST request.</p></div>
            <span className="rfid-chip"><Icon name="target" size={17} /></span>
          </div>
          <form className="rfid-form" onSubmit={submit}>
            <label><span>RFID tag</span><select value={rfidTag} onChange={(event) => setRfidTag(event.target.value)}>{data.lorries.filter((lorry) => lorry.rfidTag).map((lorry) => <option key={lorry.rfidTag} value={lorry.rfidTag}>{lorry.rfidTag} · {lorry.id}</option>)}</select></label>
            <label><span>Reader ID</span><input value={readerId} onChange={(event) => setReaderId(event.target.value)} /></label>
            <label><span>Gate event</span><select value={gate} onChange={(event) => setGate(event.target.value)}><option value="service">Service gate → Maintenance</option><option value="main">Main gate → Maintenance automation</option></select></label>
            <label className="rfid-wide"><span>n8n production webhook URL</span><input type="url" value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} /></label>
            <button className="new-lorry-button" disabled={sending} type="submit"><Icon name="route" size={17} /> {sending ? "Sending scan..." : "Send RFID scan to n8n"}</button>
          </form>
          {result && <div className={`rfid-result ${result.ok ? "success" : "failure"}`} role="status"><Icon name={result.ok ? "check" : "info"} size={17} /> {result.message}</div>}
        </article>
        <aside className="panel rfid-flow-panel">
          <p className="eyebrow">AUTOMATION FLOW</p>
          <div className="rfid-flow-step"><b>01</b><span><strong>Reader sends tag</strong><small>POST JSON to n8n webhook</small></span></div>
          <div className="rfid-flow-step"><b>02</b><span><strong>n8n calls FreightFlow API</strong><small>Matches rfid_tag in Supabase</small></span></div>
          <div className="rfid-flow-step"><b>03</b><span><strong>Lorry becomes Maintenance</strong><small>Audit event and dashboard update</small></span></div>
        </aside>
      </div>
    </section>
  );
}
