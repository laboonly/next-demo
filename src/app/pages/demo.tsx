import React from 'react';

const CityTable = () => {
    const cities = [
        { name: 'Beijing', population: 21540000, area: '16410 km²' },
        { name: 'Shanghai', population: 24150000, area: '6340 km²' },
        { name: 'Guangzhou', population: 14000000, area: '7434 km²' },
        { name: 'Shenzhen', population: 12530000, area: '1991 km²' },
        { name: 'Chengdu', population: 16030000, area: '14335 km²' }
    ];

    return (
        <div>
            <h1>City List</h1>
            <table>
                <thead>
                    <tr>
                        <th>City</th>
                        <th>Population</th>
                        <th>Area</th>
                    </tr>
                </thead>
                <tbody>
                    {cities.map(city => (
                        <tr key={city.name}>
                            <td>{city.name}</td>
                            <td>{city.population}</td>
                            <td>{city.area}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const DemoPage = () => {
    return (
        <div>
            <h1>Demo Page</h1>
            <CityTable />
        </div>
    );
};

export default DemoPage;