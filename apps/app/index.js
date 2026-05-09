const express = require("express");
const { marked } = require("marked");
const { prisma } = require("@pis/db");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "healthy" });
});

// ── Template listing ────────────────────────────────────────────

app.get("/app/templates", async (_req, res, next) => {
  try {
    const briefs = await prisma.brief.findMany({
      orderBy: [{ isoweek: "desc" }, { industry: "asc" }],
      take: 50,
      include: { scout: true },
    });
    res.json(briefs);
  } catch (err) {
    next(err);
  }
});

// ── Template detail page ────────────────────────────────────────

app.get("/app/templates/:id", async (req, res, next) => {
  try {
    const brief = await prisma.brief.findUnique({
      where: { id: req.params.id },
      include: {
        scout: true,
        citations: { orderBy: { citeId: "asc" } },
        deliveries: { include: { subscriber: true } },
      },
    });

    if (!brief) {
      res.status(404).send(pageShell("Not Found", "<p>Template not found.</p>"));
      return;
    }

    const html = renderTemplateDetail(brief);
    res.send(pageShell(`Brief ${brief.industry} W${brief.isoweek} · Prin7r`, html));
  } catch (err) {
    next(err);
  }
});

// ── Schedule page ───────────────────────────────────────────────

app.get("/app/schedule", async (_req, res, next) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: {
        status: { in: ["queued", "scheduled", "sending", "sent", "paused", "failed"] },
      },
      orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { openedAt: "asc" }],
      include: { subscriber: true },
    });

    res.send(pageShell("Schedule · Prin7r", renderSchedule(tickets)));
  } catch (err) {
    next(err);
  }
});

app.post("/app/schedule/reorder", async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: "ids array required" });

    await prisma.$transaction(
      ids.map((id, i) =>
        prisma.ticket.update({ where: { id }, data: { sortOrder: i } })
      )
    );

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.post("/app/schedule/:id/pause", async (req, res, next) => {
  try {
    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: { status: "paused" },
    });
    res.json(ticket);
  } catch (err) {
    next(err);
  }
});

app.post("/app/schedule/:id/resume", async (req, res, next) => {
  try {
    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: { status: "queued", scheduledAt: null },
    });
    res.json(ticket);
  } catch (err) {
    next(err);
  }
});

app.post("/app/schedule/:id/schedule", async (req, res, next) => {
  try {
    const { scheduledAt } = req.body;
    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: { status: "scheduled", scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date() },
    });
    res.json(ticket);
  } catch (err) {
    next(err);
  }
});

app.post("/app/schedule/:id/send", async (req, res, next) => {
  try {
    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: { status: "sending" },
    });
    res.json(ticket);
  } catch (err) {
    next(err);
  }
});

// ── Start ───────────────────────────────────────────────────────

app.listen(PORT, "0.0.0.0", () => {
  console.log(`saltrun listening on port ${PORT}`);
});

// ── HTML helpers ─────────────────────────────────────────────────

function pageShell(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;0,8..60,700;1,8..60,400;1,8..60,600&family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
*,::before,::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inter,-apple-system,sans-serif;background:#FAFAF8;color:#11110F;line-height:1.65}
a{color:#7A1F2B;text-decoration:none}
a:hover{color:#5C171F}
.mx{max-width:740px;margin:0 auto;padding:0 24px}

/* nav */
nav{background:#FFFFFF;border-bottom:1px solid #E6E2D9;padding:12px 0}
nav .inner{max-width:740px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between}
nav .logo{font-family:"Source Serif 4",serif;font-weight:600;font-size:18px;color:#11110F}
nav .logo span{color:#7A1F2B}

/* metadata bar */
.meta{background:#FFFFFF;border-bottom:1px solid #E6E2D9;padding:24px 0}
.badge{display:inline-block;font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8A867E;border:1px solid #E6E2D9;padding:4px 10px}
.badge.status-signed{border-color:#7A1F2B;color:#7A1F2B}
.badge.status-draft{color:#8A867E}
.sig{font-family:"Source Serif 4",serif;font-style:italic;color:#5C5A55;font-size:15px;margin-top:12px}

/* tabs — ShadCN style (Overview / Steps / Roles) */
.tabs{margin-top:32px}
.tab-list{display:flex;border-bottom:1px solid #E6E2D9;gap:0}
.tab-trigger{font-family:Inter,sans-serif;font-size:14px;font-weight:500;padding:10px 20px;background:none;border:none;border-bottom:2px solid transparent;color:#5C5A55;cursor:pointer;transition:color .15s,border-color .15s}
.tab-trigger:hover{color:#11110F}
.tab-trigger.active{color:#11110F;border-bottom-color:#11110F}
.tab-panel{display:none;padding:32px 0}
.tab-panel.active{display:block}

/* overview */
.overview-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.overview-item{border:1px solid #E6E2D9;padding:16px;background:#FFFFFF}
.overview-label{font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8A867E;margin-bottom:4px}
.overview-value{font-size:16px;font-weight:500}

/* steps */
.md-body{font-family:"Source Serif 4",serif;font-size:17px;line-height:1.7;color:#11110F}
.md-body h1{font-size:24px;font-weight:600;margin-bottom:24px;line-height:1.25}
.md-body h2{font-size:18px;font-weight:600;margin-top:32px;margin-bottom:12px;color:#5C5A55;text-transform:uppercase;font-family:Inter,sans-serif;font-size:12px;letter-spacing:.14em}
.md-body p{margin-bottom:16px}
.md-body strong{font-weight:600}

/* citations */
.cite-list{margin-top:32px;border-top:1px solid #E6E2D9;padding-top:24px}
.cite-title{font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8A867E;margin-bottom:16px}
.cite-item{display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #F2EFE7;font-size:14px}
.cite-id{font-family:"JetBrains Mono",monospace;font-size:11px;color:#8A867E;white-space:nowrap;min-width:110px}
.cite-link{color:#11110F;font-weight:500}

/* roles */
.role-card{border:1px solid #E6E2D9;padding:20px;background:#FFFFFF;margin-bottom:12px}
.role-name{font-family:"Source Serif 4",serif;font-weight:600;font-size:18px}
.role-meta{font-family:"JetBrains Mono",monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8A867E;margin-top:4px}
.empty-state{color:#5C5A55;font-style:italic;padding:24px 0}

/* footer */
footer{border-top:1px solid #E6E2D9;padding:24px 0;margin-top:64px;font-size:13px;color:#8A867E}
footer .inner{max-width:740px;margin:0 auto;padding:0 24px}

/* schedule table */
.schedule-table-wrap{overflow-x:auto;background:#FFFFFF;border:1px solid #E6E2D9}
.schedule-table{width:100%;border-collapse:collapse;font-size:14px}
.schedule-table thead{border-bottom:2px solid #E6E2D9}
.schedule-table th{text-align:left;padding:10px 12px;font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8A867E;font-weight:500}
.schedule-table td{padding:10px 12px;border-bottom:1px solid #F2EFE7;vertical-align:middle}
.ticket-row{cursor:grab;transition:background .12s}
.ticket-row:hover{background:#FAFAF8}
.ticket-row.dragging{opacity:.5;background:#F2EFE7}
.ticket-row.drag-over{border-top:2px solid #7A1F2B}
.ticket-row.paused{opacity:.55}
.drag-handle{cursor:grab;color:#C4BFB0;font-size:18px;text-align:center;user-select:none;padding:10px 8px !important}
.cell-id{font-family:'JetBrains Mono',monospace;font-size:11px;color:#8A867E}
.body-text{font-weight:500;line-height:1.4}
.body-meta{font-size:12px;color:#8A867E;margin-top:2px}
.cell-scheduled{font-size:12px;color:#5C5A55;white-space:nowrap}
.empty-cell{padding:32px 12px !important;text-align:center;color:#8A867E;font-style:italic}

.badge.status-queued{color:#7C6F03;border-color:#E8DC6A;background:#FDFBEE}
.badge.status-scheduled{color:#2B5C8F;border-color:#9AC1E8;background:#EDF4FA}
.badge.status-sending{color:#7A1F2B;border-color:#D4858F;background:transparent}
.badge.status-sent{color:#2D6A3F;border-color:#8CC49A;background:#EDF7EF}
.badge.status-paused{color:#8A867E;border-color:#D6D2C8;background:transparent}
.badge.status-failed{color:#991B1B;border-color:#FCA5A5;background:#FEF2F2}

/* switch */
.switch{position:relative;display:inline-block;width:36px;height:20px}
.switch input{opacity:0;width:0;height:0}
.slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:#D6D2C8;border-radius:20px;transition:background .2s}
.slider::before{content:"";position:absolute;height:14px;width:14px;left:3px;bottom:3px;background:#FFFFFF;border-radius:50%;transition:transform .2s}
.switch input:checked+.slider{background:#7A1F2B}
.switch input:checked+.slider::before{transform:translateX(16px)}

.btn-schedule{font-family:Inter,sans-serif;font-size:12px;font-weight:500;padding:4px 10px;background:#FFFFFF;border:1px solid #7A1F2B;color:#7A1F2B;cursor:pointer;border-radius:4px;margin-left:8px}
.btn-schedule:hover{background:#7A1F2B;color:#FFFFFF}

.btn-secondary{font-family:Inter,sans-serif;font-size:12px;font-weight:500;padding:6px 14px;background:#FFFFFF;border:1px solid #D6D2C8;color:#5C5A55;cursor:pointer;border-radius:4px}
.btn-secondary:hover{background:#F2EFE7}

.cell-actions{white-space:nowrap}
</style>
</head>
<body>
<nav><div class="inner">
<a href="/app/templates" class="logo">Prin<span>7</span>r</a>
<div style="display:flex;align-items:center;gap:20px">
<a href="/app/schedule" style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8A867E;text-decoration:none">Schedule</a>
<a href="/app/templates" style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8A867E;text-decoration:none">Templates</a>
</div>
</div></nav>
${body}
<footer><div class="inner">Prin7r · Personal Industry Scout · Confidential</div></footer>
<script>
document.querySelectorAll('.tab-trigger').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.tab-trigger').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});
</script>
</body>
</html>`;
}

function renderTemplateDetail(brief) {
  const statusClass = brief.status === "signed" ? "status-signed" : "status-draft";
  const signedAt = brief.signedAt
    ? new Date(brief.signedAt).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Not signed";

  // Parse week label
  const weekLabel = `Week ${String(brief.isoweek).slice(-2)}, ${String(brief.isoweek).slice(0, 4)}`;

  return `
<div class="meta">
  <div class="mx">
    <span class="badge ${statusClass}">${brief.status.toUpperCase()}</span>
    <span class="badge" style="margin-left:8px">${escapeHtml(brief.industry)}</span>
    <span class="badge" style="margin-left:8px">${weekLabel}</span>
    <div class="sig">Signed by ${escapeHtml(brief.scout.name)} &mdash; ${signedAt}</div>
  </div>
</div>

<div class="mx">
  <div class="tabs">
    <div class="tab-list">
      <button class="tab-trigger active" data-tab="overview">Overview</button>
      <button class="tab-trigger" data-tab="steps">Steps</button>
      <button class="tab-trigger" data-tab="roles">Roles</button>
    </div>

    <div id="overview" class="tab-panel active">
      <div class="overview-grid">
        <div class="overview-item">
          <div class="overview-label">Industry</div>
          <div class="overview-value">${escapeHtml(brief.industry)}</div>
        </div>
        <div class="overview-item">
          <div class="overview-label">ISO Week</div>
          <div class="overview-value">${brief.isoweek}</div>
        </div>
        <div class="overview-item">
          <div class="overview-label">Status</div>
          <div class="overview-value">${escapeHtml(brief.status)}</div>
        </div>
        <div class="overview-item">
          <div class="overview-label">Scout</div>
          <div class="overview-value">${escapeHtml(brief.scout.name)}</div>
        </div>
        <div class="overview-item">
          <div class="overview-label">Signed</div>
          <div class="overview-value">${signedAt}</div>
        </div>
        <div class="overview-item">
          <div class="overview-label">Deliveries</div>
          <div class="overview-value">${brief.deliveries.length}</div>
        </div>
      </div>
    </div>

    <div id="steps" class="tab-panel">
      <div class="md-body">
        ${marked.parse(brief.bodyMd)}
      </div>
    </div>

    <div id="roles" class="tab-panel">
      <div class="role-card">
        <div class="role-name">${escapeHtml(brief.scout.name)}</div>
        <div class="role-meta">Scout &middot; ${escapeHtml(brief.scout.industryFocus)}</div>
        <p style="margin-top:8px;font-size:14px;color:#5C5A55">Authored and signed this brief. Responsible for editorial accuracy and citation verification.</p>
      </div>

      ${brief.citations.length > 0 ? `
      <div class="cite-list">
        <div class="cite-title">Citations (${brief.citations.length})</div>
        ${brief.citations.map(c => `
        <div class="cite-item">
          <span class="cite-id">${escapeHtml(c.citeId)}</span>
          <a class="cite-link" href="${escapeHtml(c.url)}" target="_blank" rel="noopener">${escapeHtml(c.title)}</a>
        </div>
        `).join("")}
      </div>
      ` : '<p class="empty-state">No citations.</p>'}

      ${brief.deliveries.length > 0 ? `
      <div class="cite-list">
        <div class="cite-title">Delivered to (${brief.deliveries.length})</div>
        ${brief.deliveries.map(d => `
        <div class="cite-item">
          <span class="cite-id">${d.channel}</span>
          <span>${escapeHtml(d.subscriber.email)}</span>
        </div>
        `).join("")}
      </div>
      ` : ""}
    </div>
  </div>
</div>`;
}

function renderSchedule(tickets) {
  const statusLabel = {
    queued: "Queued",
    scheduled: "Scheduled",
    sending: "Sending",
    sent: "Sent",
    paused: "Paused",
    failed: "Failed",
  };

  const statusClass = {
    queued: "status-queued",
    scheduled: "status-scheduled",
    sending: "status-sending",
    sent: "status-sent",
    paused: "status-paused",
    failed: "status-failed",
  };

  const rows = tickets.length === 0
    ? `<tr><td colspan="5" class="empty-cell">No queued or scheduled tickets.</td></tr>`
    : tickets.map((t, i) => {
        const paused = t.status === "paused";
        const isMutable = t.status === "queued" || t.status === "scheduled" || t.status === "paused";
        const scheduledStr = t.scheduledAt
          ? new Date(t.scheduledAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
          : "—";
        const openedStr = new Date(t.openedAt).toLocaleDateString("en-US", { dateStyle: "medium" });
        const truncated = t.body.length > 80 ? t.body.slice(0, 80) + "…" : t.body;

        return `
        <tr class="ticket-row${paused ? " paused" : ""}" draggable="true" data-id="${escapeHtml(t.id)}" data-status="${escapeHtml(t.status)}">
          <td class="drag-handle" title="Drag to reorder">⠿</td>
          <td class="cell-id">${escapeHtml(t.id.slice(0, 8))}</td>
          <td class="cell-body">
            <div class="body-text">${escapeHtml(truncated)}</div>
            <div class="body-meta">${escapeHtml(t.subscriber.email)} · ${openedStr}</div>
          </td>
          <td><span class="badge ${statusClass[t.status]}">${statusLabel[t.status]}</span></td>
          <td class="cell-scheduled">${scheduledStr}</td>
          <td class="cell-actions">
            ${isMutable ? `
            <label class="switch" title="${paused ? "Resume" : "Pause"}">
              <input type="checkbox" class="pause-toggle" data-id="${escapeHtml(t.id)}" ${paused ? "" : "checked"}>
              <span class="slider"></span>
            </label>
            ` : ""}
            ${t.status === "queued" ? `
            <button class="btn-schedule" data-id="${escapeHtml(t.id)}">Schedule now</button>
            ` : ""}
          </td>
        </tr>`;
      }).join("");

  return `
<div class="mx" style="padding-top:24px">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
    <div>
      <h1 style="font-family:'Source Serif 4',serif;font-size:28px;font-weight:600">Schedule</h1>
      <p style="color:#5C5A55;font-size:14px;margin-top:4px">${tickets.length} ticket${tickets.length !== 1 ? "s" : ""} in queue</p>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn-secondary" id="refresh-btn">Refresh</button>
    </div>
  </div>

  <div class="schedule-table-wrap">
    <table class="schedule-table" id="schedule-table">
      <thead>
        <tr>
          <th style="width:32px"></th>
          <th style="width:80px">ID</th>
          <th>Message</th>
          <th style="width:100px">Status</th>
          <th style="width:160px">Scheduled</th>
          <th style="width:100px">Action</th>
        </tr>
      </thead>
      <tbody id="ticket-tbody">
        ${rows}
      </tbody>
    </table>
  </div>
</div>

<script>
(function(){
  const tbody = document.getElementById("ticket-tbody");
  let dragSrc = null;

  tbody.addEventListener("dragstart", e => {
    const row = e.target.closest("tr.ticket-row");
    if (!row) return;
    dragSrc = row;
    row.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", row.dataset.id);
  });

  tbody.addEventListener("dragend", e => {
    const row = e.target.closest("tr.ticket-row");
    if (row) row.classList.remove("dragging");
    dragSrc = null;
    document.querySelectorAll(".drag-over").forEach(r => r.classList.remove("drag-over"));
  });

  tbody.addEventListener("dragover", e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const row = e.target.closest("tr.ticket-row");
    if (row && row !== dragSrc) {
      document.querySelectorAll(".drag-over").forEach(r => r.classList.remove("drag-over"));
      row.classList.add("drag-over");
    }
  });

  tbody.addEventListener("drop", e => {
    e.preventDefault();
    const row = e.target.closest("tr.ticket-row");
    if (!row || row === dragSrc || !dragSrc) return;
    document.querySelectorAll(".drag-over").forEach(r => r.classList.remove("drag-over"));

    const rows = [...tbody.querySelectorAll("tr.ticket-row")];
    const srcIdx = rows.indexOf(dragSrc);
    const dstIdx = rows.indexOf(row);
    if (srcIdx < dstIdx) {
      tbody.insertBefore(dragSrc, row.nextSibling);
    } else {
      tbody.insertBefore(dragSrc, row);
    }

    const ids = [...tbody.querySelectorAll("tr.ticket-row")].map(r => r.dataset.id);
    fetch("/app/schedule/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
  });

  tbody.addEventListener("click", e => {
    const toggle = e.target.closest(".pause-toggle");
    if (toggle) {
      const id = toggle.dataset.id;
      const paused = !toggle.checked;
      const url = paused ? "/app/schedule/" + id + "/pause" : "/app/schedule/" + id + "/resume";
      fetch(url, { method: "POST" })
        .then(r => r.json())
        .then(() => { location.reload(); });
      return;
    }

    const schedBtn = e.target.closest(".btn-schedule");
    if (schedBtn) {
      const id = schedBtn.dataset.id;
      fetch("/app/schedule/" + id + "/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: new Date().toISOString() }),
      })
        .then(r => r.json())
        .then(() => { location.reload(); });
      return;
    }
  });

  document.getElementById("refresh-btn").addEventListener("click", () => {
    location.reload();
  });
})();
</script>`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
