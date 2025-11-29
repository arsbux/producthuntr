import React from 'react';

export default function TrendsTable({ items }: { items: any[] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-900/50 text-xs uppercase text-gray-500">
                    <tr>
                        <th className="px-6 py-4 font-medium w-16">Rank</th>
                        <th className="px-6 py-4 font-medium">Name</th>
                        <th className="px-6 py-4 font-medium text-right">Launches</th>
                        <th className="px-6 py-4 font-medium text-right">Total Votes</th>
                        <th className="px-6 py-4 font-medium text-right">Avg Votes</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                    {items.map((item: any, index: number) => (
                        <tr key={item.name} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-gray-500 font-mono">#{index + 1}</td>
                            <td className="px-6 py-4">
                                <div className="font-medium text-white capitalize">{item.name}</div>
                            </td>
                            <td className="px-6 py-4 text-right text-gray-300">
                                {item.launches}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-300">
                                {item.votes.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${item.avgVotes > 500 ? 'bg-green-500/10 text-green-400' :
                                        item.avgVotes > 200 ? 'bg-blue-500/10 text-blue-400' :
                                            'bg-gray-800 text-gray-400'
                                    }`}>
                                    {item.avgVotes.toLocaleString()}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
