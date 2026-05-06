window.App = {

  report: null,

  init(report){
    this.report = report;
    this.render();
    this.bind();
    Events.init();
  },

  render(){
    updateKpis(this.report);
	const drawCharts = () => {
	  Charts.summaryDonuts(this.report);
	  Charts.statusSplit(this.report);
	};

	if("requestIdleCallback" in window){
	  requestIdleCallback(drawCharts);
	} else {
	  setTimeout(drawCharts, 50);
	}


    // heavy UI part rendered when browser is free
    if("requestIdleCallback" in window){
      requestIdleCallback(() => TestList.render(this.report));
    } else {
      setTimeout(() => TestList.render(this.report), 0);
    }
  },

  bind(){
    try { initDetailTestMenu(); } catch(e){}
  }
};
