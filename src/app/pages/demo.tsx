import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const TableContainer = styled.div`
  margin: 20px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.th`
  background-color: #f2f2f2;
  padding: 10px;
  border: 1px solid #dddddd;
  text-align: left;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #f9f9f9;
  }
`;

const TableData = styled.td`
  padding: 10px;
  border: 1px solid #dddddd;
`;

const Demo = () => {
  const [cities, setCities] = useState([]);

  useEffect(() => {
    const fetchCities = async () => {
      const response = await fetch('https://api.example.com/cities/china');
      const data = await response.json();
      setCities(data);
    };

    fetchCities();
  }, []);

  return (
    <TableContainer>
      <Table>
        <thead>
          <tr>
            <TableHeader>City Name</TableHeader>
            <TableHeader>Province</TableHeader>
            <TableHeader>Population</TableHeader>
          </tr>
        </thead>
        <tbody>
          {cities.map((city) => (
            <TableRow key={city.name}>
              <TableData>{city.name}</TableData>
              <TableData>{city.province}</TableData>
              <TableData>{city.population}</TableData>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </TableContainer>
  );
};

export default Demo;