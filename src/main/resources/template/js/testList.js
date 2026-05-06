window.TestList = (function(){
	let allTests = [];
	let container, spacerTop, spacerBottom;

	const ROW_HEIGHT = 110; // average card height
	const BUFFER = 5;       // extra rows above & below viewport

  function renderEvidence(ev){
    if(!ev) return "";
    const ss = Array.isArray(ev.screenshots) ? ev.screenshots : [];
    const video = ev.video || "";
    if(!ss.length && !video) return "";

    const pills = [];
    ss.slice(0,3).forEach((s,i)=>{
      const url = (s.url || s.pathOrUrl || "").trim();
      if(url) 	  pills.push(`<span class="metaChip ssThumb" data-src="${url}">
	    <i class="fa-solid fa-image"></i> Shot ${i+1}
	  </span>`);

    });
    if(video) pills.push(`<a class="metaChip" href="${video}" target="_blank"><i class="fa-solid fa-video"></i> Video</a>`);

    return `<div class="meta" style="margin-top:10px;">${pills.join("")}</div>`;
  }

  function iconFor(status){
    const s = String(status||"").toUpperCase();
    if(s==="PASS") return `<span class="sIcon pass"><i class="fa-solid fa-check"></i></span>`;
    if(s==="FAIL") return `<span class="sIcon fail"><i class="fa-solid fa-xmark"></i></span>`;
    if(s==="SKIP") return `<span class="sIcon skip"><i class="fa-solid fa-forward"></i></span>`;
    if(s==="WARNING"||s==="WARN") return `<span class="sIcon warn"><i class="fa-solid fa-triangle-exclamation"></i></span>`;
    return `<span class="sIcon"><i class="fa-solid fa-circle-info"></i></span>`;
  }

  function loadEvidence(cell){
    if(!cell.dataset.ev) return;

    try{
      const ev = JSON.parse(cell.dataset.ev);
      if(!ev) return;

      cell.insertAdjacentHTML("beforeend", renderEvidence(ev));
      cell.removeAttribute("data-ev"); // prevent double load
    }catch(e){}
  }

  function pill(status){
    const s = String(status||"INFO").toUpperCase();
    const cls = s==="PASS" ? "pass" :
                s==="FAIL" ? "fail" :
                s==="SKIP" ? "skip" : "warn";
    return `<span class="statusPill ${cls}">${s}</span>`;
  }

 function render(report){
  container = document.getElementById("testList");
  if(!container) return;

  allTests = report.tests || [];
  if(!allTests.length){
    container.innerHTML = `<div style="color:#9fb0ca;font-weight:900;padding:10px 2px;">No tests in this run.</div>`;
    return;
  }

  container.innerHTML = `
    <div id="vtSpacerTop"></div>
    <div id="vtVisible"></div>
    <div id="vtSpacerBottom"></div>
  `;

  spacerTop = document.getElementById("vtSpacerTop");
  spacerBottom = document.getElementById("vtSpacerBottom");

  container.addEventListener("scroll", onScroll);
  onScroll(); // first render
}

function onScroll(){
  const scrollTop = container.scrollTop;
  const height = container.clientHeight;

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
  const visibleCount = Math.ceil(height / ROW_HEIGHT) + BUFFER * 2;
  const endIndex = Math.min(allTests.length, startIndex + visibleCount);

  renderSlice(startIndex, endIndex);

  spacerTop.style.height = (startIndex * ROW_HEIGHT) + "px";
  spacerBottom.style.height = ((allTests.length - endIndex) * ROW_HEIGHT) + "px";
}
function renderSlice(start, end){
  const holder = document.getElementById("vtVisible");

  const html = allTests.slice(start, end).map(t => {

    const dur = t.durationMs != null ? Utils.msToHMS(t.durationMs) : "00:00:00";

    const steps = (t.steps||[]).map(s => `
      <tr>
        <td>${Utils.escapeHtml(s.time ?? "")}</td>
        <td>${iconFor(s.status)}</td>
        <td class="stepName">${Utils.escapeHtml(s.action || "")}</td>
        <td data-ev='${JSON.stringify(s.evidence || {})}'>
          ${Utils.escapeHtml(s.details || "")}
        </td>
      </tr>
    `).join("");

    return `
    <div class="testCase ${t.status.toLowerCase()}" data-test-id="${Utils.escapeHtml(t.id)}">
      <div class="tcHead">
        <div class="left">
          ${pill(t.status)}
          <div class="tcTitle">
            <div class="name">${Utils.escapeHtml(t.id)} — ${Utils.escapeHtml(t.name)}</div>
            <div class="meta">
              <span class="metaChip"><i class="fa-solid fa-stopwatch"></i> ${dur}</span>
            </div>
          </div>
        </div>
        <button class="expandBtn"><i class="fa-solid fa-chevron-down"></i></button>
      </div>
      <div class="tcBody">
        <table><tbody>${steps}</tbody></table>
      </div>
    </div>`;
  }).join("");

  holder.innerHTML = html;
}


  return { render };

})();
