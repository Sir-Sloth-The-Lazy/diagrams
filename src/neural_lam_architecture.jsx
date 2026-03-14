import { useState } from "react";

const BEFORE = {
  problems: [
    "Cannot swap rollout strategy (AR → ensemble)",
    "Cannot add probabilistic step predictor",
    "Training loss is hard-coded MSE",
    "Boundary mask buried inside model",
    "Circular import: model ↔ training",
    "args namespace prevents programmatic init",
  ]
};

const AFTER = {
  layers: [
    {
      id: "fm", label: "ForecasterModule", sublabel: "pl.LightningModule",
      color: "#1e40af", textColor: "#fff",
      items: ["Training loop", "Loss routing (MSE | NLL | ELBO | CRPS)", "Metrics + visualization", "Optimizer config"],
      note: "Accepts Forecaster via dependency injection",
      owns: "training lifecycle"
    },
    {
      id: "arf", label: "ARForecaster", sublabel: "Forecaster (nn.Module)",
      color: "#0891b2", textColor: "#fff",
      items: ["Autoregressive rollout", "Boundary masking ← moved here", "interior_mask from datastore"],
      note: "Future: EnsembleForecaster sits at same level",
      owns: "rollout strategy"
    },
    {
      id: "sp", label: "StepPredictor", sublabel: "Abstract base (nn.Module)",
      color: "#7c3aed", textColor: "#fff",
      items: ["forward(prev, prev_prev, forcing)", "→ (next_state, pred_std | None)", "Normalization & clamping", "Grid static features"],
      note: "GraphLAM / HiLAM inherit from this",
      owns: "one-step prediction"
    },
  ],
  gains: [
    "EnsembleForecaster plugs in at ARForecaster level",
    "StochasticStepPredictor adds Z_t sampling",
    "ELBO + CRPS loss in ForecasterModule",
    "Boundary mask owned by ARForecaster only",
    "Dependency injection removes circular import",
    "Explicit kwargs enable programmatic init",
    "InteractionNet extended with init_scheme=\"propagation\" — PropagationNet behaviour, zero new classes",
  ]
};

const CHANGES = [
  { item: "ForecasterModule constructor", before: "Instantiates model internally via args namespace", after: "__init__(self, forecaster: Forecaster, ...) — dependency injection, explicit kwargs" },
  { item: "Boundary masking", before: "Inside StepPredictor / ARModel — deeply nested", after: "Owned exclusively by ARForecaster; StepPredictor is pure input→output" },
  { item: "interior_mask_bool", before: "Accessed via forecaster.predictor.interior_mask chain", after: "Queried directly from datastore in ARForecaster.__init__" },
  { item: "pred_std handling", before: "Model-specific logic scattered across ARModel", after: "StepPredictor.forward() always returns (next_state, pred_std | None); None routes to constant per_var_std in ForecasterModule" },
  { item: "Loss function", before: "Hard-coded MSE in ARModel.training_step()", after: "Swappable in ForecasterModule: MSE / NLL / ELBO / CRPS based on training_phase" },
  { item: "Circular import", before: "model.py ↔ training.py mutual imports", after: "Eliminated: ForecasterModule knows only the Forecaster interface" },
  { item: "Test file", before: "test_refactored_hierarchy.py", after: "test_prediction_model_classes.py (per mentor comment)" },
  { item: "border_states naming", before: "border_states (inconsistent with literature)", after: "boundary_states (matches paper terminology)" },
  { item: "PropagationNet", before: "Separate class planned — duplicates InteractionNet scaffold entirely", after: "init_scheme parameter added to InteractionNet: 'standard' (default) or 'propagation'. Zero new classes, zero duplicated code." },
];

export default function App() {
  const [tab, setTab] = useState("compare");

  return (
    <div style={{ fontFamily: "'IBM Plex Mono', 'Fira Code', monospace", background: "#0f172a", minHeight: "100vh", color: "#e2e8f0", padding: "0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .tab-btn { cursor: pointer; border: none; font-family: 'IBM Plex Mono', monospace; font-size: 13px; font-weight: 600; padding: 8px 20px; border-radius: 6px; transition: all 0.15s; }
        .tab-btn.active { background: #3b82f6; color: #fff; }
        .tab-btn.inactive { background: #1e293b; color: #94a3b8; }
        .tab-btn.inactive:hover { background: #334155; color: #e2e8f0; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 10px; }
        .badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; letter-spacing: 0.05em; }
        .flow-arrow { color: #475569; font-size: 20px; display: flex; align-items: center; justify-content: center; }
        .change-row:hover { background: #1e293b; }
        .node-box { border-radius: 8px; padding: 14px 18px; margin-bottom: 8px; border: 1px solid rgba(255,255,255,0.08); }
      `}</style>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", borderBottom: "1px solid #1e293b", padding: "28px 32px 24px" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "#64748b", marginBottom: 6, fontWeight: 700 }}>NEURAL-LAM · PR #208 · GSoC 2026</div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#f1f5f9", fontFamily: "'IBM Plex Sans', sans-serif" }}>
          Model Class Hierarchy Refactor
        </h1>
        <div style={{ marginTop: 4, fontSize: 13, color: "#64748b" }}>ARModel → ForecasterModule + ARForecaster + StepPredictor</div>

        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          {[
            { id: "compare", label: "⬛ Before / After" },
            { id: "changes", label: "📋 Key Changes" },
            { id: "dataflow", label: "⬇ Data Flow" },
            { id: "future", label: "🔮 Phase 2 Extension" },
          ].map(t => (
            <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : "inactive"}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "28px 32px" }}>

        {/* ── TAB 1: BEFORE / AFTER ── */}
        {tab === "compare" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* BEFORE */}
              <div className="card" style={{ padding: 20, borderColor: "#7f1d1d" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#dc2626", display: "inline-block" }} />
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#fca5a5", fontFamily: "'IBM Plex Sans', sans-serif" }}>BEFORE — Monolithic ARModel</span>
                </div>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 16, letterSpacing: "0.05em" }}>SINGLE CLASS · ~600 LINES · ALL CONCERNS FUSED</div>

                <div style={{ background: "#1c1917", border: "2px solid #dc2626", borderRadius: 10, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#fca5a5", marginBottom: 4 }}>ARModel</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 12 }}>pl.LightningModule</div>
                  {[
                    "🔴 Training loop + optimizer",
                    "🔴 Loss computation (MSE hard-coded)",
                    "🔴 Autoregressive rollout",
                    "🔴 Boundary masking",
                    "🔴 Normalization + clamping",
                    "🔴 Metrics + visualization",
                    "🔴 GNN encode-process-decode",
                  ].map((item, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#d1d5db", padding: "4px 0", borderBottom: "1px solid #292524" }}>{item}</div>
                  ))}
                </div>

                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8, fontWeight: 700, letterSpacing: "0.1em" }}>PROBLEMS</div>
                {BEFORE.problems.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "#f87171", padding: "3px 0" }}>
                    <span style={{ color: "#dc2626", flexShrink: 0 }}>✗</span> {p}
                  </div>
                ))}
              </div>

              {/* AFTER */}
              <div className="card" style={{ padding: 20, borderColor: "#14532d" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#86efac", fontFamily: "'IBM Plex Sans', sans-serif" }}>AFTER — PR #208 Composable Hierarchy</span>
                </div>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 16, letterSpacing: "0.05em" }}>3 FOCUSED LAYERS · DEPENDENCY-INJECTED · EXTENSIBLE</div>

                {AFTER.layers.map((layer, i) => (
                  <div key={i}>
                    <div style={{ background: "#0f172a", border: `1px solid ${layer.color}55`, borderLeft: `3px solid ${layer.color}`, borderRadius: 8, padding: 12, marginBottom: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: 13, color: layer.color }}>{layer.label}</span>
                          <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 8 }}>{layer.sublabel}</span>
                        </div>
                        <span style={{ fontSize: 10, background: layer.color + "22", color: layer.color, padding: "2px 8px", borderRadius: 4, fontWeight: 700, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                          owns: {layer.owns}
                        </span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                        {layer.items.map((item, j) => (
                          <span key={j} style={{ fontSize: 11, color: "#94a3b8", background: "#1e293b", padding: "2px 7px", borderRadius: 4 }}>{item}</span>
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b", fontStyle: "italic" }}>→ {layer.note}</div>
                    </div>
                    {i < AFTER.layers.length - 1 && (
                      <div style={{ textAlign: "center", color: "#334155", fontSize: 16, margin: "2px 0" }}>▼ passes StepPredictor</div>
                    )}
                  </div>
                ))}

                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8, fontWeight: 700, letterSpacing: "0.1em", marginTop: 14 }}>UNLOCKED</div>
                {AFTER.gains.map((g, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "#86efac", padding: "3px 0" }}>
                    <span style={{ color: "#16a34a", flexShrink: 0 }}>✓</span> {g}
                  </div>
                ))}
              </div>
            </div>

            {/* Net result banner */}
            <div style={{ textAlign: "center", marginTop: 28, padding: "16px", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.15em", fontWeight: 700 }}>NET RESULT OF PR #208</div>
              <div style={{ marginTop: 8, fontSize: 13, color: "#cbd5e1" }}>
                Adding <span style={{ color: "#818cf8", fontWeight: 700 }}>EnsembleForecaster</span> (Phase 2) requires <span style={{ color: "#86efac", fontWeight: 700 }}>zero changes</span> to GraphLAM / HiLAM /
                ForecasterModule — only a new class at the ARForecaster level.
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: KEY CHANGES ── */}
        {tab === "changes" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#0f172a", borderBottom: "1px solid #334155" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: "0.1em", width: "18%" }}>COMPONENT</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#f87171", fontWeight: 700, letterSpacing: "0.1em", width: "40%" }}>BEFORE (old ARModel)</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, color: "#86efac", fontWeight: 700, letterSpacing: "0.1em", width: "42%" }}>AFTER (PR #208)</th>
                </tr>
              </thead>
              <tbody>
                {CHANGES.map((row, i) => (
                  <tr key={i} className="change-row" style={{ borderBottom: "1px solid #1e293b", background: i % 2 === 0 ? "transparent" : "#0f172a11" }}>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#93c5fd", fontWeight: 600, verticalAlign: "top" }}>{row.item}</td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#fca5a5", verticalAlign: "top", lineHeight: 1.5 }}>
                      <span style={{ marginRight: 6, color: "#dc2626" }}>✗</span>{row.before}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#86efac", verticalAlign: "top", lineHeight: 1.5 }}>
                      <span style={{ marginRight: 6, color: "#16a34a" }}>✓</span>{row.after}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: "14px 16px", background: "#0f172a", borderTop: "1px solid #334155", fontSize: 11, color: "#475569" }}>
              Source: mentor review comments from @joeloskarsson and @leifdenby on PR #208 · github.com/mllam/neural-lam/pull/208
            </div>
          </div>
        )}

        {/* ── TAB 3: DATA FLOW ── */}
        {tab === "dataflow" && (
          <div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>
              Tensor shapes annotated at every interface boundary. <span style={{ color: "#818cf8" }}>B</span> = batch · <span style={{ color: "#818cf8" }}>T</span> = pred_steps · <span style={{ color: "#818cf8" }}>N</span> = num_grid_nodes · <span style={{ color: "#818cf8" }}>d_f</span> = feature_dim
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 0, maxWidth: 760 }}>

              {/* DataLoader */}
              <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 14 }}>DataLoader</span>
                    <span style={{ fontSize: 11, color: "#64748b", marginLeft: 10 }}>neural_lam.WeatherDataset</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {[
                    { name: "init_states", shape: "(B, 2, N, d_f)" },
                    { name: "forcing_features", shape: "(B, T, N, d_forcing)" },
                    { name: "boundary_states", shape: "(B, T, N, d_f)" },
                  ].map((t, i) => (
                    <div key={i} style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "5px 10px" }}>
                      <span style={{ fontSize: 12, color: "#93c5fd", fontWeight: 600 }}>{t.name}</span>
                      <span style={{ fontSize: 11, color: "#475569", marginLeft: 6 }}>{t.shape}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", padding: "6px 24px" }}>
                <div style={{ flex: 1, height: 1, background: "#334155" }} />
                <div style={{ padding: "0 12px", fontSize: 11, color: "#64748b" }}>passed to</div>
                <div style={{ flex: 1, height: 1, background: "#334155" }} />
              </div>

              {/* ForecasterModule */}
              <div style={{ background: "#1e2d4f", border: "1px solid #1e40af", borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 700, color: "#93c5fd", fontSize: 14 }}>ForecasterModule <span style={{ fontSize: 11, color: "#3b82f6", fontWeight: 400 }}>pl.LightningModule</span></div>
                <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 12, color: "#cbd5e1" }}>training_step / validation_step</div>
                  <div style={{ fontSize: 12, color: "#cbd5e1" }}>→ calls <span style={{ color: "#38bdf8", fontWeight: 600 }}>self.forecaster.forward(...)</span></div>
                  <div style={{ fontSize: 12, color: "#cbd5e1" }}>→ computes loss + logs metrics</div>
                </div>
                <div style={{ marginTop: 10, padding: "8px 12px", background: "#0f172a", borderRadius: 6, fontSize: 11, color: "#64748b" }}>
                  self.forecaster injected at __init__ — no model construction here
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", padding: "6px 24px" }}>
                <div style={{ flex: 1, height: 1, background: "#334155" }} />
                <div style={{ padding: "0 12px", fontSize: 11, color: "#64748b" }}>delegates to</div>
                <div style={{ flex: 1, height: 1, background: "#334155" }} />
              </div>

              {/* ARForecaster */}
              <div style={{ background: "#0c2a30", border: "1px solid #0891b2", borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 700, color: "#67e8f9", fontSize: 14 }}>ARForecaster <span style={{ fontSize: 11, color: "#0891b2", fontWeight: 400 }}>Forecaster (nn.Module)</span></div>
                <div style={{ marginTop: 10, fontSize: 12, color: "#cbd5e1" }}>AR loop over T steps:</div>
                <div style={{ marginTop: 8, background: "#0f172a", borderRadius: 6, padding: "10px 14px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#94a3b8", lineHeight: 1.8 }}>
                  <div><span style={{ color: "#64748b" }}>for i in range(T):</span></div>
                  <div style={{ paddingLeft: 16 }}><span style={{ color: "#67e8f9" }}>pred_state, pred_std</span> = self.predictor(prev, prev_prev, forcing[:, i])</div>
                  <div style={{ paddingLeft: 16 }}>new_state = <span style={{ color: "#f59e0b" }}>boundary_mask</span> * boundary[:, i] + <span style={{ color: "#a78bfa" }}>interior_mask</span> * pred_state</div>
                  <div style={{ paddingLeft: 16, color: "#64748b" }}># boundary_mask owned here — NOT in StepPredictor</div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "4px 10px", fontSize: 11 }}>
                    <span style={{ color: "#67e8f9" }}>returns prediction</span><span style={{ color: "#475569", marginLeft: 6 }}>(B, T, N, d_f)</span>
                  </div>
                  <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "4px 10px", fontSize: 11 }}>
                    <span style={{ color: "#67e8f9" }}>returns pred_std</span><span style={{ color: "#475569", marginLeft: 6 }}>(B, T, N, d_f) | None</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", padding: "6px 24px" }}>
                <div style={{ flex: 1, height: 1, background: "#334155" }} />
                <div style={{ padding: "0 12px", fontSize: 11, color: "#64748b" }}>calls each step</div>
                <div style={{ flex: 1, height: 1, background: "#334155" }} />
              </div>

              {/* StepPredictor */}
              <div style={{ background: "#1a1030", border: "1px solid #7c3aed", borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 700, color: "#c4b5fd", fontSize: 14 }}>StepPredictor <span style={{ fontSize: 11, color: "#7c3aed", fontWeight: 400 }}>Abstract base (nn.Module)</span></div>
                <div style={{ marginTop: 10, background: "#0f172a", borderRadius: 6, padding: "10px 14px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#94a3b8", lineHeight: 1.8 }}>
                  <div><span style={{ color: "#c4b5fd" }}>forward</span>(prev_state, prev_prev_state, forcing)</div>
                  <div style={{ paddingLeft: 16, color: "#64748b" }}># encode grid → mesh (G2M GNN)</div>
                  <div style={{ paddingLeft: 16, color: "#64748b" }}># process on mesh (processor GNNs)</div>
                  <div style={{ paddingLeft: 16, color: "#64748b" }}># decode mesh → grid (M2G GNN)</div>
                  <div style={{ paddingLeft: 16, color: "#64748b" }}># rescale delta + clamp new_state</div>
                  <div><span style={{ color: "#86efac" }}>returns</span>: (next_state <span style={{ color: "#475569" }}>(B,N,d_f)</span>, pred_std <span style={{ color: "#475569" }}>(B,N,d_f) | None</span>)</div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {["GraphLAM", "HiLAM", "HiLAMParallel"].map((m, i) => (
                    <span key={i} style={{ fontSize: 11, background: "#7c3aed22", color: "#c4b5fd", padding: "3px 10px", borderRadius: 4, border: "1px solid #7c3aed44" }}>{m}</span>
                  ))}
                  <span style={{ fontSize: 11, background: "#be185d22", color: "#f9a8d4", padding: "3px 10px", borderRadius: 4, border: "1px dashed #be185d44", fontStyle: "italic" }}>+ StochasticStepPredictor (Phase 2)</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", padding: "6px 24px" }}>
                <div style={{ flex: 1, height: 1, background: "#334155" }} />
                <div style={{ padding: "0 12px", fontSize: 11, color: "#64748b" }}>results flow back up to</div>
                <div style={{ flex: 1, height: 1, background: "#334155" }} />
              </div>

              {/* Loss */}
              <div style={{ background: "#1e2d4f", border: "1px solid #1e40af", borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 700, color: "#93c5fd", fontSize: 14 }}>ForecasterModule — Loss + Metrics</div>
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {[
                    { label: "pred_std is None", action: "→ MSE with per_var_std weighting", color: "#0891b2" },
                    { label: "pred_std is Tensor", action: "→ NLL (heteroscedastic)", color: "#7c3aed" },
                    { label: "training_phase=elbo", action: "→ KL + reconstruction (Phase 2)", color: "#be185d" },
                    { label: "training_phase=crps", action: "→ ELBO + λ·CRPS (Phase 2)", color: "#d97706" },
                  ].map((item, i) => (
                    <div key={i} style={{ background: "#0f172a", border: `1px solid ${item.color}44`, borderRadius: 6, padding: "6px 10px", fontSize: 11 }}>
                      <span style={{ color: item.color, fontWeight: 600 }}>{item.label}</span>
                      <span style={{ color: "#64748b", marginLeft: 6 }}>{item.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: FUTURE EXTENSION ── */}
        {tab === "future" && (
          <div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
              Phase 2 (Issue #62): Graph-EFM probabilistic model plugs into the hierarchy built in PR #208.
              <span style={{ color: "#86efac", marginLeft: 8 }}>Zero changes to existing deterministic models.</span>
            </div>


            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>

              {/* EnsembleForecaster */}
              <div className="card" style={{ padding: 20, borderColor: "#0891b2" }}>
                <div style={{ fontWeight: 700, color: "#67e8f9", marginBottom: 4 }}>EnsembleForecaster</div>
                <div style={{ fontSize: 11, color: "#0891b2", marginBottom: 12 }}>thin wrapper — sits at same level as ARForecaster</div>
                <div style={{ background: "#0f172a", borderRadius: 6, padding: "10px 14px", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: "#94a3b8", lineHeight: 1.8 }}>
                  <div><span style={{ color: "#67e8f9" }}>forward</span>(init_states, forcing, boundary, K=50)</div>
                  <div style={{ paddingLeft: 16, color: "#64748b" }}># fold: x = (B*K, N, d_f)</div>
                  <div style={{ paddingLeft: 16, color: "#64748b" }}># call: ARForecaster.forward(x)</div>
                  <div style={{ paddingLeft: 16, color: "#64748b" }}>#   → (B*K, T, N, d_f)</div>
                  <div style={{ paddingLeft: 16, color: "#64748b" }}># unfold: → (B, K, T, N, d_f)</div>
                  <div style={{ paddingLeft: 16, color: "#64748b" }}># StepPredictor unaware of K</div>
                  <div><span style={{ color: "#86efac" }}>returns</span>: <span style={{ color: "#f59e0b" }}>(B, K, T, N, d_f)</span></div>
                </div>
                <div style={{ marginTop: 10, padding: "6px 10px", background: "#0f172a", borderRadius: 6, fontSize: 11, color: "#64748b", borderLeft: "2px solid #0891b2" }}>
                  Batch-dim folding per Issue #335 — boundary masking remains owned by ARForecaster
                </div>
              </div>

              {/* StochasticStepPredictor */}
              <div className="card" style={{ padding: 20, borderColor: "#7c3aed" }}>
                <div style={{ fontWeight: 700, color: "#c4b5fd", marginBottom: 4 }}>StochasticStepPredictor</div>
                <div style={{ fontSize: 11, color: "#7c3aed", marginBottom: 12 }}>extends StepPredictor — abstract base for probabilistic models</div>
                <div style={{ background: "#0f172a", borderRadius: 6, padding: "10px 14px", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: "#94a3b8", lineHeight: 1.8 }}>
                  <div><span style={{ color: "#c4b5fd" }}>forward</span>(prev, prev_prev, forcing, **kwargs)</div>
                  <div style={{ paddingLeft: 16, color: "#64748b" }}># sample Z_t ~ LatentMap prior</div>
                  <div style={{ paddingLeft: 16, color: "#64748b" }}># inject Z_t at top mesh level</div>
                  <div style={{ paddingLeft: 16, color: "#64748b" }}># run deterministic predictor g</div>
                  <div><span style={{ color: "#86efac" }}>returns</span>: (next_state, <span style={{ color: "#f59e0b" }}>None</span>) <span style={{ color: "#64748b" }}># spread via ensemble K</span></div>
                </div>
              </div>

              {/* HierarchicalGraphEFM — full width, replaces LatentMap + InferenceNetwork cards */}
              <div className="card" style={{ padding: 20, borderColor: "#b45309", gridColumn: "1 / -1" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: "#fcd34d", fontSize: 14 }}>HierarchicalGraphEFM</span>
                  <span style={{ fontSize: 11, background: "#78350f", color: "#fcd34d", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>COMPLETE UNIT — single PR</span>
                </div>
                <div style={{ fontSize: 11, color: "#b45309", marginBottom: 16 }}>
                  StochasticStepPredictor implementation — LatentMap + InferenceNetwork + Predictor g designed and introduced together
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>

                  {/* LatentMap */}
                  <div style={{ background: "#0f172a", border: "1px solid #92400e", borderRadius: 8, padding: 14 }}>
                    <div style={{ fontWeight: 700, color: "#fcd34d", fontSize: 12, marginBottom: 4 }}>LatentMap</div>
                    <div style={{ fontSize: 10, color: "#78350f", marginBottom: 10 }}>GNN over top mesh level G_L</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#94a3b8", lineHeight: 1.8 }}>
                      <div><span style={{ color: "#fcd34d" }}>input</span>: (X_prev, X_prev_prev, F_t)</div>
                      <div><span style={{ color: "#86efac" }}>returns</span>: (μ_Z, σ_Z)</div>
                      <div style={{ color: "#64748b", marginTop: 4 }}># prior at inference</div>
                      <div style={{ color: "#64748b" }}># KL term at training</div>
                    </div>
                  </div>

                  {/* InferenceNetwork */}
                  <div style={{ background: "#0f172a", border: "1px solid #9d174d", borderRadius: 8, padding: 14 }}>
                    <div style={{ fontWeight: 700, color: "#f9a8d4", fontSize: 12, marginBottom: 4 }}>InferenceNetwork</div>
                    <div style={{ fontSize: 10, color: "#9d174d", marginBottom: 10 }}>VAE encoder · TRAINING ONLY</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#94a3b8", lineHeight: 1.8 }}>
                      <div><span style={{ color: "#f9a8d4" }}>input</span>: (X_prev, X_prev_prev, X_true, F_t)</div>
                      <div><span style={{ color: "#86efac" }}>returns</span>: (μ_q, σ_q)</div>
                      <div style={{ color: "#64748b", marginTop: 4 }}># posterior approx.</div>
                      <div style={{ color: "#64748b" }}># off at inference</div>
                    </div>
                  </div>

                  {/* Predictor g */}
                  <div style={{ background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 8, padding: 14 }}>
                    <div style={{ fontWeight: 700, color: "#93c5fd", fontSize: 12, marginBottom: 4 }}>Predictor g</div>
                    <div style={{ fontSize: 10, color: "#1e40af", marginBottom: 10 }}>deterministic GNN — Z_t injected at top mesh</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#94a3b8", lineHeight: 1.8 }}>
                      <div><span style={{ color: "#93c5fd" }}>step 1</span>: LatentMap → (μ_p, σ_p)</div>
                      <div><span style={{ color: "#93c5fd" }}>step 2</span>: if training: InferenceNetwork</div>
                      <div><span style={{ color: "#93c5fd" }}>step 3</span>: sample Z_t from q or p</div>
                      <div><span style={{ color: "#93c5fd" }}>step 4</span>: inject Z_t at top mesh (residual)</div>
                      <div><span style={{ color: "#93c5fd" }}>step 5</span>: downward GNN sweep</div>
                      <div><span style={{ color: "#86efac" }}>returns</span>: (next_state, None)</div>
                    </div>
                  </div>
                </div>

                {/* InteractionNet extension note */}
                <div style={{ marginTop: 16, padding: "10px 14px", background: "#0f172a", border: "1px solid #334155", borderLeft: "3px solid #16a34a", borderRadius: 6, fontSize: 11, color: "#94a3b8" }}>
                  <span style={{ color: "#86efac", fontWeight: 700 }}>InteractionNet extension</span>
                  <span style={{ color: "#64748b", marginLeft: 8 }}>·</span>
                  <span style={{ marginLeft: 8 }}>
                    PropagationNet behaviour is implemented via <span style={{ color: "#86efac", fontFamily: "monospace" }}>init_scheme="propagation"</span> on the existing InteractionNet class — no new class, no duplicated code. Forces Z_t to propagate from epoch 1 by initializing aggr_mlp to average neighboring node values at near-zero init.
                  </span>
                </div>
              </div>
            </div>

            {/* Phase 2 training protocol */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, color: "#f1f5f9", marginBottom: 16, fontFamily: "'IBM Plex Sans', sans-serif" }}>Phase 2 Training Protocol (Graph-EFM)</div>
              <div style={{ display: "flex", gap: 0, alignItems: "stretch" }}>
                {[
                  { phase: "Phase A", label: "ELBO Training", desc: "ForecasterModule activates InferenceNetwork.\nLoss = KL(q||p) + reconstruction.\nKL annealing: λ_KL 0→1 over N epochs.", color: "#7c3aed" },
                  { phase: "Phase B", label: "CRPS Fine-tune", desc: "InferenceNetwork deactivated.\nLoss = L_ELBO + λ_CRPS · L_CRPS.\nCalibrates ensemble spread.", color: "#0891b2" },
                  { phase: "Eval", label: "Metrics", desc: "CRPS (lower = better)\nSpread-Skill Ratio ≈ 1.0 (calibrated)\nRMSE (deterministic baseline)", color: "#16a34a" },
                ].map((p, i) => (
                  <div key={i} style={{ flex: 1, borderLeft: `3px solid ${p.color}`, padding: "12px 16px", marginLeft: i > 0 ? 16 : 0 }}>
                    <div style={{ fontSize: 10, color: p.color, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>{p.phase}</div>
                    <div style={{ fontSize: 13, color: "#f1f5f9", fontWeight: 700, marginBottom: 8 }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.8, whiteSpace: "pre-line" }}>{p.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding: "16px 32px", borderTop: "1px solid #1e293b", display: "flex", justifyContent: "space-between", fontSize: 11, color: "#334155" }}>
        <span>PR #208 · github.com/mllam/neural-lam/pull/208</span>
        <span>Jeevant Prakhar Singh · Sir-Sloth-The-Lazy · GSoC 2026</span>
      </div>
    </div>
  );
}