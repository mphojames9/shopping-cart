import React, { useEffect, useMemo, useState } from 'react';
import './Coupons.css';
import api, { errorMessage } from '../../api';
import { toast } from 'react-toastify';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import { PlusIcon, TagIcon, TrashIcon, CloseIcon } from '../../components/Icons';
import { formatRand } from '../../utils/format';

const emptyForm = { code: "", type: "percent", value: "", minSubtotal: "", maxUses: "", expiresAt: "" };

// Shops here run on South African time, so "today" and expiry dates are shown in that zone
const ZONE = "Africa/Johannesburg";
const todayInZone = () => new Date().toLocaleDateString("en-CA", { timeZone: ZONE }); // YYYY-MM-DD
const formatExpiry = (value) =>
  new Date(value).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric", timeZone: ZONE });

// a no-break space keeps "R" and the amount together when the line wraps
const rand = (value) => formatRand(value).replace(" ", "\u00a0");

const describeOffer = (c) => {
  const offer = c.type === "percent" ? `${c.value}% off` : `${rand(c.value)} off`;
  return c.minSubtotal > 0 ? `${offer} · min spend ${rand(c.minSubtotal)}` : offer;
};

// one word for what the shopper would experience
const statusOf = (c, now = Date.now()) => {
  if (!c.active) return { key: "paused", label: "Paused" };
  if (c.expiresAt && new Date(c.expiresAt).getTime() <= now) return { key: "expired", label: "Expired" };
  if (c.maxUses > 0 && c.usedCount >= c.maxUses) return { key: "used-up", label: "Used up" };
  return { key: "live", label: "Live" };
};

const Coupons = () => {

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);   // phones: the form folds away until asked for
  const [busyId, setBusyId] = useState(null);
  const [target, setTarget] = useState(null);        // code waiting for delete confirmation
  const [removing, setRemoving] = useState(false);

  const fetchCoupons = async () => {
    try {
      const response = await api.get("/api/coupon/list");
      if (response.data.success) setCoupons(response.data.data);
      else toast.error(response.data.message);
    } catch (error) {
      toast.error(errorMessage(error, "Could not load promo codes"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCoupons(); }, []);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((f) => ({ ...f, [name]: name === "code" ? value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") : value }));
  }

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const response = await api.post("/api/coupon/add", {
        code: form.code,
        type: form.type,
        value: Number(form.value),
        minSubtotal: Number(form.minSubtotal || 0),
        maxUses: Number(form.maxUses || 0),
        expiresAt: form.expiresAt || null,
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setForm(emptyForm);
        setFormOpen(false);
        await fetchCoupons();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  const toggle = async (coupon) => {
    setBusyId(coupon._id);
    try {
      const response = await api.post("/api/coupon/status", { id: coupon._id, active: !coupon.active });
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchCoupons();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyId(null);
    }
  }

  const remove = async () => {
    if (!target) return;
    setRemoving(true);
    try {
      const response = await api.post("/api/coupon/remove", { id: target._id });
      setTarget(null);
      if (response.data.success) toast.success(response.data.message);
      else toast.error(response.data.message);
      await fetchCoupons();
    } catch (error) {
      setTarget(null);
      toast.error(errorMessage(error));
    } finally {
      setRemoving(false);
    }
  }

  const liveCount = useMemo(() => coupons.filter((c) => statusOf(c).key === "live").length, [coupons]);

  return (
    <div className="coupons">

      <div className="page-head">
        <div>
          <h1>Promo codes</h1>
          <p>{loading ? "Loading promo codes..." : `${liveCount} live · ${coupons.length} ${coupons.length === 1 ? "code" : "codes"} in total`}</p>
        </div>
        <button type="button" className="btn btn-primary coupons-new" onClick={() => setFormOpen((open) => !open)} aria-expanded={formOpen}>
          {formOpen ? <CloseIcon size={18} /> : <PlusIcon size={18} />}
          {formOpen ? "Close" : "New code"}
        </button>
      </div>

      <div className="coupons-layout">

        <div className="card coupons-card">
          {loading &&
            <div aria-hidden="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="coupon-row">
                  <div className="skeleton skel-code" />
                  <div className="skeleton skel-line" />
                  <div className="skeleton skel-chip" />
                </div>
              ))}
            </div>
          }

          {!loading && coupons.length === 0 &&
            <div className="empty">
              <span className="empty-icon"><TagIcon size={32} /></span>
              <h3>No promo codes yet</h3>
              <p>Create a code and share it with your customers. They enter it in their cart.</p>
              <button type="button" className="btn btn-primary coupons-empty-new" onClick={() => setFormOpen(true)}>
                <PlusIcon size={18} />New code
              </button>
            </div>
          }

          {!loading && coupons.map((coupon, index) => {
            const status = statusOf(coupon);
            return (
              <div key={coupon._id} className="coupon-row rise" style={{ '--i': index }}>
                <div className="coupon-main">
                  <span className="coupon-code">{coupon.code}</span>
                  <span className="coupon-offer">{describeOffer(coupon)}</span>
                </div>
                <div className="coupon-meta">
                  <span>{coupon.maxUses > 0 ? `${coupon.usedCount} of ${coupon.maxUses} used` : `${coupon.usedCount} used`}</span>
                  <span>{coupon.expiresAt ? `Until ${formatExpiry(coupon.expiresAt)}` : "No expiry"}</span>
                </div>
                <span className={`chip coupon-status is-${status.key}`}>{status.label}</span>
                <div className="coupon-actions">
                  <button type="button" className="btn btn-ghost coupon-toggle" onClick={() => toggle(coupon)} disabled={busyId === coupon._id}>
                    {coupon.active ? "Pause" : "Resume"}
                  </button>
                  <button type="button" className="icon-btn danger" onClick={() => setTarget(coupon)} aria-label={`Delete ${coupon.code}`}>
                    <TrashIcon size={19} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <form className={`card coupon-form${formOpen ? " is-open" : ""}`} onSubmit={submit}>
          <h2>New promo code</h2>

          <div className="field-block">
            <label htmlFor="coupon-code">Code</label>
            <input className="control coupon-code-input" id="coupon-code" name="code" value={form.code} onChange={onChange}
              placeholder="WELCOME10" minLength={3} maxLength={20} autoComplete="off" spellCheck="false" required />
            <small>3 to 20 letters, numbers, - or _</small>
          </div>

          <fieldset className="field-block">
            <legend>Discount</legend>
            <div className="segmented" role="radiogroup" aria-label="Discount type">
              {[["percent", "Percentage"], ["fixed", "Fixed amount"]].map(([key, label]) => (
                <label key={key} className={form.type === key ? "is-on" : ""}>
                  <input type="radio" name="type" value={key} checked={form.type === key} onChange={onChange} />
                  {label}
                </label>
              ))}
            </div>
            <div className="control-wrap">
              {form.type === "fixed" && <span className="affix">R</span>}
              <input className="control-bare" name="value" value={form.value} onChange={onChange} type="number" inputMode="decimal"
                min="1" max={form.type === "percent" ? 100 : undefined} step={form.type === "percent" ? "1" : "0.01"}
                placeholder={form.type === "percent" ? "10" : "100"} aria-label="Discount value" required />
              {form.type === "percent" && <span className="affix affix-end">% off</span>}
            </div>
            <small>Comes off the products only, never the delivery fee.</small>
          </fieldset>

          <div className="field-block">
            <label htmlFor="coupon-min">Minimum spend <em>(optional)</em></label>
            <div className="control-wrap">
              <span className="affix">R</span>
              <input className="control-bare" id="coupon-min" name="minSubtotal" value={form.minSubtotal} onChange={onChange}
                type="number" inputMode="decimal" min="0" step="0.01" placeholder="No minimum" />
            </div>
          </div>

          <div className="coupon-form-row">
            <div className="field-block">
              <label htmlFor="coupon-max">Max uses <em>(optional)</em></label>
              <input className="control" id="coupon-max" name="maxUses" value={form.maxUses} onChange={onChange}
                type="number" inputMode="numeric" min="0" step="1" placeholder="Unlimited" />
            </div>
            <div className="field-block">
              <label htmlFor="coupon-exp">Valid until <em>(optional)</em></label>
              <input className="control" id="coupon-exp" name="expiresAt" value={form.expiresAt} onChange={onChange}
                type="date" min={todayInZone()} />
            </div>
          </div>

          <button className="btn btn-primary coupon-submit" type="submit" disabled={saving}>
            {saving && <span className="spinner" aria-hidden="true" />}
            {saving ? "Creating..." : "Create code"}
          </button>
        </form>

      </div>

      <ConfirmDialog
        open={!!target}
        title="Delete this promo code?"
        message={target ? `“${target.code}” will stop working straight away. Orders that already used it keep their discount.` : ""}
        confirmLabel="Delete code"
        busy={removing}
        onConfirm={remove}
        onCancel={() => setTarget(null)}
      />

    </div>
  );
}

export default Coupons;
