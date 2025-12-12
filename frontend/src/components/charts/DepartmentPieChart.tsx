import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { DepartmentData } from '@/services/dashboardService';

// Registrar componentes de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

interface DepartmentPieChartProps {
  data: DepartmentData[];
}

const DepartmentPieChart = ({ data }: DepartmentPieChartProps) => {
  const colors = [
    'rgba(59, 130, 246, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(20, 184, 166, 0.8)',
    'rgba(251, 146, 60, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(168, 85, 247, 0.8)',
  ];

  const borderColors = [
    'rgb(59, 130, 246)',
    'rgb(16, 185, 129)',
    'rgb(245, 158, 11)',
    'rgb(239, 68, 68)',
    'rgb(139, 92, 246)',
    'rgb(236, 72, 153)',
    'rgb(20, 184, 166)',
    'rgb(251, 146, 60)',
    'rgb(34, 197, 94)',
    'rgb(168, 85, 247)',
  ];

  const chartData = {
    labels: data.map((item) => item.name),
    datasets: [
      {
        label: 'Gasto por Departamento',
        data: data.map((item) => item.amount),
        backgroundColor: colors.slice(0, data.length),
        borderColor: borderColors.slice(0, data.length),
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'USD',
              }).format(context.parsed);
            }

            // Calcular porcentaje
            const total = data.reduce((sum, item) => sum + item.amount, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            label += ` (${percentage}%)`;

            const count = data[context.dataIndex]?.count;
            if (count) {
              label += ` - ${count} requisiciones`;
            }
            return label;
          },
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

export default DepartmentPieChart;
