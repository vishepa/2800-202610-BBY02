import { useState } from 'react';
import { useAISummary } from '../../lib/hooks/useAISummary';

export default function DAInfoPanel({ properties }) {
    const [persona, setPersona] = useState('resident');
    const { data: summary, loading, error, generate, regenerate } = useAISummary(
        properties.dauid,
        persona
    );

    return (
        <div className="text-sm">
            {/* Header */}
            <h3 className="font-semibold text-base mb-3">
                Area {properties.dauid}
            </h3>

            {/* Key Stats */}
            <div className="mb-3">
                <h4 className="font-medium text-gray-700 mb-1">Key Stats</h4>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-gray-600">
                    <span>Density</span>
                    <span className="text-right">{Number(properties.population_density_per_km2).toLocaleString()}/km²</span>
                    <span>Median Income</span>
                    <span className="text-right">${Number(properties.median_household_income).toLocaleString()}</span>
                    <span>Low Income</span>
                    <span className="text-right">{properties.pct_low_income_lim_at}%</span>
                    <span>Shelter 30%+</span>
                    <span className="text-right">{properties.pct_shelter_cost_30pct_plus}%</span>
                    <span>Household Size</span>
                    <span className="text-right">{properties.avg_household_size}</span>
                </div>
            </div>

            {/* Commute */}
            <div className="mb-3">
                <h4 className="font-medium text-gray-700 mb-1">Commute</h4>
                <div className="flex gap-3 text-gray-600">
                    <span>Car {properties.pct_commute_car}%</span>
                    <span>Transit {properties.pct_commute_transit}%</span>
                    <span>Walk {properties.pct_commute_walk}%</span>
                </div>
            </div>

            {/* Divider */}
            <hr className="my-3 border-gray-200" />

            {/* AI Summary */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-700">AI Insight</h4>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setPersona('resident')}
                            className={`px-2 py-0.5 rounded text-xs ${
                                persona === 'resident'
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                            Resident
                        </button>
                        <button
                            onClick={() => setPersona('planner')}
                            className={`px-2 py-0.5 rounded text-xs ${
                                persona === 'planner'
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                            Planner
                        </button>
                    </div>
                </div>

                {!summary && !loading && !error && (
                    <button
                        onClick={() => generate()}
                        className="w-full py-1.5 rounded text-xs bg-teal-600 text-white hover:bg-teal-700"
                    >
                        Generate AI Summary
                    </button>
                )}
                {loading && (
                    <p className="text-gray-400 text-xs italic">Generating summary...</p>
                )}
                {error && (
                    <>
                        <p className="text-red-500 text-xs">Failed to load summary.</p>
                        <button
                            onClick={() => generate()}
                            className="mt-1 text-xs text-teal-600 hover:underline"
                        >
                            Try again
                        </button>
                    </>
                )}
                {summary && !loading && (
                    <>
                        <p className="text-gray-600 text-xs leading-relaxed">{summary}</p>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-gray-400 text-xs">AI-generated</span>
                            <button
                                onClick={regenerate}
                                className="text-xs text-teal-600 hover:underline"
                            >
                                Regenerate
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
