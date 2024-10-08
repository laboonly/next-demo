import React from 'react';

const ChinaCitiesTable = () => {
    const cities = [
        { name: 'Beijing', population: '21,886,000' },
        { name: 'Shanghai', population: '24,150,000' },
        { name: 'Guangzhou', population: '14,904,400' },
        { name: 'Shenzhen', population: '12,528,000' },
        { name: 'Chengdu', population: '16,040,000' },
        { name: 'Wuhan', population: '11,212,000' },
        { name: 'Xi\'an', population: '12,008,000' },
        { name: 'Hangzhou', population: '10,360,000' },
        { name: 'Nanjing', population: '8,497,000' },
        { name: 'Chongqing', population: '30,484,000' },
    ];

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Population</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {cities.map((city) => (
                        <tr key={city.name}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{city.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{city.population}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ChinaCitiesTable;