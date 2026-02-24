import { useState } from "react";

const OLD_CLASSES = [
  {
    id: "armodel",
    label: "ARModel",
    subtitle: "pl.LightningModule",
    color: "#b45309",
    bg: "#fef3c7",
    border: "#d97706",
    responsibilities: [
      "Training / val / test loops",
      "Loss computation",
      "Metric logging & plotting",
      "predict_step() [abstract]",
      "unroll_prediction() [AR loop]",
      "boundary_mask, interior_mask",
      "grid_static_features, state stats",
      "feature_weights",
    ],
    note: "God-class: training logic AND model params AND AR loop all tangled together",
  },
  {
    id: "subclass",
    label: "GraphLAM / HiLAM / HiLAMParallel",
    subtitle: "extends ARModel",
    color: "#1d4ed8",
    bg: "#eff6ff",
    border: "#3b82f6",
    responsibilities: [
      "predict_step() implementation",
      "Graph/mesh architecture",
      "embedd_mesh_nodes()",
      "process_step()",
      "Also inherits ALL ARModel buffers",
    ],
    note: "Subclass does prediction, but drags along the entire LightningModule inheritance chain",
  },
];

const NEW_CLASSES = [
  {
    id: "forecastermodule",
    label: "ForecasterModule",
    subtitle: "pl.LightningModule",
    color: "#065f46",
    bg: "#ecfdf5",
    border: "#10b981",
    responsibilities: [
      "Training / val / test loops",
      "Loss computation",
      "Metric logging & plotting",
      "configure_optimizers()",
      "on_load_checkpoint()",
    ],
    note: "Pure Lightning concern: orchestration only. Knows nothing about graph structure.",
  },
  {
    id: "arforecaster",
    label: "ARForecaster",
    subtitle: "extends Forecaster (nn.Module)",
    color: "#5b21b6",
    bg: "#f5f3ff",
    border: "#8b5cf6",
    responsibilities: [
      "AR unroll loop (forward())",
      "boundary/interior masking per step",
      "Wraps a StepPredictor",
      "Returns (prediction, pred_std)",
    ],
    note: "Owns the autoregressive strategy. Fully decoupled from Lightning.",
  },
  {
    id: "steppredictor",
    label: "StepPredictor",
    subtitle: "abstract nn.Module",
    color: "#be185d",
    bg: "#fdf2f8",
    border: "#ec4899",
    responsibilities: [
      "grid_static_features, state stats",
      "boundary_mask, interior_mask",
      "feature_weights",
      "prepare_clamping_params()",
      "get_clamped_new_state()",
      "forward() [abstract: X_{t-1}, X_t → X_{t+1}]",
    ],
    note: "Owns all model-level buffers and the single-step contract.",
  },
  {
    id: "graphmodels",
    label: "GraphLAM / HiLAM / HiLAMParallel",
    subtitle: "extends BaseGraphModel → StepPredictor",
    color: "#0e7490",
    bg: "#ecfeff",
    border: "#06b6d4",
    responsibilities: [
      "forward() implementation",
      "Graph encode–process–decode",
      "embedd_mesh_nodes()",
      "process_step() / hi_processor_step()",
    ],
    note: "Pure prediction concern. No Lightning, no AR loop.",
  },
];

const ARROWS_OLD = [
  { from: "armodel", to: "subclass", label: "extends (inheritance)" },
];

const ARROWS_NEW = [
  { from: "forecastermodule", to: "arforecaster", label: "has-a (composition)" },
  { from: "arforecaster", to: "steppredictor", label: "has-a .predictor" },
  { from: "steppredictor", to: "graphmodels", label: "extends (inheritance)" },
];

const KEY_CHANGES = [
  {
    icon: "⇒",
    title: "Composition over Inheritance for the AR loop",
    old: "ARModel.unroll_prediction() lived inside the LightningModule itself",
    new: "ARForecaster.forward() is a standalone nn.Module — independently testable",
  },
  {
    icon: "⇒",
    title: "Buffers moved to StepPredictor",
    old: "grid_static_features, state_stats, masks etc. lived on ARModel",
    new: "StepPredictor owns all per-model buffers; ForecasterModule has none",
  },
  {
    icon: "⇒",
    title: "ForecasterModule is now model-agnostic",
    old: "ARModel had to be subclassed per architecture",
    new: "ForecasterModule builds any model via MODELS[name] dict — no subclassing needed",
  },
  {
    icon: "⇒",
    title: "Forecaster / StepPredictor are pure PyTorch",
    old: "Graph models inherited Lightning lifecycle methods",
    new: "Graph models are plain nn.Module — no Lightning dependency at all",
  },
];

function ClassCard({ cls, compact }) {
  const [open, setOpen] = useState(!compact);
  return (
    <div
      style={{
        border: `2px solid ${cls.border}`,
        borderRadius: 10,
        background: cls.bg,
        marginBottom: 10,
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
      }}
    >
      <div
        style={{
          background: cls.border,
          padding: "8px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={() => setOpen(!open)}
      >
        <div>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, fontFamily: "monospace" }}>
            {cls.label}
          </span>
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, marginLeft: 10 }}>
            {cls.subtitle}
          </span>
        </div>
        <span style={{ color: "#fff", fontSize: 13 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ padding: "10px 14px" }}>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {cls.responsibilities.map((r, i) => (
              <li key={i} style={{ fontSize: 13, color: cls.color, marginBottom: 3, fontFamily: "monospace" }}>
                {r}
              </li>
            ))}
          </ul>
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: "#555",
              fontStyle: "italic",
              borderTop: `1px dashed ${cls.border}`,
              paddingTop: 6,
            }}
          >
            {cls.note}
          </div>
        </div>
      )}
    </div>
  );
}

function ArrowLabel({ label, color }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        margin: "4px 0 4px 20px",
      }}
    >
      <span style={{ fontSize: 18, color }}>↓</span>
      <span
        style={{
          fontSize: 11,
          color,
          fontFamily: "monospace",
          background: "#f9f9f9",
          padding: "2px 8px",
          borderRadius: 20,
          border: `1px solid ${color}`,
        }}
      >
        {label}
      </span>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("compare");

  return (
    <div
      style={{
        fontFamily: "'Georgia', serif",
        maxWidth: 980,
        margin: "0 auto",
        padding: "24px 16px",
        background: "#f8f8f6",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            margin: 0,
            letterSpacing: "-0.5px",
            color: "#1a1a1a",
          }}
        >
          ARModel → ForecasterModule Redesign
        </h1>
        <p style={{ color: "#666", fontSize: 14, marginTop: 6 }}>
          How the monolithic <code>ARModel</code> was decomposed into focused, composable classes
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, justifyContent: "center" }}>
        {[
          { key: "compare", label: "Side-by-Side" },
          { key: "changes", label: "Key Changes" },
          { key: "flow", label: "Data Flow" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 20px",
              border: "2px solid",
              borderColor: tab === t.key ? "#1a1a1a" : "#ccc",
              background: tab === t.key ? "#1a1a1a" : "#fff",
              color: tab === t.key ? "#fff" : "#555",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
              fontFamily: "inherit",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Side-by-Side tab */}
      {tab === "compare" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Old */}
          <div>
            <div
              style={{
                background: "#7f1d1d",
                color: "#fff",
                padding: "8px 14px",
                borderRadius: "8px 8px 0 0",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: 1,
              }}
            >
              ❌ BEFORE — ar_model.py
            </div>
            <div
              style={{
                border: "2px solid #7f1d1d",
                borderTop: "none",
                borderRadius: "0 0 8px 8px",
                padding: 14,
                background: "#fff",
              }}
            >
              {OLD_CLASSES.map((cls, i) => (
                <div key={cls.id}>
                  <ClassCard cls={cls} compact={false} />
                  {i < OLD_CLASSES.length - 1 && (
                    <ArrowLabel label="extends (inheritance)" color="#b45309" />
                  )}
                </div>
              ))}
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 14px",
                  background: "#fef2f2",
                  borderRadius: 8,
                  border: "1px solid #fca5a5",
                  fontSize: 12,
                  color: "#7f1d1d",
                }}
              >
                <strong>Problem:</strong> Training logic, AR loop, model buffers, and graph architecture
                were all coupled inside a single class hierarchy. Adding a new forecasting strategy
                required subclassing the entire LightningModule.
              </div>
            </div>
          </div>

          {/* New */}
          <div>
            <div
              style={{
                background: "#064e3b",
                color: "#fff",
                padding: "8px 14px",
                borderRadius: "8px 8px 0 0",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: 1,
              }}
            >
              ✅ AFTER — New Design
            </div>
            <div
              style={{
                border: "2px solid #064e3b",
                borderTop: "none",
                borderRadius: "0 0 8px 8px",
                padding: 14,
                background: "#fff",
              }}
            >
              {NEW_CLASSES.map((cls, i) => (
                <div key={cls.id}>
                  <ClassCard cls={cls} compact={false} />
                  {i < NEW_CLASSES.length - 1 && (
                    <ArrowLabel
                      label={ARROWS_NEW[i]?.label || ""}
                      color={NEW_CLASSES[i + 1].border}
                    />
                  )}
                </div>
              ))}
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 14px",
                  background: "#f0fdf4",
                  borderRadius: 8,
                  border: "1px solid #86efac",
                  fontSize: 12,
                  color: "#064e3b",
                }}
              >
                <strong>Result:</strong> Each class has a single responsibility.
                ForecasterModule only handles Lightning. ARForecaster only handles unrolling.
                StepPredictor + graph models only handle the physics of one prediction step.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Changes tab */}
      {tab === "changes" && (
        <div>
          {KEY_CHANGES.map((c, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 40px 1fr",
                gap: 12,
                marginBottom: 16,
                alignItems: "start",
              }}
            >
              <div
                style={{
                  background: "#fef2f2",
                  border: "1.5px solid #fca5a5",
                  borderRadius: 8,
                  padding: "12px 14px",
                }}
              >
                <div style={{ fontSize: 11, color: "#7f1d1d", fontWeight: 700, marginBottom: 4 }}>
                  BEFORE
                </div>
                <div style={{ fontSize: 13, color: "#450a0a", fontFamily: "monospace" }}>{c.old}</div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingTop: 24,
                }}
              >
                <span style={{ fontSize: 22 }}>{c.icon}</span>
              </div>
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1.5px solid #86efac",
                  borderRadius: 8,
                  padding: "12px 14px",
                }}
              >
                <div style={{ fontSize: 11, color: "#064e3b", fontWeight: 700, marginBottom: 4 }}>
                  AFTER
                </div>
                <div style={{ fontSize: 13, color: "#022c22", fontFamily: "monospace" }}>{c.new}</div>
              </div>
              <div
                style={{
                  gridColumn: "1 / -1",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#374151",
                  paddingLeft: 4,
                  borderLeft: "3px solid #6366f1",
                  paddingLeft: 10,
                }}
              >
                {c.title}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Data Flow tab */}
      {tab === "flow" && (
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <p style={{ textAlign: "center", color: "#555", fontSize: 13, marginBottom: 20 }}>
            How a training batch flows through the new architecture
          </p>

          {[
            {
              step: "1",
              actor: "ForecasterModule",
              color: "#10b981",
              bg: "#ecfdf5",
              action: "training_step(batch)",
              detail: "Unpacks batch → calls common_step()",
            },
            {
              step: "2",
              actor: "ForecasterModule",
              color: "#10b981",
              bg: "#ecfdf5",
              action: "common_step(batch)",
              detail: "Calls self.forecaster(init_states, forcing_features, border_states)",
            },
            {
              step: "3",
              actor: "ARForecaster",
              color: "#8b5cf6",
              bg: "#f5f3ff",
              action: "forward(init_states, forcing, border_states)",
              detail: "AR loop over pred_steps: calls predictor(prev_state, prev_prev_state, forcing) each step",
            },
            {
              step: "4",
              actor: "ARForecaster",
              color: "#8b5cf6",
              bg: "#f5f3ff",
              action: "boundary merge per step",
              detail: "new_state = boundary_mask × border_state + interior_mask × pred_state",
            },
            {
              step: "5",
              actor: "GraphLAM / HiLAM / HiLAMParallel",
              color: "#06b6d4",
              bg: "#ecfeff",
              action: "forward(prev_state, prev_prev_state, forcing)",
              detail: "Encode → Process → Decode → rescale delta → clamp → return new_state",
            },
            {
              step: "6",
              actor: "ARForecaster",
              color: "#8b5cf6",
              bg: "#f5f3ff",
              action: "stack predictions",
              detail: "Returns (prediction [B, T, N, d_f], pred_std)",
            },
            {
              step: "7",
              actor: "ForecasterModule",
              color: "#10b981",
              bg: "#ecfdf5",
              action: "compute loss + log",
              detail: "loss(prediction, target, pred_std, mask=interior_mask_bool) → backward()",
            },
          ].map((s, i, arr) => (
            <div key={i}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "12px 16px",
                  background: s.bg,
                  border: `2px solid ${s.color}`,
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: s.color,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 13,
                    flexShrink: 0,
                  }}
                >
                  {s.step}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: s.color,
                      letterSpacing: 0.5,
                      marginBottom: 2,
                    }}
                  >
                    {s.actor}
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 14, color: "#1a1a1a", marginBottom: 4 }}>
                    {s.action}
                  </div>
                  <div style={{ fontSize: 12, color: "#555" }}>{s.detail}</div>
                </div>
              </div>
              {i < arr.length - 1 && (
                <div style={{ textAlign: "center", fontSize: 20, color: "#aaa", margin: "2px 0" }}>
                  ↓
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
