window.Events = (function(){

  function init(){
    bindHistory();
    bindFilters();
    bindExpandControls();
  }

  // ================= HISTORY =================
  function bindHistory(){
    document.addEventListener("click", function(e){
		const cardHead = e.target.closest(".testCase .tcHead");
		if(cardHead){
		  const card = cardHead.closest(".testCase");
		  const testId = card?.getAttribute("data-test-id");
		  if(!testId) return;

		  const tests = window.App?.report?.tests || [];
		  const test = tests.find(t => t.id === testId);
		  if(test && window.openTestDrawer){
		    e.preventDefault();
		    e.stopPropagation();
		    window.openTestDrawer(test);
		  }
		}

      const btn = e.target.closest("[data-action='history']");
      if(!btn) return;

      e.preventDefault();
      e.stopPropagation();

      const card = btn.closest("[data-test-id]");
      const testId = card?.getAttribute("data-test-id");
      if(!testId) return;

      const tests = window.App?.report?.tests || [];
      const test = tests.find(t => t.id === testId);
      if(test && window.openHistoryDrawer){
        window.openHistoryDrawer(test);
      }
    }, true);
  }

  // ================= FILTER / SEARCH =================
  function bindFilters(){
    const search = document.getElementById("dtSearchInput");
    if(search){
      search.addEventListener("input", () => {
        const val = search.value.toLowerCase();
        document.querySelectorAll(".testCase").forEach(c=>{
          const name = c.querySelector(".name")?.textContent.toLowerCase() || "";
          c.style.display = name.includes(val) ? "" : "none";
        });
      });
    }
  }

  // ================= EXPAND CONTROLS =================
  function bindExpandControls(){
    const expandAll = document.getElementById("dtExpandAll");
    const collapseAll = document.getElementById("dtCollapseAll");

    expandAll?.addEventListener("click", ()=>{
      document.querySelectorAll(".testCase").forEach(c=>c.classList.add("open"));
    });

    collapseAll?.addEventListener("click", ()=>{
      document.querySelectorAll(".testCase").forEach(c=>c.classList.remove("open"));
    });
  }

  return { init };

})();
