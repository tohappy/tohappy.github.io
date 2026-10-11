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

  // ---------- 6. 두 단지 비교 테이블 (계약일 | 퍼스티지 | 원베일리 | 갭) ----------
  function findUnit(unitId) {
    for (const complex of APT_DATA.complexes) {
      const unit = complex.units.find((u) => u.id === unitId);
      if (unit) return { complex, unit };
    }
    return null;
  }

  function buildCmpTable() {
    const wrap = document.getElementById("cmpTableWrap");
    const moreBtn = document.getElementById("cmpMoreBtn");
    if (!wrap || !CMP_TABLE_CONFIG) return;

    const [idA, idB] = CMP_TABLE_CONFIG.unitIds;
    const a = findUnit(idA); // 퍼스티지 59
    const b = findUnit(idB); // 원베일리 59

    // 날짜별 매매가 맵 + 날짜 내림차순(최신순) 정렬 리스트
    const mapA = {}, mapB = {};
    a.unit.sale.forEach((p) => (mapA[p.date] = p.price));
    b.unit.sale.forEach((p) => (mapB[p.date] = p.price));

    const datesA = Object.keys(mapA).sort().reverse();
    const datesB = Object.keys(mapB).sort().reverse();
    const allDates = Array.from(new Set([...datesA, ...datesB])).sort().reverse();

    // 전체 구간 10분위 경계 계산 (두 단지 매매가 전체 기준)
    const allPrices = [...Object.values(mapA), ...Object.values(mapB)];
    const minP = Math.min(...allPrices);
    const maxP = Math.max(...allPrices);
    const width = (maxP - minP) / 10;
    function decileOf(v) {
      if (width === 0) return 1;
      return Math.min(9, Math.floor((v - minP) / width)) + 1;
    }

    // 각 단지별로 "직전(더 과거) 거래 대비 분위 변화" 미리 계산
    function buildDecileChangeMap(dates, map) {
      const result = {};
      for (let i = 0; i < dates.length - 1; i++) {
        const curDate = dates[i];
        const prevDate = dates[i + 1]; // 더 과거
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
    const decileChangeA = buildDecileChangeMap(datesA, mapA);
    const decileChangeB = buildDecileChangeMap(datesB, mapB);

    const floorInfoA = (CMP_FLOOR_INFO && CMP_FLOOR_INFO[idA]) || {};
    const floorInfoB = (CMP_FLOOR_INFO && CMP_FLOOR_INFO[idB]) || {};
    function isLowFloor(info) {
      return info && info.floor != null && info.floor <= 5;
    }

    function renderPriceCell(date, price, floorInfo, decileChange) {
      if (price == null) return "-";
      let html = `<div class="price-cell"><span>${price.toFixed(1)}억`;
      if (floorInfo && floorInfo.floor != null) html += ` (${floorInfo.floor}층)`;
      if (isLowFloor(floorInfo)) html += ` <span class="floor-tag">저층</span>`;
      html += `</span>`;
      if (decileChange) {
        html += `<span class="decile-tag ${decileChange.dir}">${decileChange.prev.toFixed(1)}억 &gt; ${decileChange.curr.toFixed(1)}억</span>`;
      }
      html += `</div>`;
      return html;
    }

    const defaultFrom = CMP_TABLE_CONFIG.defaultFromDate;
    let expanded = false;

    function render() {
      const visibleDates = expanded ? allDates : allDates.filter((d) => d >= defaultFrom);

      const rows = visibleDates.map((date) => {
        const priceA = mapA[date] ?? null;
        const priceB = mapB[date] ?? null;
        const lowFloor = isLowFloor(floorInfoA[date]) || isLowFloor(floorInfoB[date]);

        let gapCell = '<span class="gap-na">-</span>';
        if (priceA != null && priceB != null) {
          if (lowFloor) {
            gapCell = '<span class="gap-na">제외(저층)</span>';
          } else {
            const gap = priceB - priceA;
            gapCell = `${gap >= 0 ? "+" : ""}${gap.toFixed(1)}억`;
          }
        }

        return `<tr>
          <td>${date.replace("-", ".")}</td>
          <td>${renderPriceCell(date, priceA, floorInfoA[date], decileChangeA[date])}</td>
          <td>${renderPriceCell(date, priceB, floorInfoB[date], decileChangeB[date])}</td>
          <td>${gapCell}</td>
        </tr>`;
      });

      wrap.innerHTML = `
        <table class="cmp-table">
          <thead>
            <tr>
              <th>계약일</th>
              <th class="highlight-blue">${a.complex.name}</th>
              <th class="highlight-red">${b.complex.name}</th>
              <th>갭 (${b.complex.name}−${a.complex.name})</th>
            </tr>
          </thead>
          <tbody>${rows.join("")}</tbody>
        </table>
      `;

      if (moreBtn) {
        moreBtn.textContent = expanded
          ? "접기 (최근 구간만 보기)"
          : `더보기 (${a.complex.builtYear}년 입주 이후 전체 보기 · 총 ${allDates.length}개월)`;
      }
    }

    if (moreBtn) {
      moreBtn.addEventListener("click", () => {
        expanded = !expanded;
        render();
      });
    }

    render();
  }

  // ---------- 초기화 ----------
  buildControls();
  renderChart();
  buildCmpTable();

  // chart.resize 대응 (캔버스 높이 고정 컨테이너)
  window.addEventListener("resize", () => chart && chart.resize());
})();
