// 아파트 시세 비교 앱 로직
(function () {
  const controlsRoot = document.getElementById("aptControls");
  const searchInput = document.getElementById("aptSearchInput");
  const searchResults = document.getElementById("aptSearchResults");
  const chartCanvas = document.getElementById("priceChart");
  const cmpRoot = document.getElementById("cmpTablesRoot");
  let chart = null;

  // 선택된 단지 id 집합 (기본: 데이터에 있는 전체 단지)
  const selectedComplexIds = new Set(APT_DATA.complexes.map((c) => c.id));
  // 선택된 유닛(평형) id 집합 (기본: 선택된 단지의 전체 평형)
  const selectedUnitIds = new Set();
  APT_DATA.complexes.forEach((c) => c.units.forEach((u) => selectedUnitIds.add(u.id)));

  function findComplex(complexId) {
    return APT_DATA.complexes.find((c) => c.id === complexId) || null;
  }

  // ---------- 1. 아파트 검색 ----------
  function renderSearchResults(query) {
    const q = query.trim();
    if (!q) {
      searchResults.innerHTML = "";
      searchResults.classList.remove("open");
      return;
    }
    const matches = APT_DATA.complexes.filter(
      (c) => !selectedComplexIds.has(c.id) && c.name.includes(q)
    );
    if (matches.length === 0) {
      searchResults.innerHTML = `<div class="search-empty">검색 결과 없음 (이미 선택됐거나 등록된 단지가 아님)</div>`;
    } else {
      searchResults.innerHTML = matches
        .map(
          (c) =>
            `<div class="search-item" data-apt="${c.id}">${c.name} <span class="search-item-sub">${c.region} · ${c.builtYear}년</span></div>`
        )
        .join("");
    }
    searchResults.classList.add("open");
  }

  searchInput.addEventListener("input", (e) => renderSearchResults(e.target.value));
  searchInput.addEventListener("focus", (e) => renderSearchResults(e.target.value));
  document.addEventListener("click", (e) => {
    if (!searchResults.contains(e.target) && e.target !== searchInput) {
      searchResults.classList.remove("open");
    }
  });
  searchResults.addEventListener("click", (e) => {
    const item = e.target.closest(".search-item");
    if (!item) return;
    const complexId = item.dataset.apt;
    const complex = findComplex(complexId);
    if (!complex) return;
    selectedComplexIds.add(complexId);
    complex.units.forEach((u) => selectedUnitIds.add(u.id));
    searchInput.value = "";
    searchResults.innerHTML = "";
    searchResults.classList.remove("open");
    buildControls();
    renderChart();
    buildCmpTables();
  });

  // ---------- 2. 아파트/평형 선택 체크박스 동적 생성 ----------
  function buildControls() {
    controlsRoot.innerHTML = "";

    if (selectedComplexIds.size === 0) {
      controlsRoot.innerHTML = `<div class="search-empty">위 검색창에서 아파트를 추가하세요.</div>`;
      return;
    }

    APT_DATA.complexes
      .filter((c) => selectedComplexIds.has(c.id))
      .forEach((complex) => {
        const block = document.createElement("div");
        block.className = "apt-block";

        const nameRow = document.createElement("div");
        nameRow.className = "apt-name-row";
        nameRow.innerHTML = `
          <span>${complex.name}</span>
          <span class="apt-meta">${complex.region} · ${complex.builtYear}년 입주</span>
          <button type="button" class="apt-remove-btn" data-apt="${complex.id}" title="비교에서 제거">제거</button>
        `;
        block.appendChild(nameRow);

        complex.units.forEach((unit) => {
          const row = document.createElement("div");
          row.className = "unit-row";
          const checked = selectedUnitIds.has(unit.id) ? "checked" : "";
          row.innerHTML = `
            <label>
              <input type="checkbox" class="unit-toggle" data-apt="${complex.id}" data-unit="${unit.id}" ${checked} />
              <span class="swatch" style="background:${unit.color}"></span>
              ${unit.label}
            </label>
          `;
          block.appendChild(row);
        });

        controlsRoot.appendChild(block);
      });

    controlsRoot.querySelectorAll(".unit-toggle").forEach((el) => {
      el.addEventListener("change", (e) => {
        const unitId = e.target.dataset.unit;
        if (e.target.checked) selectedUnitIds.add(unitId);
        else selectedUnitIds.delete(unitId);
        renderChart();
        buildCmpTables();
      });
    });

    controlsRoot.querySelectorAll(".apt-remove-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const complexId = e.target.dataset.apt;
        const complex = findComplex(complexId);
        selectedComplexIds.delete(complexId);
        if (complex) complex.units.forEach((u) => selectedUnitIds.delete(u.id));
        buildControls();
        renderChart();
        buildCmpTables();
      });
    });
  }

  // ---------- 3. 선택 상태 읽기 ----------
  function getSelectedUnits() {
    const selected = [];
    APT_DATA.complexes.forEach((complex) => {
      if (!selectedComplexIds.has(complex.id)) return;
      complex.units.forEach((unit) => {
        if (selectedUnitIds.has(unit.id)) selected.push({ complex, unit });
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

  // ---------- 4. 차트 데이터 가공 ----------
  function toPyeongPrice(price, areaSqm) {
    const pyeong = areaSqm / PYEONG;
    return +(price / pyeong).toFixed(3);
  }

  function buildDatasets(selectedUnits, basis, dealTypes) {
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

  // ---------- 5. 차트 렌더 ----------
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

  // ---------- 6. 평형 그룹별 비교 테이블 ----------
  function isLowFloor(floor) {
    return floor != null && floor <= (window.CMP_LOW_FLOOR_MAX || 5);
  }

  function buildOneCmpTable(entries, groupLabel) {
    // entries: [{ complex, unit }]
    const maps = entries.map(({ unit }) => {
      const m = {};
      (unit.sale || []).forEach((p) => (m[p.date] = p.price));
      return m;
    });
    const sortedDatesList = maps.map((m) => Object.keys(m).sort().reverse());
    const allDates = Array.from(new Set(sortedDatesList.flat())).sort().reverse();

    const allPrices = maps.flatMap((m) => Object.values(m));
    const minP = Math.min(...allPrices);
    const maxP = Math.max(...allPrices);
    const width = (maxP - minP) / 10;
    function decileOf(v) {
      if (width === 0) return 1;
      return Math.min(9, Math.floor((v - minP) / width)) + 1;
    }

    function buildDecileChangeMap(dates, map) {
      const result = {};
      for (let i = 0; i < dates.length - 1; i++) {
        const curDate = dates[i];
        const prevDate = dates[i + 1];
        const curV = map[curDate];
        const prevV = map[prevDate];
        const dCur = decileOf(curV);
        const dPrev = decileOf(prevV);
        if (dCur !== dPrev) {
          result[curDate] = { prev: prevV, curr: curV, dir: dCur > dPrev ? "up" : "down" };
        }
      }
      return result;
    }
    const decileChanges = maps.map((m, i) => buildDecileChangeMap(sortedDatesList[i], m));
    const floorInfos = entries.map(
      ({ unit }) => (window.CMP_FLOOR_INFO && CMP_FLOOR_INFO[unit.id]) || {}
    );

    function renderPriceCell(date, price, floorInfo, decileChange) {
      if (price == null) return "-";
      const floor = floorInfo[date] && floorInfo[date].floor;
      let html = `<div class="price-cell"><span>${price.toFixed(1)}억`;
      if (floor != null) html += ` (${floor}층)`;
      if (isLowFloor(floor)) html += ` <span class="floor-tag">저층</span>`;
      html += `</span>`;
      if (decileChange) {
        html += `<span class="decile-tag ${decileChange.dir}">${decileChange.prev.toFixed(1)}억 &gt; ${decileChange.curr.toFixed(1)}억</span>`;
      }
      html += `</div>`;
      return html;
    }

    // 기본 노출 구간: 가장 늦게 시작한(데이터가 가장 짧은) 단지의 시작월부터
    const firstDates = sortedDatesList.filter((d) => d.length > 0).map((d) => d[d.length - 1]);
    const defaultFrom = firstDates.length > 0 ? firstDates.sort().reverse()[0] : null;

    const showGap = entries.length === 2;
    const showRange = entries.length > 2;

    let expanded = false;

    const section = document.createElement("div");
    section.className = "cmp-section";

    function render() {
      const visibleDates =
        expanded || !defaultFrom ? allDates : allDates.filter((d) => d >= defaultFrom);

      const rows = visibleDates.map((date) => {
        const values = maps.map((m) => (date in m ? m[date] : null));
        const floors = entries.map(
          (_, i) => floorInfos[i][date] && floorInfos[i][date].floor
        );
        const lowFloorHit = floors.some((f) => isLowFloor(f));

        const cells = entries
          .map(
            (_, i) =>
              `<td>${renderPriceCell(date, values[i], floorInfos[i], decileChanges[i][date])}</td>`
          )
          .join("");

        let extraCell = "";
        if (showGap) {
          if (values[0] != null && values[1] != null) {
            if (lowFloorHit) {
              extraCell = '<td><span class="gap-na">제외(저층)</span></td>';
            } else {
              const gap = values[1] - values[0];
              extraCell = `<td>${gap >= 0 ? "+" : ""}${gap.toFixed(1)}억</td>`;
            }
          } else {
            extraCell = '<td><span class="gap-na">-</span></td>';
          }
        } else if (showRange) {
          const present = values.filter((v) => v != null);
          if (present.length >= 2 && !lowFloorHit) {
            const range = Math.max(...present) - Math.min(...present);
            extraCell = `<td>${range.toFixed(1)}억</td>`;
          } else {
            extraCell = '<td><span class="gap-na">-</span></td>';
          }
        }

        return `<tr><td>${date.replace("-", ".")}</td>${cells}${extraCell}</tr>`;
      });

      const headerCells = entries
        .map((e) => `<th style="color:${e.unit.color}">${e.complex.name}</th>`)
        .join("");
      let extraHeader = "";
      if (showGap) {
        extraHeader = `<th>갭 (${entries[1].complex.name}−${entries[0].complex.name})</th>`;
      } else if (showRange) {
        extraHeader = `<th>범위 (최대−최소)</th>`;
      }

      const moreBtnHtml = defaultFrom
        ? `<div style="text-align:center; margin-top:10px;">
             <button type="button" class="more-btn">
               ${
                 expanded
                   ? "접기 (최근 구간만 보기)"
                   : `더보기 (${entries[0].complex.builtYear}년 입주 이후 전체 보기 · 총 ${allDates.length}개월)`
               }
             </button>
           </div>`
        : "";

      section.innerHTML = `
        <h3 class="cmp-section-title">${groupLabel} 기준 시간순 흐름</h3>
        <table class="cmp-table">
          <thead><tr><th>계약일</th>${headerCells}${extraHeader}</tr></thead>
          <tbody>${rows.join("")}</tbody>
        </table>
        ${moreBtnHtml}
      `;

      const btn = section.querySelector(".more-btn");
      if (btn) {
        btn.addEventListener("click", () => {
          expanded = !expanded;
          render();
        });
      }
    }

    render();
    return section;
  }

  function buildCmpTables() {
    if (!cmpRoot) return;
    cmpRoot.innerHTML = "";
    const selectedUnits = getSelectedUnits();

    if (selectedUnits.length === 0) {
      cmpRoot.innerHTML = `<p class="legend-note">비교할 아파트·평형을 선택하세요.</p>`;
      return;
    }

    // 평형 그룹(pyeongGroup)별로 묶기
    const groups = {};
    selectedUnits.forEach((entry) => {
      const key = entry.unit.pyeongGroup || entry.unit.id;
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });

    Object.keys(groups)
      .sort()
      .forEach((key) => {
        const entries = groups[key];
        const groupLabel = entries[0].unit.label;
        cmpRoot.appendChild(buildOneCmpTable(entries, groupLabel));
      });

    const note = document.createElement("p");
    note.className = "legend-note";
    note.innerHTML =
      '괄호 안은 거래 층수입니다. <span class="floor-tag">저층</span>(5층 이하) 거래는 갭/범위 계산에서 제외했습니다. ' +
      '<span class="decile-tag up">33억 &gt; 36억</span> / <span class="decile-tag down">44억 &gt; 40억</span> 처럼 생긴 표시는 ' +
      "해당 평형 전체 구간을 10분위로 나눴을 때 직전 거래보다 분위가 바뀐 지점입니다.";
    cmpRoot.appendChild(note);
  }

  // ---------- 7. 이벤트 바인딩 ----------
  document.querySelectorAll('input[name="basis"]').forEach((el) =>
    el.addEventListener("change", renderChart)
  );
  document.getElementById("dealSale").addEventListener("change", renderChart);
  document.getElementById("dealJeonse").addEventListener("change", renderChart);

  // ---------- 초기화 ----------
  buildControls();
  renderChart();
  buildCmpTables();

  window.addEventListener("resize", () => chart && chart.resize());
})();
