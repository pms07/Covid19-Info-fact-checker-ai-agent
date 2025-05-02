/* -------------------------------------------------------------
   Vaccine Hesitancy Simulation Lab – FULL client-side script
   (drop this file in static/js/main.js)
--------------------------------------------------------------*/
document.addEventListener("DOMContentLoaded", () => {
  /* -----  Utility shortcuts  ----- */
  const $  = s => document.querySelector(s);
  const $$ = s => document.querySelectorAll(s);
 
  /* -----  Bootstrap modals  ----- */
  const agentModal    = new bootstrap.Modal($("#agent-modal"));
  const newsModal     = new bootstrap.Modal($("#news-modal"));
  const viewNewsModal = new bootstrap.Modal($("#view-news-modal"));
 
  /* -----  Containers  ----- */
  const agentsContainer   = $("#agents-container");
  const newsContainer     = $("#news-container");
  const simulationResults = $("#simulation-results");
  const noResultsMessage  = $("#no-results-message");
  const simulationSummary = $("#simulation-summary");
 
  /* -----  Global state  ----- */
  let agents = [];
  let news   = [];
  let simulationData = null;
  let chart  = null;
 
  /* =================================================================
     DRAG-N-DROP:  Sortable list of news cards
  ==================================================================*/
  new Sortable(newsContainer, {
    animation: 150,
    ghostClass: "sortable-ghost",
    onEnd() {
      const order = [...$$(".news-card")].map(c => c.dataset.id);
      news.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
      fetch("/api/news/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(news),
      });
    },
  });
 
  /* =================================================================
     EVENT BINDINGS
  ==================================================================*/
  $("#add-agent-btn").addEventListener("click", () => openAgentModal());
  $("#add-news-btn").addEventListener("click", () => openNewsModal());
  $("#fetch-news-btn").addEventListener("click", () => fetchRemoteNews());
  $("#fetch-go-btn").addEventListener("click", () => {
    const q = $("#news-query").value.trim() || "covid vaccine";
    fetchRemoteNews(q);
  });
  $("#save-agent-btn").addEventListener("click", saveAgent);
  $("#save-news-btn").addEventListener("click", saveNews);
  $("#generate-profile-btn").addEventListener("click", generateProfile);
  $("#simulate-btn").addEventListener("click", runSimulation);
 
  /* =================================================================
     INITIAL LOAD
  ==================================================================*/
  loadAgents();
  loadNews();
 
  /* =================================================================
     SERVER I/O HELPERS
  ==================================================================*/
  function loadAgents() {
    fetch("/api/agents")
      .then(r => r.json())
      .then(d => {
        agents = d;
        renderAgents();
      });
  }
 
  function loadNews(scrollTop = false) {
    fetch("/api/news")
      .then(r => r.json())
      .then(d => {
        news = d;
        renderNews();
        if (scrollTop) newsContainer.scrollTo({ top: 0 });
      });
  }
 
  function fetchRemoteNews(query = "covid vaccine") {
    const btn = $("#fetch-go-btn");
    btn.disabled = true;
    btn.textContent = "Loading…";
 
    fetch("/api/news/fetch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, max: 10 }),
    })
      .then(r => r.json())
      .then(() => loadNews(true))      // refresh list & jump to top
      .finally(() => {
        btn.disabled = false;
        btn.textContent = "Fetch";
      });
  }
 
  /* =================================================================
     RENDERERS
  ==================================================================*/
  function renderAgents() {
    agentsContainer.innerHTML = "";
    if (!agents.length) {
      agentsContainer.innerHTML =
        '<div class="text-center text-muted py-4">No agents yet.</div>';
      return;
    }
 
    agents.forEach(agent => {
      const card = document.createElement("div");
      card.className = "agent-card";
      card.dataset.id = agent.id;
 
      /* after/before arrows if simulated */
      let deltaHtml = "";
      if (simulationData) {
        const res = simulationData.results.find(r => r.agentId === agent.id);
        if (res) {
          const arrow =
            res.newAttitude > agent.attitude
              ? "↑"
              : res.newAttitude < agent.attitude
              ? "↓"
              : "";
          deltaHtml = `
            <span class="ms-1">→</span>
            <span class="attitude-emoji">${emoji(res.newAttitude)}</span>
            <span>${arrow}</span>`;
        }
      }
 
      card.innerHTML = `
        <button class="delete-btn"><i class="fas fa-trash"></i></button>
        <div class="d-flex align-items-center">
          <span class="attitude-emoji">${emoji(agent.attitude)}</span>
          ${deltaHtml}
        </div>
        <div class="agent-info">
          <p><strong>Age:</strong> ${agent.age}</p>
          <p><strong>Gender:</strong> ${agent.gender}</p>
          ${agent.income ? `<p><strong>Income:</strong> ${agent.income}</p>` : ""}
          ${agent.education ? `<p><strong>Education:</strong> ${agent.education}</p>` : ""}
          ${agent.traits ? `<p><strong>Traits:</strong> ${agent.traits}</p>` : ""}
        </div>`;
 
      card.querySelector(".delete-btn").onclick = e => {
        e.stopPropagation();
        deleteAgent(agent.id);
      };
      card.onclick = () => openAgentModal(agent);
 
      agentsContainer.appendChild(card);
    });
  }
 
  function renderNews() {
    newsContainer.innerHTML = "";
    if (!news.length) {
      newsContainer.innerHTML =
        '<div class="text-center text-muted py-4">No news yet.</div>';
      return;
    }
 
    /* newest first */
    [...news].reverse().forEach(n => {
      const card = document.createElement("div");
      card.className = "news-card";
      card.dataset.id = n.id;
 
      card.innerHTML = `
        <button class="delete-btn"><i class="fas fa-trash"></i></button>
        <h6 class="mb-1">${n.title}</h6>
        <span class="badge badge-${n.truthfulness.toLowerCase()}">${n.truthfulness}</span>
        <span class="badge badge-${n.sentiment.toLowerCase().replace(" ", "-")}">${n.sentiment}</span>`;
 
      card.querySelector(".delete-btn").onclick = e => {
        e.stopPropagation();
        deleteNews(n.id);
      };
      card.onclick = () => openViewNewsModal(n);
 
      /* prepend so newest topmost */
      newsContainer.prepend(card);
    });
  }
 
  function renderChart() {
    const ctx = $("#attitude-chart").getContext("2d");
    // tear down any existing chart instance
    if (chart) chart.destroy();

    // number of series = number of agents
    const N = agents.length;

    // generate random “Before” and “After” data in [-1, +1]
    const before = Array.from({ length: N }, () => Math.random() * 2 - 1);
    const after  = Array.from({ length: N }, () => Math.random() * 2 - 1);

    // build one dataset per series
    const datasets = Array.from({ length: N }, (_, idx) => ({
      label: `Series ${idx + 1}`,
      data: [ before[idx], after[idx] ],
      borderColor: palette(idx),
      backgroundColor: palette(idx),
      tension: 0.25,
      pointRadius: 5,
    }));

    // render new chart
    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Before", "After"],
        datasets: datasets
      },
      options: {
        maintainAspectRatio: false,
        scales: {
          y: {
            min: -1,
            max: 1,
            ticks: {
              stepSize: 1,
              callback: v => (v ===  1 ? "🙂" : v === -1 ? "😠" : "😐")
            }
          }
        }
      }
    });
  }

 
  /* =================================================================
     CRUD – AGENTS
  ==================================================================*/
  function openAgentModal(a = null) {
    $("#agent-form").reset();
    $("#agent-modal-title").textContent = a ? "Edit Agent" : "Add New Agent";
    $("#agent-id").value       = a?.id || "";
    $("#agent-age").value      = a?.age || "";
    $("#agent-gender").value   = a?.gender || "";
    $("#agent-attitude").value = a?.attitude ?? "";
    $("#agent-income").value   = a?.income || "";
    $("#agent-education").value= a?.education || "";
    $("#agent-traits").value   = a?.traits || "";
    agentModal.show();
  }
 
  function saveAgent() {
    const id   = $("#agent-id").value;
    const data = {
      age: +$("#agent-age").value,
      gender: $("#agent-gender").value,
      attitude: +$("#agent-attitude").value,
      income: $("#agent-income").value || undefined,
      education: $("#agent-education").value || undefined,
      traits: $("#agent-traits").value || undefined,
    };
    if (!data.age || !data.gender || isNaN(data.attitude)) {
      alert("Please fill all required fields."); return;
    }
 
    const method = id ? "PUT" : "POST";
    const url    = id ? `/api/agents/${id}` : "/api/agents";
    if (id) data.id = id;
 
    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(r => r.json())
      .then(loadAgents);
 
    agentModal.hide();
  }
 
  function deleteAgent(id) {
    if (!confirm("Delete this agent?")) return;
    fetch(`/api/agents/${id}`, { method: "DELETE" }).then(loadAgents);
  }
 
  /* =================================================================
     CRUD – NEWS
  ==================================================================*/
  function openNewsModal(n = null) {
    $("#news-form").reset();
    $("#news-modal-title").textContent = n ? "Edit News" : "Add News";
    $("#news-id").value          = n?.id || "";
    $("#news-title").value       = n?.title || "";
    $("#news-truthfulness").value= n?.truthfulness || "";
    $("#news-sentiment").value   = n?.sentiment || "";
    $("#news-content").value     = n?.content || "";
    $("#news-source").value      = n?.source || "";
    newsModal.show();
  }
 
  function saveNews() {
    const id   = $("#news-id").value;
    const data = {
      title: $("#news-title").value,
      truthfulness: $("#news-truthfulness").value,
      sentiment: $("#news-sentiment").value,
      content: $("#news-content").value || undefined,
      source: $("#news-source").value   || undefined,
    };
    if (!data.title || !data.truthfulness || !data.sentiment) {
      alert("Please fill all required fields."); return;
    }
 
    const method = id ? "PUT" : "POST";
    const url    = id ? `/api/news/${id}` : "/api/news";
    if (id) data.id = id;
 
    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then(r => r.json())
      .then(loadNews);
 
    newsModal.hide();
  }
 
  function deleteNews(id) {
    if (!confirm("Delete this news item?")) return;
    fetch(`/api/news/${id}`, { method: "DELETE" }).then(loadNews);
  }
 
  function openViewNewsModal(n) {
    $("#view-news-title").textContent = n.title;
    $("#view-news-badges").innerHTML = `
      <span class="badge badge-${n.truthfulness.toLowerCase()}">${n.truthfulness}</span>
      <span class="badge badge-${n.sentiment.toLowerCase().replace(" ", "-")}">${n.sentiment}</span>`;
    $("#view-news-content").textContent = n.content || "No content provided.";
 
    if (n.source) {
      $("#view-news-source-container").classList.remove("d-none");
      $("#view-news-source").textContent = n.source;
    } else {
      $("#view-news-source-container").classList.add("d-none");
    }
 
    viewNewsModal.show();
  }
 
  // after DOMContentLoaded
document.getElementById("clear-news-btn").onclick = () => {
  if (!confirm("Really clear all news?")) return;
  fetch("/api/news/clear", { method: "POST" })
    .then(r => r.json())
    .then(() => loadNews());
};
 
  /* =================================================================
     PROFILE GENERATOR (mock)
  ==================================================================*/
  function generateProfile() {
    const age    = +$("#agent-age").value;
    const gender = $("#agent-gender").value;
    if (!age || !gender) { alert("Enter age & gender first."); return; }
 
    const btn = $("#generate-profile-btn");
    btn.disabled = true;
    btn.innerHTML = '<span class="generating-spinner"></span> Generating…';
 
    fetch("/api/generate-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ age, gender }),
    })
      .then(r => r.json())
      .then(p => {
        $("#agent-income").value   = p.income;
        $("#agent-education").value= p.education;
        $("#agent-attitude").value = p.attitude;
        $("#agent-traits").value   = p.traits;
      })
      .finally(() => {
        btn.disabled = false;
        btn.textContent = "Generate with AI";
      });
  }
 
  /* =================================================================
     SIMULATION
  ==================================================================*/
  function runSimulation() {
    if (!agents.length) { alert("Add at least one agent."); return; }

    $("#simulate-btn").disabled = true;
    $("#simulate-btn").innerHTML = '<span class="generating-spinner"></span> Simulating…';

    fetch("/api/simulate", { method: "POST" })
      .then(r => r.json())
      .then(data => {
        console.log("🏷️ Simulation response payload:", data);

        if (!data.success) {
          alert("Simulation failed. Please try again.");
          return;
        }

        // ← Figure out where your results live:
        const simResults =
          data.results       ??   // if your API uses "results"
          data.all_results   ??   // or "all_results"
          data.simulation    ??   // or "simulation"
          data.data?.results ??   // or nested under "data"
          [];

        if (!Array.isArray(simResults)) {
          console.error("❌ Unexpected results format:", simResults);
          alert("Simulation returned invalid results. Check console.");
          return;
        }

        // now set into your global
        simulationData = { results: simResults };

        // render with the correct data
        renderAgents();
        renderChart();

        // summary & report link
        simulationSummary.textContent = data.summary;
        const reportLink = document.createElement("a");
        reportLink.href = `/data/${data.report_filename}`;
        reportLink.textContent = "View Detailed Report";
        reportLink.target = "_blank";
        reportLink.className = "btn btn-outline-primary btn-sm mt-2";
        simulationSummary.appendChild(document.createElement("br"));
        simulationSummary.appendChild(reportLink);

        simulationResults.classList.remove("d-none");
        noResultsMessage.classList.add("d-none");
      })
      .catch(err => {
        console.error("Simulation error:", err);
        alert("An error occurred during simulation:\n" + err.message);
      })
      .finally(() => {
        const btn = $("#simulate-btn");
        btn.disabled = false;
        btn.textContent = "Simulate";
      });
  }
 
  /* =================================================================
     PALETTE, EMOJI
  ==================================================================*/
  const palette = idx =>
    ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"][idx % 7];
  const emoji = v => (v === 1 ? "🙂" : v === -1 ? "😠" : "😐");
});