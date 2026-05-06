window.Charts = (function(){

  const instances = {}; // prevent memory leaks
  const observers = {};

  const tooltip = {
    backgroundColor: "rgba(7,10,18,.95)",
    borderColor: "rgba(255,255,255,.10)",
    borderWidth: 1,
    titleColor: "#eaf1ff",
    bodyColor: "#cfe0ff",
    padding: 12
  };

  function destroy(id){
    if(instances[id]){
      instances[id].destroy();
      delete instances[id];
    }
  }

  function donut(id, data, colors, cutout="78%"){
    const el = document.getElementById(id);
    if(!el) return;

	if(instances[id]){
	  instances[id].data.datasets[0].data = data;
	  instances[id].update();
	  return;
	}

    instances[id] = new Chart(el, {
      type:"doughnut",
      data:{ datasets:[{ data, backgroundColor: colors, borderWidth:0, cutout }]},
      options:{
        responsive:true,
        maintainAspectRatio:true,
        plugins:{ legend:{display:false}, tooltip }
      }
    });
	if(!observers[id]){
	  observers[id] = new ResizeObserver(() => {
	    if(document.visibilityState === "visible"){
	      instances[id]?.resize();
	    }
	  });
	  observers[id].observe(el.parentElement);
	}


  }

  function statusSplit(report){
    const el = document.getElementById("donutStatus");
    if(!el) return;

    const s = report.summary || {};
    const data = [
      s.passed ?? 0,
      s.failed ?? 0,
      s.skipped ?? 0,
      s.warning ?? 0
    ];

	if(instances["donutStatus"]){
	  instances["donutStatus"].data.datasets[0].data = data;
	  instances["donutStatus"].update();
	  return;
	}

    instances["donutStatus"] = new Chart(el, {
      type:"doughnut",
      data:{
        labels:["Passed","Failed","Skipped","Warning"],
        datasets:[{
          data,
          backgroundColor:["#22c55e","#ef4444","#60a5fa","#f59e0b"],
          borderWidth:0,
          cutout:"72%",
          hoverOffset:2
        }]
      },
      options:{
        responsive:true,
        maintainAspectRatio:true,
        plugins:{ legend:{display:false}, tooltip }
      }
    });
	if(!observers[id]){
	  observers[id] = new ResizeObserver(() => {
	    if(document.visibilityState === "visible"){
	      instances[id]?.resize();
	    }
	  });
	  observers[id].observe(el.parentElement);
	}

  }

  function summaryDonuts(report){
    const s = report.summary || {};

    donut("dTotalTests", [100], ["#a78bfa"]);
    donut("dTotalSteps", [100], ["#60a5fa"]);

    donut("dTestsPassed", [s.passed ?? 0, s.testsOther ?? 0], ["#22c55e","rgba(255,255,255,.08)"]);
    donut("dTestsFailed", [s.testsOther ?? 0, s.passed ?? 0], ["#ef4444","rgba(255,255,255,.08)"]);

    donut("dStepsPassed", [s.stepsPassed ?? 0, s.stepsOther ?? 0], ["#22c55e","rgba(255,255,255,.08)"]);
    donut("dStepsFailed", [s.stepsOther ?? 0, s.stepsPassed ?? 0], ["#ef4444","rgba(255,255,255,.08)"]);
  }
  window.addEventListener("beforeunload", () => {
    Object.values(instances).forEach(c => c.destroy());
  });

  function comparison(current, previous){
    const el = document.getElementById("comparisonChart");
    if(!el || !current || !previous) return;

    if(instances["comparisonChart"]){
      instances["comparisonChart"].destroy();
    }

    instances["comparisonChart"] = new Chart(el, {
      type: "bar",
      data: {
        labels: ["Passed", "Failed", "Skipped"],
        datasets: [
          {
            label: "Current Run",
            data: [current.passed, current.failed, current.skipped],
            borderWidth: 0
          },
          {
            label: "Previous Run",
            data: [previous.passed, previous.failed, previous.skipped],
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: "#eaf1ff" } } },
        scales: {
          x: { ticks: { color: "#cfe0ff" } },
          y: { ticks: { color: "#cfe0ff" } }
        }
      }
    });
  }

  function failureBreakdown(report){
    const el = document.getElementById("failureChart");
    if(!el) return;

    const steps = report.tests?.flatMap(t => t.steps || []) || [];
    const failures = steps.filter(s => (s.status || "").toUpperCase() === "FAIL");

    const buckets = {
      "Assertion": 0,
      "Element Not Found": 0,
      "Timeout": 0,
      "Network": 0,
      "Other": 0
    };

    failures.forEach(f => {
      const msg = (f.details || "").toLowerCase();

      if(msg.includes("assert")) buckets["Assertion"]++;
      else if(msg.includes("element") || msg.includes("locator")) buckets["Element Not Found"]++;
      else if(msg.includes("timeout")) buckets["Timeout"]++;
      else if(msg.includes("network") || msg.includes("connection")) buckets["Network"]++;
      else buckets["Other"]++;
    });

    if(instances["failureChart"]) instances["failureChart"].destroy();

    instances["failureChart"] = new Chart(el, {
      type: "doughnut",
      data: {
        labels: Object.keys(buckets),
        datasets: [{
          data: Object.values(buckets)
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: "#eaf1ff" } }
        }
      }
    });
  }

  function failureTrend(currentReport){
    const el = document.getElementById("failureTrendChart");
    if(!el) return;

    const history = window.__AUTOMATEDSCRIPT_HISTORY__ || {};

    // Collect last 4 runs from history
    const pastRuns = Object.values(history).flat().slice(0,4);

    const labels = [];
    const data = [];

    // Oldest first
    pastRuns.reverse().forEach((run, idx) => {
      labels.push(`Run-${pastRuns.length - idx}`);
      data.push(run.summary?.failed || 0);
    });

    // Add current run
    labels.push("Current");
    data.push(currentReport.summary?.failed || 0);

    if(instances["failureTrendChart"]) instances["failureTrendChart"].destroy();

    instances["failureTrendChart"] = new Chart(el, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Failures",
          data,
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: "#eaf1ff" } } },
        scales: {
          x: { ticks: { color: "#cfe0ff" } },
          y: { ticks: { color: "#cfe0ff" } }
        }
      }
    });
  }

  return { donut, statusSplit, summaryDonuts, comparison, failureBreakdown, failureTrend };



})();
