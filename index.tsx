/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {useState, useCallback, useEffect} from 'react';
import ReactDOM from 'react-dom/client';
import { Line } from 'react-chartjs-2';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';

// Register only the necessary components for a simple visual chart
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
);


const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: false, // Tooltips are not needed for a baby
    },
  },
  scales: {
    y: {
      display: false, // Hide y-axis completely
    },
    x: {
      display: false, // Hide x-axis completely
    }
  },
  elements: {
    line: {
      tension: 0.4,
      borderWidth: 8, // Make the line very thick and easy to see
    },
    point: {
      radius: 0, // No points on the line for a smoother look
    }
  }
};


function App() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchTideData = useCallback(async () => {
    const stationId = '9411340';
    setLoading(true);
    setError(false);
    setChartData(null);

    const now = new Date();
    const beginDate = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // The NOAA API does not provide CORS headers, so direct client-side requests are blocked by browsers.
    // To fix this, we route the request through a CORS proxy.
    const noaaUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?begin_date=${beginDate}&range=5&station=${stationId}&product=predictions&datum=MLLW&units=english&time_zone=lst_ldt&format=json&application=tide-chart-app`;
    // Switched to a more reliable CORS proxy to resolve fetch errors.
    const url = `https://corsproxy.io/?${encodeURIComponent(noaaUrl)}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();

      if (data.error || !data.predictions || data.predictions.length === 0) {
        // Handle cases where proxy returns success but NOAA API returned an error inside the JSON
        throw new Error(data.error?.message || 'Invalid data from NOAA API');
      }
      
      const labels = data.predictions.map(() => ''); // No text labels needed
      const values = data.predictions.map(p => parseFloat(p.v));
      
      setChartData({
        labels,
        datasets: [
          {
            data: values,
            borderColor: '#E1C699', // Sandy tan color for the line
            backgroundColor: 'rgba(2, 119, 189, 0.3)', // Lighter, more transparent ocean blue
            fill: true,
          },
        ],
      });

    } catch (e) {
      console.error(e); // Log the error for debugging
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchTideData();
  }, [fetchTideData]);


  return (
    <main className="container">
      {loading && <div className="status-indicator loading" role="status" aria-label="Loading">🌊</div>}
      {error && <div className="status-indicator" role="alert" aria-label="Error">😟</div>}
      
      {chartData && (
        <>
          <section className="chart-container" aria-label="A visual of the water level going up and down.">
             <div style={{ position: 'relative', height: '80vh' }}>
              <Line options={chartOptions} data={chartData} />
             </div>
          </section>
          <button
            className="refresh-button"
            onClick={fetchTideData}
            disabled={loading}
            aria-label="Refresh tide data"
          >
            🔄
          </button>
        </>
      )}
    </main>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);