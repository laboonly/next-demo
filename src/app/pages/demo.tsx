import React, { useState } from 'react';
import Link from 'next/link';

function DemoPage() {
  const [count, setCount] = useState(0);
  const [theme, setTheme] = useState('light');

  const incrementCount = () => setCount(count + 1);
  const decrementCount = () => setCount(count - 1);
  const resetCount = () => setCount(0);
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-12 lg:p-24">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">示例组件展示</h1>
        
        <div className={`mb-8 p-6 rounded-lg shadow-md ${theme === 'light' ? 'bg-white text-gray-800' : 'bg-gray-800 text-white'}`}>
          <h2 className="text-xl font-semibold mb-4">交互式计数器</h2>
          
          <div className="flex items-center justify-center mb-6">
            <button 
              onClick={decrementCount}
              className="px-4 py-2 bg-red-500 text-white rounded-l-md hover:bg-red-600 transition-colors"
            >
              -
            </button>
            <div className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-center min-w-[80px]">
              {count}
            </div>
            <button 
              onClick={incrementCount}
              className="px-4 py-2 bg-green-500 text-white rounded-r-md hover:bg-green-600 transition-colors"
            >
              +
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={resetCount} 
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              重置
            </button>
            <button 
              onClick={toggleTheme} 
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
            >
              切换主题
            </button>
          </div>
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

          <Link
            href="/pages/about"
            className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
          >
            关于我们
          </Link>
        </div>
      </div>
    </main>
  );
}

export default DemoPage;