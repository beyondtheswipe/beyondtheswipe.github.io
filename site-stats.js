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
  const visitSessionKey = "bts-site-visit-recorded";
  const alreadyRecorded = sessionStorage.getItem(visitSessionKey) === "1";

  try {
    if (!alreadyRecorded) {
      sessionStorage.setItem(visitSessionKey, "1");
    }

    const response = await fetch(
      `${BTS_API_BASE}${alreadyRecorded ? "/api/stats" : "/api/visit"}`,
      {
        method: alreadyRecorded ? "GET" : "POST",
        cache: "no-store",
      },
    );
    if (!response.ok) {
      throw new Error("Visit counter request failed.");
    }

    const payload = await response.json();
    if (target) {
      target.textContent = formatStudentsGuided(payload.studentsGuided);
    }
  } catch {
    if (!alreadyRecorded) {
      sessionStorage.removeItem(visitSessionKey);
    }
  }
}

loadStudentsGuided();
