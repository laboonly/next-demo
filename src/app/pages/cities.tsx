import Image from "next/image";
import cities from '../data/cities';

export default function CitiesPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-3xl font-bold mb-4">Major Cities in China</h1>
      <table className="min-w-full border-collapse border border-gray-200">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4 py-2">City</th>
            <th className="border border-gray-300 px-4 py-2">Province</th>
            <th className="border border-gray-300 px-4 py-2">Population</th>
          </tr>
        </thead>
        <tbody>
          {cities.map((city) => (
            <tr key={city.name}>
              <td className="border border-gray-300 px-4 py-2">{city.name}</td>
              <td className="border border-gray-300 px-4 py-2">{city.province}</td>
              <td className="border border-gray-300 px-4 py-2">{city.population.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}