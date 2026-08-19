const BTS_API_BASE =
  window.BTS_API_BASE || "https://beyond-the-swipe.liqiangz.workers.dev";

function formatStudentsGuided(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "0";
  }

  return new Intl.NumberFormat("en-US").format(value);
}

async function loadStudentsGuided() {
  const target = document.querySelector("[data-students-guided]");
  if (!target) {
    return;
  }

  try {
    const response = await fetch(`${BTS_API_BASE}/api/stats`, { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    target.textContent = formatStudentsGuided(payload.studentsGuided);
  } catch {
    // Keep the starter value if the backend is temporarily unavailable.
  }
}

loadStudentsGuided();
