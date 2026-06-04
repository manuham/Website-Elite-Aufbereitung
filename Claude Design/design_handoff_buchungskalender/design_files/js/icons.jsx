/* Lucide-style inline icons (the brand uses lucide-react). Stroke-based, 24px grid. */
const Ico = ({ d, size = 20, sw = 2, fill = 'none', children, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
       style={{ display: 'block', ...style }}>
    {d ? <path d={d} /> : children}
  </svg>
);

const ChevL = (p) => <Ico {...p} d="M15 18l-6-6 6-6" />;
const ChevR = (p) => <Ico {...p} d="M9 18l6-6-6-6" />;
const ChevD = (p) => <Ico {...p} d="M6 9l6 6 6-6" />;
const Check = (p) => <Ico {...p} d="M20 6L9 17l-5-5" />;
const ArrowR = (p) => <Ico {...p} d="M5 12h14M13 6l6 6-6 6" />;
const Clock = (p) => <Ico {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Ico>;
const Spark = (p) => <Ico {...p} d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z" />;
const CalIco = (p) => <Ico {...p}><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4" /></Ico>;
const Truck = (p) => <Ico {...p}><path d="M1 4h13v11H1zM14 8h4l3 3v4h-7" /><circle cx="6" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></Ico>;
const Lock = (p) => <Ico {...p}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></Ico>;
const Dot = ({ size = 6, color }) => (
  <span style={{ width: size, height: size, borderRadius: 99, background: color, display: 'inline-block' }} />
);

Object.assign(window, { Ico, ChevL, ChevR, ChevD, Check, ArrowR, Clock, Spark, CalIco, Truck, Lock, Dot });
