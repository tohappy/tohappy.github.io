// 아파트 시세 비교 앱 로직
(function () {
  const controlsRoot = document.getElementById("aptControls");
  const chartCanvas = document.getElementById("priceChart");
  let chart = null;

  // ---------- 1. 아파트/평형 선택 체크박스 동적 생성 ----------
  function buildControls() {
    controlsRoot.innerHTML = "";
    APT_DATA.complexes.forEach((complex) => {
      const block = document.createElement("div");
      block.className = "apt-block";

      const nameRow = document.createElement("div");
      nameRow.className = "apt-name-row";
      nameRow.innerHTML = `
        <label>
          <input type="checkbox" class="apt-toggle" data-apt="${complex.id}" checked />
          ${complex.name}
        </label>
        <span class="apt-meta">${complex.region} · ${complex.builtYear}년 입주</span>
      `;
      block.appendChild(nameRow);

      complex.units.forEach((unit) => {
        const row = document.createElement("div");
        row.className = "unit-row";
        row.innerHTML = `
          <label>
            <input type="checkbox" class="unit-toggle" data-apt="${complex.id}" data-unit="${unit.id}" checked />
            <span class="swatch" style="background:${unit.color}"></span>
            ${unit.label}
          </label>
        `;
        block.appendChild(row);
      });

      controlsRoot.appendChild(block);
    });

    controlsRoot.querySelectorAll(".apt-toggle, .unit-toggle").forEach((el) => {
      el.addEventListener("change", onApartmentToggleChange);
    });
  }

  // 단지 체크 해제 시 하위 평형도 일괄 해제/복원
  function onApartmentToggleChange(e) {
    if (e.target.classList.contains("apt-toggle")) {
      const aptId = e.target.dataset.apt;
      const checked = e.target.checked;
      controlsRoot
        .querySelectorAll(`.unit-toggle[data-apt="${aptId}"]`)
        .forEach((cb) => (cb.checked = checked));
    }
    renderChart();
  }

  // ---------- 2. 선택 상태 읽기 ----------
  function getSelectedUnits() {
    const selected = [];
    APT_DATA.complexes.forEach((complex) => {
      complex.units.forEach((unit) => {
        const cb = controlsRoot.querySelector(
          `.unit-toggle[data-apt="${complex.id}"][data-unit="${unit.id}"]`
        );
        if (cb && cb.checked) {
          selected.push({ complex, unit });
        }
      });
    });
    return selected;
  }

  function getBasis() {
    return document.querySelector('input[name="basis"]:checked').value; // 'price' | 'pyeong'
  }

  function getDealTypes() {
    const types = [];
    if (document.getElementById("dealSale").checked) types.push("sale");
    if (document.getElementById("dealJeonse").checked) types.push("jeonse");
    return types;
  }

  // ---------- 3. 데이터 가공 ----------
  function toPyeongPrice(price, areaSqm) {
    const pyeong = areaSqm / PYEONG;
    return +(price / pyeong).toFixed(3);
  }

  function buildDatasets(selectedUnits, basis, dealTypes) {
    // 모든 날짜(연-월) 라벨 수집 후 정렬
    const labelSet = new Set();
    selectedUnits.forEach(({ unit }) => {
      dealTypes.forEach((dt) => {
        (unit[dt] || []).forEach((p) => labelSet.add(p.date));
      });
    });
    const labels = Array.from(labelSet).sort();

    const datasets = [];
    selectedUnits.forEach(({ complex, unit }) => {
      dealTypes.forEach((dealType) => {
        const series = unit[dealType] || [];
        if (series.length === 0) return;
        const map = {};
        series.forEach((p) => {
          const v = basis === "pyeong" ? toPyeongPrice(p.price, unit.area) : p.price;
          map[p.date] = v;
        });
        const dataPoints = labels.map((l) => (l in map ? map[l] : null));

        datasets.push({
          label: `${complex.name} · ${unit.label} · ${dealType === "sale" ? "매매" : "전세"}`,
          data: dataPoints,
          borderColor: unit.color,
          backgroundColor: unit.color,
          borderDash: dealType === "jeonse" ? [6, 4] : [],
          spanGaps: true,
          tension: 0.25,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2,
        });
      });
    });

    return { labels, datasets };
  }

  // ---------- 4. 차트 렌더 ----------
  function renderChart() {
    const selectedUnits = getSelectedUnits();
    const basis = getBasis();
    const dealTypes = getDealTypes();

    const { labels, datasets } = buildDatasets(selectedUnits, basis, dealTypes);

    const yLabel =
      basis === "pyeong" ? "평단가 (억원 / 평, 전용면적 기준)" : "거래가 (억원)";

    if (chart) chart.destroy();

    chart = new Chart(chartCanvas, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "nearest", intersect: false },
        plugins: {
          legend: {
            position: "bottom",
            labels: { boxWidth: 14, font: { size: 11.5 } },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue}억`,
            },
          },
        },
        scales: {
          x: {
            title: { display: true, text: "계약 연-월" },
            grid: { color: "#eef0f3" },
          },
          y: {
            title: { display: true, text: yLabel },
            grid: { color: "#eef0f3" },
            beginAtZero: false,
          },
        },
      },
    });
  }

  // ---------- 5. 이벤트 바인딩 ----------
  document.querySelectorAll('input[name="basis"]').forEach((el) =>
    el.addEventListener("change", renderChart)
  );
  document.getElementById("dealSale").addEventListener("change", renderChart);
  document.getElementById("dealJeonse").addEventListener("change", renderChart);

  // ---------- 초기화 ----------
  buildControls();
  renderChart();

  // chart.resize 대응 (캔버스 높이 고정 컨테이너)
  window.addEventListener("resize", () => chart && chart.resize());
})();
