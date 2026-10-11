// 아파트 시세 비교 데이터
// 출처: 국토교통부 실거래가 공개시스템 기반 민간 집계 사이트
// (영끌했다 yeongkkeul.com, 실거래가Pro silgorae.com 등), 2026-10-11 기준 수동 수집
// price 단위: 억원, area 단위: ㎡(전용면적)
// 평단가 계산: price / (area / 3.3058)

const PYEONG = 3.3058;

const APT_DATA = {
  complexes: [
    {
      id: "persigy",
      name: "래미안퍼스티지",
      region: "서초구 반포동",
      builtYear: 2009,
      color: null, // 평형별로 지정
      units: [
        {
          id: "persigy-59",
          label: "24평형 (전용 59㎡)",
          area: 59.89,
          color: "#2563eb", // blue
          sale: [
            { date: "2020-05", price: 19.1 },
            { date: "2025-11", price: 39.5 },
            { date: "2025-12", price: 40.8 },
            { date: "2026-01", price: 43.5 },
            { date: "2026-02", price: 44.5 },
            { date: "2026-04", price: 40.2 },
            { date: "2026-05", price: 37.2 },
            { date: "2026-09", price: 41.8 }
          ],
          jeonse: [
            { date: "2026-09", price: 14.0 }
          ]
        },
        {
          id: "persigy-84",
          label: "34평형 (전용 84㎡)",
          area: 84.93,
          color: "#16a34a", // green
          sale: [
            { date: "2026-02", price: 57.0 },
            { date: "2026-03", price: 55.0 },
            { date: "2026-04", price: 50.0 },
            { date: "2026-05", price: 51.5 },
            { date: "2026-06", price: 54.5 },
            { date: "2026-09", price: 49.3 }
          ],
          jeonse: [
            { date: "2026-09", price: 17.4 }
          ]
        }
      ]
    },
    {
      id: "onebailey",
      name: "래미안원베일리",
      region: "서초구 반포동",
      builtYear: 2023,
      color: null,
      units: [
        {
          id: "onebailey-59",
          label: "24평형 (전용 59㎡)",
          area: 59.96,
          color: "#dc2626", // red
          sale: [
            { date: "2023-06", price: 26.9 },
            { date: "2025-06", price: 44.5 },
            { date: "2025-08", price: 42.5 },
            { date: "2025-11", price: 46.6 },
            { date: "2026-02", price: 49.5 },
            { date: "2026-05", price: 47.5 },
            { date: "2026-06", price: 46.0 },
            { date: "2026-08", price: 47.0 }
          ],
          jeonse: [
            { date: "2026-09", price: 16.5 }
          ]
        },
        {
          id: "onebailey-84",
          label: "34평형 (전용 84㎡)",
          area: 84.97,
          color: "#ea580c", // orange
          sale: [
            { date: "2025-05", price: 60.0 },
            { date: "2025-10", price: 65.2 },
            { date: "2026-06", price: 56.3 },
            { date: "2026-09", price: 58.9 }
          ],
          jeonse: [
            { date: "2026-09", price: 20.2 }
          ]
        }
      ]
    }
  ]
};
