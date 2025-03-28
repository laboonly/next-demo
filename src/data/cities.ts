/**
 * Interface for city data
 */
export interface CityData {
  name: string;      // City name
  province: string;  // Province
  population: number; // Population in millions
  area: number;      // Area in square kilometers
}

/**
 * Array of major Chinese cities data
 */
export const citiesData: CityData[] = [
  {
    name: "上海",
    province: "上海市",
    population: 24.87,
    area: 6340
  },
  {
    name: "北京",
    province: "北京市",
    population: 21.54,
    area: 16410
  },
  {
    name: "广州",
    province: "广东省",
    population: 18.68,
    area: 7434
  },
  {
    name: "深圳",
    province: "广东省",
    population: 17.56,
    area: 1997
  },
  {
    name: "成都",
    province: "四川省",
    population: 16.33,
    area: 14335
  },
  {
    name: "重庆",
    province: "重庆市",
    population: 32.05,
    area: 82400
  },
  {
    name: "杭州",
    province: "浙江省",
    population: 11.95,
    area: 16853
  },
  {
    name: "武汉",
    province: "湖北省",
    population: 11.21,
    area: 8494
  },
  {
    name: "西安",
    province: "陕西省",
    population: 10.20,
    area: 10752
  },
  {
    name: "南京",
    province: "江苏省",
    population: 9.31,
    area: 6587
  },
  {
    name: "天津",
    province: "天津市", 
    population: 15.60,
    area: 11760
  },
  {
    name: "苏州",
    province: "江苏省",
    population: 12.75,
    area: 8488
  }
];