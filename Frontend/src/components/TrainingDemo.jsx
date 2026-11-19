import { useEffect, useState } from "react";

const Cursor = ({ x, y, clicking }) => (
  <div
    className="pointer-events-none absolute z-20"
    style={{ left: `${x}%`, top: `${y}%`, transition: "left 0.55s ease, top 0.55s ease" }}
  >
    {clicking && <span className="absolute -left-2 -top-2 h-6 w-6 rounded-full border-2 border-[#2e6b57]" />}
    <svg width="18" height="22" viewBox="0 0 18 22" aria-hidden="true">
      <path d="M1 1 L1 17.5 L5.4 13.6 L8.6 21 L11.2 19.8 L8 12.4 L13.8 12.2 Z" fill="white" stroke="#111" strokeWidth="1.2" />
    </svg>
  </div>
);

const Recording = ({ cursor, children }) => (
  <div className="relative aspect-[4/3] overflow-hidden bg-[#f4f7f6]">
    {children}
    <Cursor x={cursor.x} y={cursor.y} clicking={cursor.click} />
  </div>
);

const tokenClass = {
  kw: "text-[#569cd6]",
  fn: "text-[#dcdcaa]",
  num: "text-[#b5cea8]",
  plain: "text-[#d4d4d4]",
};

const beforeCode = [
  [["kw", "function "], ["fn", "total"], ["plain", "(items) {"]],
  [["kw", "  let "], ["plain", "sum = "], ["num", "0"], ["plain", ";"]],
  [["kw", "  for "], ["plain", "("], ["kw", "const "], ["plain", "item "], ["kw", "of "], ["plain", "items) {"]],
  [["plain", "    sum = sum + item.price;"]],
  [["plain", "  }"]],
  [["kw", "  return "], ["plain", "sum;"]],
  [["plain", "}"]],
];

const afterCode = [
  [["kw", "function "], ["fn", "total"], ["plain", "(items) {"]],
  [["kw", "  return "], ["plain", "items.reduce("]],
  [["plain", "    (sum, item) => sum + item.price,"]],
  [["num", "    0"]],
  [["plain", "  );"]],
  [["plain", "}"]],
];

const Line = ({ parts, selected }) => (
  <div className={selected ? "bg-[#264f78]" : ""}>
    {parts.map(([kind, text], index) => (
      <span key={index} className={tokenClass[kind]}>{text}</span>
    ))}
  </div>
);

const CodeDemo = ({ tick }) => {
  const cycle = tick % 12;
  const editing = cycle >= 5;
  const count = editing ? Math.min(cycle - 4, afterCode.length) : beforeCode.length;
  const lines = editing ? afterCode.slice(0, count) : beforeCode;
  const selected = !editing && cycle >= 3;
  const lineY = (index) => 8 + index * 6.2;
  const cursor = editing
    ? { x: 48, y: lineY(Math.max(0, count - 1)), click: cycle === 5 }
    : cycle < 3
      ? { x: 78, y: lineY(1), click: false }
      : { x: 36, y: lineY(3), click: cycle === 3 };

  return (
    <Recording cursor={cursor}>
      <div className="absolute inset-0 bg-[#1e1e1e] p-3 font-mono text-[11px] leading-5 sm:text-xs sm:leading-6">
        {lines.map((parts, index) => (
          <div key={`${editing}-${index}`} className="flex">
            <span className="w-6 shrink-0 text-right text-[#858585]">{index + 1}</span>
            <div className="min-w-0 flex-1 pl-3">
              <Line parts={parts} selected={selected && index >= 2 && index <= 4} />
            </div>
          </div>
        ))}
        <span className="ml-9 inline-block h-4 w-1.5 animate-pulse bg-[#d4d4d4]" />
        <div className="absolute inset-x-0 bottom-0 flex justify-between bg-[#007acc] px-3 py-1 text-[10px] text-white">
          <span>JavaScript</span>
          <span>Ln {lines.length}, Col 2</span>
        </div>
      </div>
    </Recording>
  );
};

const NetworkDemo = ({ tick }) => {
  const cycle = tick % 8;
  const sent = cycle >= 4;
  const cursor = sent ? { x: 62, y: 78, click: cycle === 4 } : { x: 28, y: 30 + cycle * 8, click: false };
  const rows = [
    ["Laptop", sent ? "Sent" : "Ready"],
    ["Switch", sent ? "Forwarded" : "Ready"],
    ["Server", sent ? "Reply 12 ms" : "Waiting"],
  ];
  return (
    <Recording cursor={cursor}>
      <div className="absolute inset-0 bg-[#f4f7f6] p-4">
        <div className="mb-3 text-sm font-semibold text-slate-800">Send a test message</div>
        {rows.map(([name, status]) => (
          <div key={name} className="mb-2 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
            <span className="font-medium text-slate-800">{name}</span>
            <span className={sent ? "text-[#2e6b57]" : "text-slate-400"}>{status}</span>
          </div>
        ))}
        <div className={`mt-3 inline-flex rounded-md px-3 py-1.5 text-xs font-semibold text-white ${cycle >= 3 ? "bg-[#214d3e]" : "bg-[#2e6b57]"}`}>
          Send test
        </div>
      </div>
    </Recording>
  );
};

const parts = [
  ["Processor", "4 cores"],
  ["Memory", "8 GB"],
  ["Storage", "256 GB"],
  ["Display", "Connected"],
];

const SystemsDemo = ({ tick }) => {
  const active = tick % 4;
  return (
    <Recording cursor={{ x: 30, y: 24 + active * 16, click: true }}>
      <div className="absolute inset-0 bg-[#f4f7f6] p-4">
        <div className="mb-3 text-sm font-semibold text-slate-800">This computer</div>
        {parts.map(([name, detail], index) => (
          <div key={name} className={`mb-2 rounded-lg border px-3 py-2 ${index === active ? "border-[#2e6b57] bg-[#eef3f2]" : "border-slate-200 bg-white"}`}>
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-800">{name}</span>
              <span className="text-slate-500">{detail}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-[#2e6b57]" style={{ width: index <= active ? "80%" : "8%" }} />
            </div>
          </div>
        ))}
      </div>
    </Recording>
  );
};

const clips = ["#2e6b57", "#7dcec0", "#f3d38a", "#8fb8a8"];

const MultimediaDemo = ({ tick }) => {
  const frame = tick % 8;
  const at = Math.min(frame, 6);
  return (
    <Recording cursor={{ x: 12 + at * 12, y: 78, click: frame > 0 && frame < 7 }}>
      <div className="absolute inset-0 flex flex-col bg-[#f4f7f6]">
        <div className="m-3 flex flex-1 items-center justify-center rounded-md bg-black">
          <div className="h-16 w-28 rounded-md" style={{ background: clips[Math.min(3, Math.floor(at / 2))] }} />
        </div>
        <div className="relative mx-3 mb-3 flex h-12 gap-1">
          {clips.map((color) => (
            <div key={color} className="h-full flex-1 rounded-sm" style={{ background: color }} />
          ))}
          <div className="absolute -top-1 h-14 w-0.5 bg-white" style={{ left: `${(at / 6) * 100}%` }} />
        </div>
      </div>
    </Recording>
  );
};

const ElectronicsDemo = ({ tick }) => {
  const on = tick % 6 >= 3;
  return (
    <Recording cursor={on ? { x: 74, y: 42, click: (tick % 6) === 3 } : { x: 22, y: 62, click: false }}>
      <div className="absolute inset-0 bg-[#f4f7f6]">
        <svg viewBox="0 0 320 220" className="h-full w-full">
          <rect x="36" y="78" width="28" height="48" rx="3" fill="#d7ebe4" stroke="#17352c" />
          <path d="M64 96 H120 l10 -16 14 32 14 -32 14 16 H230" fill="none" stroke={on ? "#2e6b57" : "#8aa399"} strokeWidth="3" />
          <circle cx="248" cy="90" r="18" fill={on ? "#f3d38a" : "#d7ebe4"} stroke="#17352c" />
          <circle cx={on ? 200 : 80} cy={on ? 86 : 96} r="4" fill="#f3d38a" />
        </svg>
        <div className="absolute bottom-3 left-3 rounded-md bg-white px-2 py-1 text-[11px] text-slate-700">
          Lamp: {on ? "on" : "open circuit"}
        </div>
      </div>
    </Recording>
  );
};

const ledger = [
  ["Sale", "12,000"],
  ["Supplies", "3,500"],
  ["Rent", "8,000"],
];

const AccountingDemo = ({ tick }) => {
  const shown = tick % 4;
  const spots = [
    { x: 70, y: 36 },
    { x: 70, y: 50 },
    { x: 70, y: 64 },
    { x: 70, y: 82 },
  ];
  return (
    <Recording cursor={{ ...spots[shown], click: shown < 3 }}>
      <div className="absolute inset-0 bg-[#f4f7f6]">
        <div className="grid grid-cols-[1.2fr_0.8fr] border-b border-slate-200 bg-[#eef3f2] text-[11px] font-semibold text-slate-600">
          <div className="border-r border-slate-200 px-3 py-2">Item</div>
          <div className="px-3 py-2 text-right">RWF</div>
        </div>
        {ledger.map(([item, amount], index) => (
          <div key={item} className={`grid grid-cols-[1.2fr_0.8fr] border-b border-slate-100 text-xs ${index === shown ? "bg-[#e8f2ee]" : ""}`}>
            <div className="border-r border-slate-100 px-3 py-2 text-slate-800">{index < shown ? item : ""}</div>
            <div className="px-3 py-2 text-right text-slate-800">{index < shown ? amount : ""}</div>
          </div>
        ))}
        <div className="grid grid-cols-[1.2fr_0.8fr] text-xs font-semibold">
          <div className="px-3 py-2 text-slate-800">Total</div>
          <div className="px-3 py-2 text-right text-[#2e6b57]">{shown >= 3 ? "23,500" : ""}</div>
        </div>
      </div>
    </Recording>
  );
};

const ElectricalDemo = ({ tick }) => {
  const cycle = tick % 6;
  const tested = cycle >= 2;
  const on = cycle >= 4;
  const cursor = on ? { x: 68, y: 62, click: cycle === 4 } : tested ? { x: 68, y: 36, click: false } : { x: 30, y: 36, click: cycle === 2 };
  return (
    <Recording cursor={cursor}>
      <div className="absolute inset-0 bg-[#f4f7f6] p-4">
        <div className="mb-3 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-3">
          <div>
            <div className="text-xs font-semibold text-slate-800">Outlet</div>
            <div className="text-[11px] text-slate-500">{tested ? "230 V" : "Not tested"}</div>
          </div>
          <div className={`rounded-md px-2 py-1 text-[11px] font-semibold text-white ${tested ? "bg-[#2e6b57]" : "bg-slate-400"}`}>Test</div>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-3">
          <div>
            <div className="text-xs font-semibold text-slate-800">Lamp</div>
            <div className="text-[11px] text-slate-500">{on ? "Switched on" : "Off"}</div>
          </div>
          <span className={`h-8 w-8 rounded-full border ${on ? "border-[#f3d38a] bg-[#f3d38a]" : "border-slate-300 bg-slate-200"}`} />
        </div>
      </div>
    </Recording>
  );
};

const demos = {
  "training-software": CodeDemo,
  "training-networking": NetworkDemo,
  "training-systems": SystemsDemo,
  "training-multimedia": MultimediaDemo,
  "training-electronics": ElectronicsDemo,
  "training-accounting": AccountingDemo,
  "training-electrical": ElectricalDemo,
};

const TrainingDemo = ({ id }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setTick(0);
    const timer = setInterval(() => setTick((value) => value + 1), 700);
    return () => clearInterval(timer);
  }, [id]);

  const Demo = demos[id] || CodeDemo;
  return <Demo tick={tick} />;
};

export default TrainingDemo;
