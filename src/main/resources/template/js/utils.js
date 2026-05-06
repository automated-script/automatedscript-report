window.Utils = {

  setText(id, val){
    const el = document.getElementById(id);
    if(el) el.textContent = val;
  },

  escapeHtml(str){
    return String(str ?? "").replace(/[&<>"']/g, (m) => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[m]));
  },

  isoToMs(iso){
    return iso ? new Date(iso).getTime() : null;
  },

  msToHMS(ms){
    if(ms == null || ms < 0) return "--:--:--";
    const s = Math.floor(ms/1000);
    const h = String(Math.floor(s/3600)).padStart(2,"0");
    const m = String(Math.floor((s%3600)/60)).padStart(2,"0");
    const sec = String(s%60).padStart(2,"0");
    return `${h}:${m}:${sec}`;
  },

  fmt: {
    int(n){ return (n ?? 0).toLocaleString("en-IN"); },
    pct(part, total){ if(!total) return "0%"; return Math.round((part/total)*100) + "%"; },
	msToHuman(ms){
      if(ms == null) return "-";
      const s = Math.round(ms/1000);
      if (s < 60) return s + "s";
      const m = Math.floor(s/60);
      const r = s%60;
      return `${m}m ${r}s`;
    }
  },
  escapeHtmlGlobal(str){
    return this.escapeHtml(str);
  }

};
