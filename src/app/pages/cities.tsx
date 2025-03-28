import React from "react";
import Link from "next/link";
import { citiesData, CityData } from "../../data/cities";

function CitiesPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-12 lg:p-24">
      <div className="w-full max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">中国主要城市列表</h1>
          <p className="text-gray-600 dark:text-gray-300">
            这个表格展示了中国主要城市的基本信息，包括名称、所在省份、人口（百万）和面积（平方公里）。
          </p>
          <div className="mt-4">
            <Link 
              href="/" 
              className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              返回首页
            </Link>
          </div>
        </div>
        
        {/* 响应式表格容器，在小屏幕上水平滚动 */}
        <div className="w-full overflow-x-auto shadow-md rounded-lg">
          <table className="min-w-full bg-white dark:bg-gray-800">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 text-left">
                <th className="py-3 px-4 font-semibold">城市</th>
                <th className="py-3 px-4 font-semibold">省份</th>
                <th className="py-3 px-4 font-semibold">人口 (百万)</th>
                <th className="py-3 px-4 font-semibold">面积 (平方公里)</th>
              </tr>
            </thead>
            <tbody>
              {citiesData.map((city: CityData, index: number) => (
                <tr 
                  key={city.name}
                  className={`
                    ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900'} 
                    border-b border-gray-200 dark:border-gray-700
                    hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                  `}
                >
                  <td className="py-3 px-4 font-medium">{city.name}</td>
                  <td className="py-3 px-4">{city.province}</td>
                  <td className="py-3 px-4">{city.population.toLocaleString()}</td>
                  <td className="py-3 px-4">{city.area.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          <p>数据来源于公开统计信息，仅供参考。</p>
        </div>
      </div>
    </main>
  );
}

export default CitiesPage;