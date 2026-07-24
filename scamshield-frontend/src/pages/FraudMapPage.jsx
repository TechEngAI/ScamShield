import React, { useState, useEffect } from 'react';
import { getScamsByState } from '../services/api';
import NigeriaMapSVG from '../components/NigeriaMapSVG';

const FraudMapPage = () => {
  const [stateData, setStateData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedState, setSelectedState] = useState(null);

  useEffect(() => {
    document.title = 'Nigeria Fraud Map | ScamShield NG';
    getScamsByState()
      .then(data => setStateData(Array.isArray(data) ? data : []))
      .catch(() => setStateData([]))
      .finally(() => setIsLoading(false));
  }, []);

  // Get color intensity based on count
  const getStateColor = (stateName) => {
    const stateInfo = stateData.find(s => s.state === stateName);
    if (!stateInfo) return '#1E293B';
    const maxCount = Math.max(...stateData.map(s => s.count), 1);
    const intensity = stateInfo.count / maxCount;
    if (intensity > 0.7) return '#DC2626'; // high — red
    if (intensity > 0.4) return '#D97706'; // medium — amber
    return '#1D4ED8'; // low — blue
  };

  const getStateData = (stateName) => {
    return stateData.find(s => s.state === stateName) || null;
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-3">
            🗺️ Nigeria Fraud Map
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Real-time scam activity detected by ScamShield NG
            across Nigerian states
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-600"></div>
            <span className="text-slate-400 text-sm">High activity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-600"></div>
            <span className="text-slate-400 text-sm">Medium activity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-700"></div>
            <span className="text-slate-400 text-sm">Low activity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-800"></div>
            <span className="text-slate-400 text-sm">No data</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* SVG Map */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 border border-slate-700
              rounded-2xl p-6">
              <NigeriaMapSVG
                getStateColor={getStateColor}
                getStateData={getStateData}
                onStateClick={setSelectedState}
                selectedState={selectedState}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* Selected state info */}
            {selectedState && (
              <div className="bg-slate-800 border border-slate-700
                rounded-xl p-4">
                <h3 className="text-white font-bold text-lg mb-2">
                  {selectedState}
                </h3>
                {getStateData(selectedState) ? (
                  <div>
                    <p className="text-red-400 text-3xl font-bold">
                      {getStateData(selectedState).count}
                    </p>
                    <p className="text-slate-400 text-sm">
                      scams detected
                    </p>
                    <p className="text-slate-500 text-xs mt-2">
                      {getStateData(selectedState).percentage}% of all
                      Nigerian scam activity
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">
                    No scam activity detected yet
                  </p>
                )}
              </div>
            )}

            {/* Top states leaderboard */}
            <div className="bg-slate-800 border border-slate-700
              rounded-xl p-4">
              <h3 className="text-white font-medium mb-4">
                🏆 Most Affected States
              </h3>
              {isLoading ? (
                <div className="space-y-3">
                  {[1,2,3,4,5].map(i => (
                    <div key={i}
                      className="h-8 bg-slate-700 rounded animate-pulse">
                    </div>
                  ))}
                </div>
              ) : stateData.length === 0 ? (
                <p className="text-slate-500 text-sm">
                  No data yet — check more messages to populate the map
                </p>
              ) : (
                <div className="space-y-3">
                  {stateData.slice(0, 10).map((item, index) => (
                    <div key={item.state}
                      className="flex items-center gap-3 cursor-pointer
                        hover:bg-slate-700 rounded-lg p-2 transition-colors"
                      onClick={() => setSelectedState(item.state)}>
                      <span className="text-slate-500 text-sm w-5 text-right">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-white text-sm">
                            {item.state}
                          </span>
                          <span className="text-red-400 text-sm font-medium">
                            {item.count}
                          </span>
                        </div>
                        <div className="bg-slate-700 rounded-full h-1.5">
                          <div
                            className="bg-red-500 h-1.5 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center bg-slate-800 border border-slate-700
          rounded-2xl p-8">
          <p className="text-white font-bold text-xl mb-2">
            Protect yourself from fraud in your state
          </p>
          <p className="text-slate-400 mb-6">
            ScamShield NG detects scams targeting Nigerians in every state
          </p>
          <div className="flex gap-4 justify-center">
            <a href="/check"
              className="bg-blue-600 hover:bg-blue-700 text-white
                px-8 py-3 rounded-xl font-medium transition-colors">
              Check a Message
            </a>
            <a href="/register"
              className="border border-slate-600 hover:border-slate-400
                text-slate-300 px-8 py-3 rounded-xl font-medium
                transition-colors">
              Create Free Account
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FraudMapPage;