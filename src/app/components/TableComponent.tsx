import React from 'react';

interface City {
    name: string;
    population: number;
    area: number; // in square kilometers
}

interface TableComponentProps {
    cities: City[];
}

const TableComponent: React.FC<TableComponentProps> = ({ cities }) => {
    return (
        <table>
            <thead>
                <tr>
                    <th>City Name</th>
                    <th>Population</th>
                    <th>Area (sq km)</th>
                </tr>
            </thead>
            <tbody>
                {cities.map((city, index) => (
                    <tr key={index}>
                        <td>{city.name}</td>
                        <td>{city.population}</td>
                        <td>{city.area}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default TableComponent;