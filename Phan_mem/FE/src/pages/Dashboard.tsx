import SensorCard from '../components/dashboard/SensorCard.tsx';
import SensorChart from '../components/dashboard/SensorChart.tsx';
import DeviceControl from '../components/dashboard/DeviceControl.tsx';
import { useRealtimeData, useDevices } from '../hooks/useRealtimeData.ts';
import { CardSkeleton } from '../components/common/Loading.tsx';

export default function Dashboard() {
  const { values, chartData } = useRealtimeData();
  const { devices, loading: devicesLoading, refetch } = useDevices();

  return (
    <div className="flex-1 flex flex-col gap-5 animate-fade-in min-h-0">
      {/* Sensor Cards Row - 3 cột chia đều */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-shrink-0">
        <SensorCard
          type="temperature"
          value={values.temperature}
          change={values.temperatureChange}
          updatedAt={values.updatedAt}
        />
        <SensorCard
          type="humidity"
          value={values.humidity}
          change={values.humidityChange}
          updatedAt={values.updatedAt}
        />
        <SensorCard
          type="light"
          value={values.light}
          change={values.lightChange}
          updatedAt={values.updatedAt}
        />
      </div>

      {/* Chart + Device Control Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1 min-h-0">
        <div className="lg:col-span-3 h-full flex flex-col">
          <SensorChart data={chartData} />
        </div>
        <div className="lg:col-span-2 h-full flex flex-col">
          {devicesLoading ? (
            <CardSkeleton />
          ) : (
            <DeviceControl devices={devices} onUpdate={refetch} />
          )}
        </div>
      </div>
    </div>
  );
}
