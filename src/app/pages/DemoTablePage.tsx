import React from 'react';
import TableComponent from '../components/TableComponent';

const DemoTablePage: React.FC = () => {
    const cities = [
        { name: 'Beijing', population: 21540000, area: 16410.54 },
        { name: 'Shanghai', population: 24240000, area: 6340.5 },
        { name: 'Guangzhou', population: 14000000, area: 7434.4 },
        { name: 'Shenzhen', population: 12530000, area: 1996.85 },
        { name: 'Chengdu', population: 16330000, area: 12390 },
    ];

    return (
        <div>
            <h1>Cities in China</h1>
            <TableComponent cities={cities} />
        </div>
    );
};

export default DemoTablePage;