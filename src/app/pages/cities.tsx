import React from 'react';

const CitiesPage = () => {
    const cities = [
        { name: 'Beijing', population: '21 million' },
        { name: 'Shanghai', population: '24 million' },
        { name: 'Guangzhou', population: '14 million' },
        { name: 'Shenzhen', population: '12 million' },
        { name: 'Chengdu', population: '16 million' }
    ];

    return (
        <div>
            <h1>Chinese Cities</h1>
            <table>
                <thead>
                    <tr>
                        <th>City</th>
                        <th>Population</th>
                    </tr>
                </thead>
                <tbody>
                    {cities.map((city, index) => (
                        <tr key={index}>
                            <td>{city.name}</td>
                            <td>{city.population}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CitiesPage;