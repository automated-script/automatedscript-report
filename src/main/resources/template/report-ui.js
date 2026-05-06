
/**
 * report-ui.js
 * Automated Script Dynamic Report Renderer (Template runtime)
 * Loads ./report.json and renders widgets.
 */
(() => {
	
  
  async function loadJson() {
    const res = await fetch("./report.json", { cache: "no-store" });
    if(!res.ok) throw new Error(`Failed to load report.json (${res.status})`);
    return res.json();
  }

  // Cache chart instances so they don’t stack in memory
  const __chartCache = {};

  
 

  

  

  // ============================================================
// Detail Test Result Menu Logic (safe, non-breaking)
// ============================================================
function initDetailTestMenu(){
  const testList = document.getElementById("testList");
  
  if(!testList || !searchInput || !filtersWrap || !sortSelect) return;

  const getCards = () => Array.from(testList.querySelectorAll(".testCase"));
  const originalOrder = getCards().map(el => el.getAttribute("data-test-id") || "");

  const getCardStatus = (card) => {
    const pill = card.querySelector(".statusPill");
    const s = (pill?.textContent || "").trim().toUpperCase();
    if(s.includes("PASS")) return "PASS";
    if(s.includes("FAIL")) return "FAIL";
    if(s.includes("SKIP")) return "SKIP";
    if(s.includes("WARN")) return "WARNING";
    return s || "INFO";
  };

  const getCardText = (card) => {
    const title = card.querySelector(".tcTitle .name")?.textContent || "";
    return title.toLowerCase();
  };

  const parseDurationMs = (card) => {
    const chip = card.querySelector(".metaChip i.fa-stopwatch")?.parentElement?.textContent || "";
    const t = chip.toLowerCase();
    let ms = 0;
    const m = t.match(/(\d+)\s*m/);
    const s = t.match(/(\d+)\s*s/);
    if(m) ms += parseInt(m[1],10) * 60 * 1000;
    if(s) ms += parseInt(s[1],10) * 1000;
    return ms || 0;
  };

  let currentStatus = "ALL";
  let currentSearch = "";
  let currentSort = "EXECUTION";

  function applyFilters(){
    const cards = getCards();
    cards.forEach(card => {
      const status = getCardStatus(card);
      const text = getCardText(card);
      const statusOk = (currentStatus === "ALL") || (status === currentStatus);
      const searchOk = !currentSearch || text.includes(currentSearch);
      card.style.display = (statusOk && searchOk) ? "" : "none";
    });
    applySort();
  }

  function applySort(){
    const cards = getCards();
    const visible = cards.filter(c => c.style.display !== "none");
    const sortFn = {
      EXECUTION: (a,b) => {
        const ida = a.getAttribute("data-test-id") || "";
        const idb = b.getAttribute("data-test-id") || "";
        return originalOrder.indexOf(ida) - originalOrder.indexOf(idb);
      },
      FAIL_FIRST: (a,b) => {
        const sa = getCardStatus(a) === "FAIL" ? 0 : 1;
        const sb = getCardStatus(b) === "FAIL" ? 0 : 1;
        if(sa !== sb) return sa - sb;
        return 0;
      },
      DURATION_DESC: (a,b) => parseDurationMs(b) - parseDurationMs(a),
      DURATION_ASC: (a,b) => parseDurationMs(a) - parseDurationMs(b),
      NAME_ASC: (a,b) => getCardText(a).localeCompare(getCardText(b))
    }[currentSort] || (()=>0);

    visible.sort(sortFn).forEach(card => testList.appendChild(card));
  }

  searchClear?.addEventListener("click", () => {
    searchInput.value = "";
    currentSearch = "";
    applyFilters();
  });


  const expandCard = (c) => c.classList.add("open");
  const collapseCard = (c) => c.classList.remove("open");

 
  
  expandFailedBtn?.addEventListener("click", () => {
    getCards().forEach(c => {
      const st = getCardStatus(c);
      if(c.style.display !== "none" && st === "FAIL") expandCard(c);
      else collapseCard(c);
    });
  });

  applyFilters();
}

function updateKpis(report){
  const s = report.summary || {};
  const totalTests = s.totalTests ?? (report.tests?.length || 0);

  Utils.setText("kpiTotalTests", Utils.fmt.int(totalTests));
  Utils.setText("kpiPassed", Utils.fmt.int(s.passed ?? 0));
  Utils.setText("kpiFailed", Utils.fmt.int(s.failed ?? 0));
  Utils.setText("kpiSkipped", Utils.fmt.int(s.skipped ?? 0));
  Utils.setText("kpiTotalSteps", Utils.fmt.int(s.totalSteps ?? 0));
  Utils.setText("kpiAvgDuration", s.avgDurationHuman || s.avgDuration || "-");

  Utils.setText("dCenterTotalTests", Utils.fmt.int(totalTests));
  Utils.setText("dCenterTotalSteps", Utils.fmt.int(s.totalSteps ?? 0));
  Utils.setText("dCenterTestsPassed", Utils.fmt.pct(s.passed ?? 0, totalTests));
  const testsPassPct = Number.isFinite(s.testsPassPct) ? s.testsPassPct : null;
  Utils.setText("dCenterTestsFailed", testsPassPct !== null ? (100 - testsPassPct) + "%" : "-");

  Utils.setText("dCenterStepsPassed", Utils.fmt.pct(s.stepsPassed ?? 0, s.totalSteps ?? 0));
  const totalSteps = s.totalSteps ?? 0;
  const passedSteps = s.stepsPassed ?? 0;
  const otherSteps = Math.max(0, totalSteps - passedSteps);

  const stepsPassPct = Number.isFinite(s.stepsPassPct) ? s.stepsPassPct : null;
  Utils.setText("dCenterStepsFailed", stepsPassPct !== null ? (100 - stepsPassPct) + "%" : "-");



  // 🔥 NEW — Tests Passed count in donut header
  const elPassedCount = document.getElementById("dTestsPassedCount");
  if (elPassedCount) {
    elPassedCount.textContent = "[" + (s.passed ?? 0) + "]";
  }
  
  // 🔥 Donut header counts
  const elTestsFailed = document.getElementById("dTestsFailedCount");
  if (elTestsFailed) {
    const totalTests = s.totalTests ?? 0;
    const passedTests = s.passed ?? 0;
    const otherTests = Math.max(0, totalTests - passedTests);
    elTestsFailed.textContent = "[" + otherTests + "]";
  }


  const elStepsPassed = document.getElementById("dStepsPassedCount");
  if (elStepsPassed) {
    elStepsPassed.textContent = "[" + (s.stepsPassed ?? 0) + "]";
  }

  const elStepsFailed = document.getElementById("dStepsFailedCount");
  if (elStepsFailed) {
    const totalSteps = s.totalSteps ?? 0;
    const passedSteps = s.stepsPassed ?? 0;
    const otherSteps = Math.max(0, totalSteps - passedSteps);
    elStepsFailed.textContent = "[" + otherSteps + "]";
  }

}
    
function injectHistoryPillCss(){
  if(document.getElementById('asHistoryPillCss')) return;
  const st=document.createElement('style');
  st.id='asHistoryPillCss';
  st.textContent = `
    .testCase .tcHead{display:flex;align-items:center;justify-content:space-between;gap:12px;}
    .testCase .tcHead .left{flex:1;min-width:0;}
    .testCase .tcHead .actionsRight{display:flex;align-items:center;gap:8px;flex:0 0 auto;}
    .historyPill{white-space:nowrap!important;}
  `;
  document.head.appendChild(st);
}

function detectFlakyTests(currentReport){
  const container = document.getElementById("flakyList");
  if(!container) return;

  const history = window.__AUTOMATEDSCRIPT_HISTORY__ || {};

  const allRuns = Object.values(history).flat().slice(0,4);
  allRuns.push({ tests: currentReport.tests }); // include current

  const testMap = {};

  allRuns.forEach(run => {
    (run.tests || []).forEach(t => {
      if(!testMap[t.id]) testMap[t.id] = [];
      testMap[t.id].push(t.status);
    });
  });

  const flaky = Object.entries(testMap).filter(([id, statuses]) => {
    const unique = new Set(statuses);
    return unique.size > 1; // inconsistent outcomes
  });

  if(!flaky.length){
    container.innerHTML = `<div style="color:#9fb0ca;">No flaky tests detected 🎉</div>`;
    return;
  }

  container.innerHTML = flaky.slice(0,10).map(([id, statuses]) => `
    <div style="padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);">
      <b>${id}</b> → ${statuses.join(" → ")}
    </div>
  `).join("");
}

async function boot(){
    try{
      const report = window.__AUTOMATEDSCRIPT_REPORT__ || await loadJson();
      
	  // ================= SUITE TOTAL DURATION =================
	  try {
	    //const meta = report.meta || {};
		// ===== Suite Metadata Binding (Safe) =====
		try {
		  var meta = report.meta || {};

		  var el;

		  el = document.getElementById("metaProjectName");
		  if (el) el.textContent = meta.project || meta.projectName || "-";

		  el = document.getElementById("metaSuiteName");
		  if (el) el.textContent = meta.suiteName || "-";

		  el = document.getElementById("metaBuild");
		  if (el) el.textContent = meta.build || "-";

		  el = document.getElementById("metaExecutedBy");
		  if (el) el.textContent = meta.executedBy || "-";

		} catch (e) {
		  console.warn("Suite meta binding skipped:", e);
		}

		const start = Utils.isoToMs(meta.startTime);
	    const end = Utils.isoToMs(meta.endTime);

	    if(start && end){
	      const suiteDur = end - start;
	      const el = document.getElementById("kpiTotalDuration");
	      if(el) el.textContent = Utils.msToHMS(suiteDur);
	    }
	  } catch(e) {
	    console.warn("Suite duration calc failed", e);
	  }
	  // ========================================================
	App.init(report);
	
	// 🔥 NEW — Failure Breakdown Chart
	try {
	  Charts.failureBreakdown(report);
	} catch(e){}
	// 🔥 NEW — Failure Trend Chart
	try {
	  Charts.failureTrend(report);
	} catch(e){}

	// 🔥 Existing — Run Comparison Chart
	try {
	  const hist = window.__AUTOMATEDSCRIPT_HISTORY__ || {};
	  const lastRun = Object.values(hist)[0]?.[0];

	  if(lastRun?.summary){
	    Charts.comparison(report.summary, lastRun.summary);
	  }
	} catch(e){}

	try {
	  detectFlakyTests(report);
	} catch(e){}

	try {
	  const hist = window.__AUTOMATEDSCRIPT_HISTORY__ || {};
	  const lastRun = Object.values(hist)[0]?.[0]; // latest previous

	  if(lastRun?.summary){
	    Charts.comparison(report.summary, lastRun.summary);
	  }
	} catch(e){}

      
    }catch(err){
      console.error(err);
      const holder = document.getElementById("testList");
      if(holder){
        holder.innerHTML = `<div style="padding:14px;border:1px solid rgba(255,255,255,.10);border-radius:16px;background:rgba(0,0,0,.2);">
          <div style="font-weight:1000;">Report failed to load</div>
          <div style="color:#9fb0ca;font-weight:850;margin-top:6px;">${String(err.message||err)}</div>
          <div style="color:#9fb0ca;font-weight:850;margin-top:10px;">Tip: Open report through a local server (or via the jar tool).</div>
        </div>`;
      }
    }
  }
  function ensureTestDrawer(){
    if(document.getElementById("testDrawer")) return;

    const drawer = document.createElement("div");
    drawer.id = "testDrawer";
    drawer.innerHTML = `
      <div class="tdHeader">
        <div>
          <div id="tdTitle" class="tdTitle">Test Details</div>
          <div id="tdMeta" class="tdMeta"></div>
        </div>
        <button id="tdClose">✕</button>
      </div>
      <div id="tdBody" class="tdBody"></div>
    `;
    document.body.appendChild(drawer);

	document.getElementById("tdClose").onclick = () => {
	  drawer.classList.remove("open");
	  drawerSteps = [];
	  drawerIndex = 0;
	};

  }
  let drawerSteps = [];
  let drawerIndex = 0;
  const STEP_BATCH = 40;

  function openTestDrawer(test){
    ensureTestDrawer();
    const drawer = document.getElementById("testDrawer");
    drawer.classList.add("open");

    document.getElementById("tdTitle").textContent = `${test.id} — ${test.name}`;
    document.getElementById("tdMeta").textContent =
      `Status: ${test.status} | Duration: ${Utils.msToHMS(test.durationMs)}`;

	  drawerSteps = test.steps || [];
	  drawerIndex = 0;

	  document.getElementById("tdBody").innerHTML = `
	    <table class="tdTable">
	      <thead>
	        <tr><th>Time</th><th>Status</th><th>Action</th><th>Details</th></tr>
	      </thead>
	      <tbody id="tdStepsBody"></tbody>
	    </table>
	  `;

	  renderStepBatch();

	  const body = document.getElementById("tdBody");
	  body.onscroll = handleDrawerScroll;


  window.openTestDrawer = openTestDrawer;

  window.addEventListener("DOMContentLoaded", () => { 
    try{injectHistoryPillCss();}catch(e){} 
    boot();

    // ================= SCREENSHOT MODAL HANDLER =================
    document.addEventListener("click", function(e){

      // Open modal when clicking screenshot chip
      const thumb = e.target.closest(".ssThumb");
      if(thumb){
        const src = thumb.getAttribute("data-src");
        const modal = document.getElementById("imgModal");
        const img = document.getElementById("imgModalSrc");

        if(modal && img){
          img.src = src;
          modal.style.display = "flex";
        }
        return;
      }

      // Close modal when clicking close button OR outside image
      if(e.target.classList.contains("imgClose") || e.target.id === "imgModal"){
        const modal = document.getElementById("imgModal");
        if(modal) modal.style.display = "none";
      }

    });
  });

})();

function renderStepBatch(){
  const tbody = document.getElementById("tdStepsBody");
  if(!tbody) return;

  const slice = drawerSteps.slice(drawerIndex, drawerIndex + STEP_BATCH);

  const html = slice.map(s => `
    <tr>
      <td>${Utils.escapeHtml(s.time)}</td>
      <td>${Utils.escapeHtml(s.status)}</td>
      <td>${Utils.escapeHtml(s.action)}</td>
      <td>${Utils.escapeHtml(s.details)}</td>
    </tr>
  `).join("");

  tbody.insertAdjacentHTML("beforeend", html);
  drawerIndex += STEP_BATCH;
}

function handleDrawerScroll(e){
  const el = e.target;
  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;

  if(nearBottom && drawerIndex < drawerSteps.length){
    renderStepBatch();
  }
}


// ===== History UI (Last 3 Runs) =====
function getHistoryForTest(testId){
  const h = window.__AUTOMATEDSCRIPT_HISTORY__ || {};
  return h[testId] || [];
}

function ensureHistoryDrawer(){
  if(document.getElementById("historyDrawer")) return;
  const drawer = document.createElement("div");
  drawer.id="historyDrawer";
  drawer.style.cssText="position:fixed;top:0;right:-420px;width:420px;height:100vh;background:#0b0f1a;border-left:1px solid rgba(255,255,255,.08);z-index:9999;transition:all .25s ease;box-shadow:-20px 0 40px rgba(0,0,0,.35);overflow:auto;";
  drawer.innerHTML = `
    <div style="padding:18px 16px;position:sticky;top:0;background:#0b0f1a;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:space-between;">
      <div>
        <div id="histTitle" style="font-weight:700;font-size:14px;color:#e8eeff;">History</div>
        <div id="histSub" style="font-size:12px;color:rgba(255,255,255,.6);margin-top:2px;">Last 3 runs</div>
      </div>
      <button id="histClose" style="background:rgba(255,255,255,.08);border:0;color:#fff;padding:8px 10px;border-radius:10px;cursor:pointer;">Close</button>
    </div>
    <div id="histBody" style="padding:14px 16px;"></div>
  `;
  document.body.appendChild(drawer);
  drawer.querySelector("#histClose").onclick=()=>drawer.style.right="-420px";
}

function openHistoryDrawer(test){
  ensureHistoryDrawer();
  const drawer = document.getElementById("historyDrawer");
  drawer.style.right="0px";
  document.getElementById("histTitle").textContent = test.id + " — " + test.name;
  const rows = getHistoryForTest(test.id);
  const body = document.getElementById("histBody");
  if(!rows.length){
    body.innerHTML = `<div style="color:rgba(255,255,255,.7);font-size:13px;">No history found for this Test ID yet.</div>`;
    return;
  }
  body.innerHTML = rows.map(r=>`
    <div style="border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:12px 12px;margin-bottom:12px;background:rgba(255,255,255,.03);">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
        <div style="font-weight:700;color:#e8eeff;font-size:13px;">${r.runId}</div>
        <span style="font-size:11px;padding:4px 8px;border-radius:999px;background:rgba(255,255,255,.08);color:#fff;">${r.status}</span>
      </div>
      <div style="margin-top:8px;font-size:12px;color:rgba(255,255,255,.65);">
        Suite: <b style="color:#fff;">${r.suite||"-"}</b>
      </div>
      ${r.firstFailure?`<div style="margin-top:8px;font-size:12px;color:rgba(255,255,255,.65);">First failure: <span style="color:#fff;">${Utils.escapeHtmlGlobal(r.firstFailure)}</span></div>`:""}
      <div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap;">
        <a href="../${r.reportPath}" target="_blank" style="text-decoration:none;color:#fff;background:rgba(255,255,255,.08);padding:8px 10px;border-radius:10px;font-size:12px;">Open Report</a>
        ${r.defectId?`<span style="color:rgba(255,255,255,.7);font-size:12px;">Defect: <b style="color:#fff;">${r.defectId}</b></span>`:""}
      </div>
    </div>
  `).join("");
}







// Global helper for History Drawer



/* ===============================
   HISTORY CLICK FIX FINAL
   =============================== */
// Expose for delegated clicks (safety)
try { window.openHistoryDrawer = openHistoryDrawer; } catch(e) {}
try { window.ensureHistoryDrawer = ensureHistoryDrawer; } catch(e) {}



function formatDuration(ms){
  if(ms==null) return "-";
  const sec=Math.round(ms/1000);
  if(sec<60) return sec+"s";
  const m=Math.floor(sec/60), r=sec%60;
  return m+"m "+r+"s";
}

function updateMetaChips(meta){
  const by=document.getElementById('metaExecutedBy');
  if(by) by.textContent = meta?.executedBy || "-";
  const su=document.getElementById('metaSuiteName');
  if(su) su.textContent = meta?.suiteName || "-";
}

function updateStatusSplitCenter(summary){
  const el=document.getElementById('statusSplitCenter');
  if(!el||!summary) return;
  const total=summary.totalTests||0;
  const passed=summary.passed||0;
  el.textContent = (total?Math.round((passed/total)*100):0) + "%";
}
const style = document.createElement("style");
style.textContent = `
#testDrawer{
  position:fixed; right:-520px; top:0; width:520px; height:100%;
  background:#0f172a; color:#e2e8f0;
  box-shadow:-10px 0 40px rgba(0,0,0,.5);
  transition:right .3s ease;
  z-index:9999; display:flex; flex-direction:column;
}
#testDrawer.open{ right:0; }
.tdHeader{ display:flex; justify-content:space-between; padding:16px; border-bottom:1px solid rgba(255,255,255,.08); }
.tdBody{ overflow:auto; padding:16px; }
.tdTable{ width:100%; border-collapse:collapse; font-size:13px; }
.tdTable td, .tdTable th{ padding:8px; border-bottom:1px solid rgba(255,255,255,.05); }
#tdClose{ background:none; border:none; color:#fff; font-size:18px; cursor:pointer; }
`;
document.head.appendChild(style);


