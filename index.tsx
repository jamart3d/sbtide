/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {useState, useCallback, useEffect, useMemo} from 'react';
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

function App() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tickColors, setTickColors] = useState([]);

  const chartOptions = useMemo(() => ({
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
        display: true, // Show x-axis for sun/moon icons
        grid: {
          display: false, // No grid lines for a cleaner look
        },
        ticks: {
          font: {
            size: 32, // Make icons large and friendly
          },
          padding: 10,
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
          color: tickColors,
        },
        border: {
          display: false, // Hide the axis line
        }
      }
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 0,
      },
      point: {
        radius: 0, // No points on the line for a smoother look
      }
    }
  }), [tickColors]);

  const fetchTideData = useCallback(async () => {
    const stationId = '9411340';
    setLoading(true);
    setError(false);
    setChartData(null);

    const now = new Date();
    const beginDate = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const noaaUrl = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?begin_date=${beginDate}&range=5&station=${stationId}&product=predictions&datum=MLLW&units=english&time_zone=lst_ldt&format=json&application=tide-chart-app`;
    const url = `https://corsproxy.io/?${encodeURIComponent(noaaUrl)}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();

      if (data.error || !data.predictions || data.predictions.length === 0) {
        throw new Error(data.error?.message || 'Invalid data from NOAA API');
      }
      
      const predictions = data.predictions;
      const numPredictions = predictions.length;
      const values = predictions.map(p => parseFloat(p.v) * -1);
      const labels = Array(numPredictions).fill('');
      const colors = Array(numPredictions).fill('transparent');

      if (numPredictions > 0) {
        const indices = [
          0,
          Math.floor((numPredictions - 1) / 4),
          Math.floor(2 * (numPredictions - 1) / 4),
          Math.floor(3 * (numPredictions - 1) / 4),
          numPredictions - 1
        ];
        
        new Set(indices).forEach(index => {
          const p = predictions[index];
          const predictionDate = new Date(p.t);
          const hour = predictionDate.getHours();
          if (hour >= 6 && hour < 18) {
            labels[index] = '☀️';
            colors[index] = '#FFA500';
          } else {
            labels[index] = '🌙';
            colors[index] = '#ADD8E6';
          }
        });
      }
      
      setTickColors(colors);
      setChartData({
        labels,
        datasets: [
          {
            data: values,
            borderColor: 'transparent',
            backgroundColor: '#E1C699', // --dark-sand
            fill: 'start',
          },
          {
            data: values,
            borderColor: 'transparent',
            backgroundColor: '#87CEEB', // --ocean-blue
            fill: 'end',
          },
        ],
      });

    } catch (e) {
      console.error(e);
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