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
          // 2016-09 ~ 2025-01 구간은 월별 평균(건수 1건 이상), 이후는 개별 거래 기준
          sale: [
            { date: "2016-09", price: 12.5 },
            { date: "2016-10", price: 13.0 },
            { date: "2016-11", price: 13.0 },
            { date: "2017-02", price: 13.9 },
            { date: "2017-03", price: 13.2 },
            { date: "2017-04", price: 14.2 },
            { date: "2017-05", price: 13.0 },
            { date: "2017-06", price: 14.3 },
            { date: "2017-07", price: 15.1 },
            { date: "2017-08", price: 13.7 },
            { date: "2017-09", price: 15.4 },
            { date: "2017-11", price: 15.8 },
            { date: "2017-12", price: 16.5 },
            { date: "2018-01", price: 14.5 },
            { date: "2018-03", price: 18.5 },
            { date: "2018-07", price: 20.0 },
            { date: "2018-08", price: 18.3 },
            { date: "2018-09", price: 17.7 },
            { date: "2018-12", price: 19.9 },
            { date: "2019-04", price: 17.5 },
            { date: "2019-05", price: 17.9 },
            { date: "2019-06", price: 19.1 },
            { date: "2019-07", price: 19.8 },
            { date: "2019-08", price: 21.0 },
            { date: "2019-09", price: 20.0 },
            { date: "2019-10", price: 22.2 },
            { date: "2019-12", price: 23.0 },
            { date: "2020-01", price: 21.7 },
            { date: "2020-02", price: 21.0 },
            { date: "2020-03", price: 23.0 },
            { date: "2020-04", price: 20.8 },
            { date: "2020-05", price: 19.9 },
            { date: "2020-06", price: 22.7 },
            { date: "2020-07", price: 22.5 },
            { date: "2020-09", price: 23.0 },
            { date: "2020-10", price: 23.1 },
            { date: "2020-11", price: 24.0 },
            { date: "2020-12", price: 22.9 },
            { date: "2021-01", price: 25.0 },
            { date: "2021-03", price: 26.0 },
            { date: "2021-04", price: 26.2 },
            { date: "2021-06", price: 27.5 },
            { date: "2021-07", price: 26.5 },
            { date: "2021-10", price: 30.0 },
            { date: "2022-04", price: 25.3 },
            { date: "2022-08", price: 25.5 },
            { date: "2022-11", price: 26.9 },
            { date: "2023-03", price: 24.1 },
            { date: "2023-04", price: 24.0 },
            { date: "2023-05", price: 23.5 },
            { date: "2023-06", price: 24.9 },
            { date: "2023-07", price: 25.3 },
            { date: "2023-08", price: 25.3 },
            { date: "2023-09", price: 26.5 },
            { date: "2024-01", price: 26.0 },
            { date: "2024-02", price: 26.6 },
            { date: "2024-03", price: 26.6 },
            { date: "2024-04", price: 27.2 },
            { date: "2024-06", price: 29.9 },
            { date: "2024-07", price: 31.4 },
            { date: "2024-08", price: 29.9 },
            { date: "2024-10", price: 32.5 },
            { date: "2024-11", price: 34.0 },
            { date: "2024-12", price: 32.5 },
            { date: "2025-01", price: 33.8 },
            { date: "2025-06", price: 40.0 },
            { date: "2025-11", price: 39.5 },
            { date: "2025-12", price: 40.8 },
            { date: "2026-02", price: 42.7 },
            { date: "2026-04", price: 40.2 },
            { date: "2026-05", price: 37.2 },
            { date: "2026-09", price: 41.8 }
          ],
          jeonse: [
            { date: "2016-01", price: 9.3 },
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
            { date: "2026-08", price: 16.5 },
            { date: "2026-09", price: 16.0 }
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

// ---------- 비교 테이블(두 단지 59㎡) 보조 데이터 ----------
// 특정 월의 거래가 단일 거래(1건)이고 그 층수를 알 때만 기록합니다.
// 5층 이하는 저층 할인이 섞여 단지 간 비교 갭 계산에서 제외합니다.
const CMP_FLOOR_INFO = {
  "persigy-59": {
    "2025-06": { floor: 6 },
    "2025-11": { floor: 28 },
    "2025-12": { floor: 2 }, // 저층
    "2026-04": { floor: 6 },
    "2026-05": { floor: 4 }, // 저층
    "2026-09": { floor: 15 }
  },
  "onebailey-59": {
    "2023-06": { floor: 15 },
    "2025-06": { floor: 25 },
    "2025-08": { floor: 12 },
    "2026-02": { floor: 20 },
    "2026-06": { floor: 32 },
    "2026-08": { floor: 21 }
  }
};

// 비교 테이블에 쓸 두 단지(59㎡) 식별자와, 기본으로 접어서 보여줄 기준 월
const CMP_TABLE_CONFIG = {
  unitIds: ["persigy-59", "onebailey-59"],
  defaultFromDate: "2023-06" // 이 월 이후만 기본 노출, 이전은 "더보기"로 펼침
};
