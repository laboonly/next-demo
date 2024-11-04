··import React from 'react';

const cities = [
  { name: 'Beijing', province: 'Beijing', population: '21.54 million', area: '16,410.5 km²' },
  { name: 'Shanghai', province: 'Shanghai', population: '24.28 million', area: '6,340.5 km²' },
  { name: 'Guangzhou', province: 'Guangdong', population: '15.3 million', area: '7,434.4 km²' },
  { name: 'Shenzhen', province: 'Guangdong', population: '12.53 million', area: '2,050.2 km²' },
  { name: 'Chengdu', province: 'Sichuan', population: '16.34 million', area: '14,378.0 km²' },
];

function TablePage() {
  return (
    <div className="overflow-x-auto">
      <h1 className="text-2xl font-bold mb-4">Cities in China</h1>
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">City Name</th>
            <th className="py-2 px-4 border-b">Province</th>
            <th className="py-2 px-4 border-b">Population</th>
            <th className="py-2 px-4 border-b">Area</th>
          </tr>
        </thead>
        <tbody>
          {cities.map((city, index) => (
            <tr key={index} className="hover:bg-gray-100">
              <td className="py-2 px-4 border-b">{city.name}</td>
              <td className="py-2 px-4 border-b">{city.province}</td>
              <td className="py-2 px-4 border-b">{city.population}</td>
              <td className="py-2 px-4 border-b">{city.area}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TablePage;