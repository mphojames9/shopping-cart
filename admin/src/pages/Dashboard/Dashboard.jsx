import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './Dashboard.css';
import { Link } from 'react-router-dom';
import api, { API_URL, errorMessage } from '../../api';
import { toast } from 'react-toastify';
import { buildStats, STATUSES } from '../../utils/stats';
import { useCountUp } from '../../utils/hooks';
import { formatRandWhole, timeAgo } from '../../utils/format';
import { Donut, DONUT_COLORS, RevenueChart, Sparkline } from './charts';
import {
  ArrowRightIcon, BoxIcon, CalendarIcon, ImageIcon, PlusIcon, ReceiptIcon, RefreshIcon,
  SparklesIcon, TagIcon, TrendDownIcon, TrendUpIcon, WalletIcon,
} from '../../components/Icons';

const RANGES = [7, 30, 90];
const STATUS_TONES = { "Processing": "warn", "Out for delivery": "info", "Delivered": "ok" };
const INSIGHT_ICONS = {
  up: TrendUpIcon,
  down: TrendDownIcon,
  orders: ReceiptIcon,
  day: CalendarIcon,
  products: BoxIcon,
  quiet: SparklesIcon,
};

const formatCount = (n) => Math.round(n).toLocaleString("en-US");

const greetingFor = (date) => {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

/* a number that eases up to its value */
const CountUp = ({ value, format }) => {
  const shown = useCountUp(value);
  return <>{format(shown)}</>;
};

const Delta = ({ delta, days }) => {
  let direction = "flat";
  let label = "0%";
  if (delta?.isNew) {
    direction = "up";
    label = "New";
  } else if (delta) {
    const pct = Math.round(Math.abs(delta.pct));
    direction = pct === 0 ? "flat" : delta.pct > 0 ? "up" : "down";
    label = `${pct}%`;
  }
  return (
    <span className="kpi-foot">
      <span className={`delta is-${direction}`}>
        {direction === "up" && <TrendUpIcon size={14} />}
        {direction === "down" && <TrendDownIcon size={14} />}
        {label}
      </span>
      <span>vs previous {days} days</span>
    </span>
  );
};

const Thumb = ({ image, className }) => (
  <span className={className}>
    <ImageIcon size={18} />
    {image &&
      <img
        src={`${API_URL}/images/${image}`}
        alt=""
        loading="lazy"
        onError={(e)=>{ e.currentTarget.style.display = "none"; }}
      />
    }
  </span>
);

/* ------------------------------------------------------------------
   Presentational view: everything on screen, no data fetching
------------------------------------------------------------------- */
export const DashboardView = ({
  stats, range, onRangeChange, onRefresh, refreshing, updatedLabel, today = new Date(),
}) => {
  const [activeCategory, setActiveCategory] = useState(null);
  const { totals, deltas, series, days } = stats;

  const kpis = [
    { key: "revenue", label: "Revenue", Icon: WalletIcon, tone: "brand", value: totals.revenue, format: formatRandWhole,
      values: series.current.map((b) => b.revenue), delta: deltas.revenue },
    { key: "orders", label: "Orders", Icon: ReceiptIcon, tone: "ok", value: totals.orders, format: formatCount,
      values: series.current.map((b) => b.orders), delta: deltas.orders },
    { key: "items", label: "Items sold", Icon: BoxIcon, tone: "violet", value: totals.items, format: formatCount,
      values: series.current.map((b) => b.items), delta: deltas.items },
    { key: "aov", label: "Avg. order", Icon: TagIcon, tone: "warn", value: totals.aov, format: formatRandWhole,
      values: series.current.map((b) => (b.orders ? b.revenue / b.orders : 0)), delta: deltas.aov },
  ];

  const maxRevenue = Math.max(...stats.top.map((p) => p.revenue), 1);
  const pipelineTotal = stats.pipeline.total || 1;
  const processing = stats.pipeline.counts.Processing;
  const deliveredShare = Math.round((stats.pipeline.counts.Delivered / pipelineTotal) * 100);

  return (
    <div className="dash">

      <div className="page-head">
        <div>
          <h1>{greetingFor(today)}</h1>
          <p>
            {today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            {updatedLabel ? ` · Updated ${updatedLabel}` : ""}
          </p>
        </div>
        <div className="dash-tools">
          <div className="range" role="tablist" aria-label="Time range" style={{ '--idx': Math.max(0, RANGES.indexOf(range)) }}>
            <span className="range-pill" aria-hidden="true" />
            {RANGES.map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={range === value}
                className={`range-btn${range === value ? " is-active" : ""}`}
                onClick={() => onRangeChange(value)}
              >
                {value} days
              </button>
            ))}
          </div>
          <button type="button" className="icon-btn refresh-btn" onClick={onRefresh} disabled={refreshing} aria-label="Refresh dashboard">
            <RefreshIcon size={19} className={refreshing ? "is-spinning" : ""} />
          </button>
        </div>
      </div>

      {/* ---- KPI cards ---- */}
      <section className="kpi-grid" aria-label="Key numbers">
        {kpis.map(({ key, label, Icon, tone, value, format, values, delta }, index) => (
          <article key={key} className="card kpi rise" data-tone={tone} style={{ '--i': index }}>
            <header className="kpi-head">
              <span className="kpi-icon"><Icon size={18} /></span>
              {label}
            </header>
            <strong className="kpi-value"><CountUp value={value} format={format} /></strong>
            <Delta delta={delta} days={days} />
            <Sparkline values={values} />
          </article>
        ))}
      </section>

      {/* ---- insights ---- */}
      {stats.insights.length > 0 &&
        <section className="insights" aria-label="Insights">
          {stats.insights.map((insight, index) => {
            const Icon = INSIGHT_ICONS[insight.icon] || SparklesIcon;
            const inner = (
              <>
                <span className="insight-icon"><Icon size={19} /></span>
                <div>
                  <h3>{insight.title}</h3>
                  <p>{insight.body}</p>
                </div>
                {insight.to && <ArrowRightIcon size={17} className="insight-go" />}
              </>
            );
            return insight.to ? (
              <Link key={insight.id} to={insight.to} className="insight rise" data-tone={insight.tone} style={{ '--i': index + 4 }}>{inner}</Link>
            ) : (
              <div key={insight.id} className="insight rise" data-tone={insight.tone} style={{ '--i': index + 4 }}>{inner}</div>
            );
          })}
        </section>
      }

      {/* ---- chart + pipeline ---- */}
      <div className="dash-row dash-row-a">
        <section className="card panel rise" style={{ '--i': 8 }}>
          <header className="panel-head">
            <div>
              <h2>Revenue</h2>
              <p className="panel-sub">Daily sales over the last {days} days</p>
            </div>
            <ul className="legend" aria-label="Chart legend">
              <li><i className="key key-now" />This period</li>
              {stats.hasPrevious && <li><i className="key key-prev" />Previous</li>}
            </ul>
          </header>
          <RevenueChart
            key={range}
            current={series.current}
            previous={series.previous}
            days={days}
            showPrevious={stats.hasPrevious}
          />
        </section>

        <section className="card panel rise" style={{ '--i': 9 }}>
          <header className="panel-head">
            <div>
              <h2>Order pipeline</h2>
              <p className="panel-sub">{stats.pipeline.total} paid {stats.pipeline.total === 1 ? "order" : "orders"} in total</p>
            </div>
          </header>

          <div className="pipe-bar" role="img" aria-label="Orders by status">
            {STATUSES.map((status) => (
              <span key={status} data-tone={STATUS_TONES[status]} style={{ flexGrow: stats.pipeline.counts[status] }} />
            ))}
          </div>

          <ul className="pipe-list">
            {STATUSES.map((status) => (
              <li key={status} data-tone={STATUS_TONES[status]}>
                <i className="pipe-dot" />
                <span>{status}</span>
                <strong>{stats.pipeline.counts[status]}</strong>
              </li>
            ))}
          </ul>

          <div className="pipe-foot">
            <span><strong>{deliveredShare}%</strong> delivered</span>
            {processing > 0 &&
              <Link to="/orders?status=Processing" className="pipe-link">
                Review {processing} processing <ArrowRightIcon size={15} />
              </Link>
            }
          </div>
        </section>
      </div>

      {/* ---- top sellers + categories ---- */}
      <div className="dash-row dash-row-b">
        <section className="card panel rise" style={{ '--i': 10 }}>
          <header className="panel-head">
            <div>
              <h2>Top sellers</h2>
              <p className="panel-sub">Best performing products, last {days} days</p>
            </div>
          </header>

          {stats.top.length === 0 ? (
            <p className="panel-empty">No product sales in this period yet.</p>
          ) : (
            <ol className="ts-list">
              {stats.top.map((product, index) => {
                const body = (
                  <>
                    <span className="ts-rank">{index + 1}</span>
                    <Thumb image={product.image} className="ts-thumb" />
                    <span className="ts-main">
                      <strong>{product.name}</strong>
                      <span>{product.units} sold · {product.category}</span>
                      <span className="ts-bar"><i style={{ '--w': `${Math.max(4, (product.revenue / maxRevenue) * 100)}%`, '--i': index }} /></span>
                    </span>
                    <span className="ts-rev">{formatRandWhole(product.revenue)}</span>
                  </>
                );
                return (
                  <li key={product.key}>
                    {product.exists ? (
                      <Link to={`/edit/${product.foodId}`} className="ts-row" aria-label={`Edit ${product.name}`}>{body}</Link>
                    ) : (
                      <div className="ts-row">{body}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section className="card panel rise" style={{ '--i': 11 }}>
          <header className="panel-head">
            <div>
              <h2>Sales by category</h2>
              <p className="panel-sub">Where the money comes from</p>
            </div>
          </header>

          {stats.categories.length === 0 ? (
            <p className="panel-empty">Category sales will show up here.</p>
          ) : (
            <div className="cat">
              <Donut data={stats.categories} total={stats.categoryTotal} active={activeCategory} onActive={setActiveCategory} />
              <ul className="cat-list">
                {stats.categories.map((category, index) => (
                  <li
                    key={category.name}
                    className={activeCategory === index ? "is-active" : ""}
                    onPointerEnter={() => setActiveCategory(index)}
                    onPointerLeave={() => setActiveCategory(null)}
                  >
                    <i style={{ background: DONUT_COLORS[index % DONUT_COLORS.length] }} />
                    <span>{category.name}</span>
                    <strong>{Math.round((category.revenue / stats.categoryTotal) * 100)}%</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

    </div>
  );
};

/* ------------------------------------------------------------------
   Container: loads orders + products, keeps them fresh
------------------------------------------------------------------- */
const Dashboard = () => {

  const [orders, setOrders] = useState([]);
  const [foods, setFoods] = useState([]);
  const [status, setStatus] = useState("loading");   // loading | ready | error
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState(30);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [now, setNow] = useState(Date.now());

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setRefreshing(true);
    try {
      const [ordersResponse, foodsResponse] = await Promise.all([
        api.get("/api/order/list"),
        api.get("/api/food/list"),
      ]);
      if (!ordersResponse.data.success) {
        throw new Error(ordersResponse.data.message || "Could not load orders");
      }
      setOrders(ordersResponse.data.data);
      setFoods(foodsResponse.data.success ? foodsResponse.data.data : []);
      setUpdatedAt(Date.now());
      setStatus("ready");
    } catch (error) {
      if (!silent) toast.error(errorMessage(error, error.message || "Could not load the dashboard"));
      setStatus((current) => (current === "ready" ? current : "error"));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    // keep the numbers fresh while the tab is open
    const poll = setInterval(() => { if (!document.hidden) load({ silent: true }); }, 60000);
    const tick = setInterval(() => setNow(Date.now()), 30000);
    const onVisible = () => { if (!document.hidden) load({ silent: true }); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const stats = useMemo(
    () => (status === "ready" ? buildStats(orders, foods, range) : null),
    [status, orders, foods, range]
  );

  if (status === "loading") {
    return (
      <div className="dash" aria-hidden="true">
        <div className="page-head">
          <div>
            <h1>Dashboard</h1>
            <p>Crunching the numbers...</p>
          </div>
        </div>
        <div className="kpi-grid">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton dash-skel-kpi" />)}
        </div>
        <div className="skeleton dash-skel-chart" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="dash">
        <div className="page-head">
          <div>
            <h1>Dashboard</h1>
            <p>Your store at a glance.</p>
          </div>
        </div>
        <div className="card">
          <div className="empty">
            <span className="empty-icon"><RefreshIcon size={30} /></span>
            <h3>Could not load the dashboard</h3>
            <p>Check your connection and try again.</p>
            <button type="button" className="btn btn-primary" onClick={() => load()}>Try again</button>
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="dash">
        <div className="page-head">
          <div>
            <h1>{greetingFor(new Date())}</h1>
            <p>Your store at a glance.</p>
          </div>
        </div>
        <div className="card">
          <div className="empty">
            <span className="empty-icon"><SparklesIcon size={32} /></span>
            <h3>Your dashboard is waiting for its first sale</h3>
            <p>As soon as a customer pays, revenue, top sellers and insights will appear here.</p>
            <Link to="/add" className="btn btn-primary"><PlusIcon size={18} />Add a product</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardView
      stats={stats}
      range={range}
      onRangeChange={setRange}
      onRefresh={() => load()}
      refreshing={refreshing}
      updatedLabel={updatedAt ? timeAgo(updatedAt, now) : ""}
    />
  );
}

export default Dashboard;
