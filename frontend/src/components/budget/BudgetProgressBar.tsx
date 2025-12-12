import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface BudgetProgressBarProps {
  annual: number;
  spent: number;
  committed: number;
  available: number;
  alerts?: Array<{ percentage: number; triggered: boolean }>;
  showDetails?: boolean;
}

const BudgetProgressBar = ({
  annual,
  spent,
  committed,
  available,
  alerts = [],
  showDetails = true,
}: BudgetProgressBarProps) => {
  const spentPercentage = annual > 0 ? (spent / annual) * 100 : 0;
  const committedPercentage = annual > 0 ? (committed / annual) * 100 : 0;
  const totalUsedPercentage = spentPercentage + committedPercentage;

  // Determinar el estado del presupuesto
  const getStatus = () => {
    if (totalUsedPercentage >= 100) {
      return { color: 'red', label: 'Excedido', icon: XCircle };
    }
    if (totalUsedPercentage >= 90) {
      return { color: 'orange', label: 'Crítico', icon: AlertTriangle };
    }
    if (totalUsedPercentage >= 75) {
      return { color: 'yellow', label: 'Alerta', icon: AlertTriangle };
    }
    return { color: 'green', label: 'Normal', icon: CheckCircle };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <div className="space-y-3">
      {/* Header con estado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon
            className={`w-5 h-5 ${
              status.color === 'red'
                ? 'text-red-600'
                : status.color === 'orange'
                ? 'text-orange-600'
                : status.color === 'yellow'
                ? 'text-yellow-600'
                : 'text-green-600'
            }`}
          />
          <span
            className={`text-sm font-medium ${
              status.color === 'red'
                ? 'text-red-700'
                : status.color === 'orange'
                ? 'text-orange-700'
                : status.color === 'yellow'
                ? 'text-yellow-700'
                : 'text-green-700'
            }`}
          >
            {status.label}
          </span>
        </div>
        <span className="text-sm font-medium text-gray-700">
          {totalUsedPercentage.toFixed(1)}% utilizado
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="relative h-8 bg-gray-200 rounded-lg overflow-hidden">
        {/* Gastado */}
        <div
          className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${Math.min(spentPercentage, 100)}%` }}
          title={`Gastado: ${spentPercentage.toFixed(1)}%`}
        />
        {/* Comprometido */}
        <div
          className="absolute top-0 h-full bg-yellow-400 transition-all duration-300"
          style={{
            left: `${Math.min(spentPercentage, 100)}%`,
            width: `${Math.min(committedPercentage, Math.max(0, 100 - spentPercentage))}%`,
          }}
          title={`Comprometido: ${committedPercentage.toFixed(1)}%`}
        />

        {/* Líneas de alerta */}
        {alerts.map((alert, index) => (
          <div
            key={index}
            className="absolute top-0 h-full w-0.5 bg-red-500 opacity-50"
            style={{ left: `${alert.percentage}%` }}
            title={`Alerta: ${alert.percentage}%`}
          />
        ))}

        {/* Texto en la barra */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-800 drop-shadow-sm">
            ${available.toLocaleString()} disponible
          </span>
        </div>
      </div>

      {/* Detalles */}
      {showDetails && (
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-xs text-gray-600">Gastado</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              ${spent.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">{spentPercentage.toFixed(1)}%</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-3 h-3 bg-yellow-400 rounded"></div>
              <span className="text-xs text-gray-600">Comprometido</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              ${committed.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">{committedPercentage.toFixed(1)}%</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-xs text-gray-600">Disponible</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              ${available.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">
              {((available / annual) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Total anual */}
      <div className="pt-2 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Presupuesto Anual:</span>
          <span className="text-sm font-bold text-gray-900">
            ${annual.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BudgetProgressBar;
