// components/charts/PieChart.jsx
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, Filler);

const PieChart = ({ data, title }) => {
  return (
    <div className="h-80 flex">
      <div className="w-2/3">
        <Pie 
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
              }
            }
          }}
        />
      </div>
      <div className="w-1/3 pl-4 flex flex-col justify-center">
        {data.labels.map((label, index) => (
          <div key={index} className="flex items-center mb-2">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{backgroundColor: data.datasets[0].backgroundColor[index]}}
            ></div>
            <span className="text-sm text-gray-600">{label}:</span>
            <span className="text-sm font-medium ml-1">
              {data.datasets[0].data[index]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PieChart;