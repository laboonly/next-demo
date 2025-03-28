import React from 'react';
import Link from 'next/link';

function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-12 lg:p-24">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">关于我们</h1>
        
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <p className="mb-4">这是一个使用 Next.js 14 和 Tailwind CSS 构建的示例项目。</p>
          <p className="mb-4">项目展示了如何创建响应式页面、数据表格和页面导航等功能。</p>
          <p>我们提供了中国主要城市的信息，包括城市名称、所在省份、人口数量和面积等基本数据。</p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link 
            href="/" 
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            返回首页
          </Link>

          <Link
            href="/pages/cities"
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            查看城市列表
          </Link>
        </div>
      </div>
    </main>
  );
}

export default AboutPage;