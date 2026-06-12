import { Droplets, Thermometer, Wind } from 'lucide-react';
import { DatePicker } from '@/components/core/date-picker';
import { Card } from '@/components/core/display/card';
import { fmtDate } from '@/lib/format';
import { STATUS_BADGE, STATUS_LABEL, WARN_CO2_ABOVE  } from './constants';
import type {HiveData} from './constants';
import { formatLastReading } from './utils';

export interface HiveMonitorGridProps {
    sortedHives: HiveData[];
    isMonitorLive: boolean;
    monitorDate: string | null;
    monitorLoading: boolean;
    onSelect: (index: number) => void;
    onDateChange: (date: string | null) => void;
}

export function HiveMonitorGrid({ sortedHives, isMonitorLive, monitorDate, monitorLoading, onSelect, onDateChange }: HiveMonitorGridProps) {
    return (
        <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
                <div className="flex items-center gap-2">
                    {isMonitorLive ? (
                        <>
                            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                            <h3 className="text-sm font-black tracking-widest text-amber-900/60 uppercase">Live Hive Monitor</h3>
                        </>
                    ) : (
                        <h3 className="text-sm font-black tracking-widest text-amber-700 uppercase">
                            Hive Monitor &mdash;{' '}
                            {fmtDate(monitorDate)}
                        </h3>
                    )}
                </div>
                <DatePicker value={monitorDate} onChange={onDateChange} placeholder="Pick date..." maxDate="today" />
            </div>
            {monitorLoading ? (
                <div className="flex h-[200px] items-center justify-center text-sm text-amber-900/60">Loading...</div>
            ) : sortedHives.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-amber-900/60">
                    {isMonitorLive ? 'No hives registered yet.' : 'No data for this date.'}
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-yellow-100">
                                <th className="px-3 py-2 text-left text-xs font-bold tracking-widest text-amber-900/60 uppercase">#</th>
                                <th className="px-3 py-2 text-left text-xs font-bold tracking-widest text-amber-900/60 uppercase">Hive</th>
                                <th className="hidden px-3 py-2 text-left text-xs font-bold tracking-widest text-amber-900/60 uppercase sm:table-cell">Beekeeper</th>
                                <th className="hidden px-3 py-2 text-left text-xs font-bold tracking-widest text-amber-900/60 uppercase md:table-cell">Species</th>
                                <th className="hidden px-3 py-2 text-center text-xs font-bold tracking-widest text-amber-900/60 uppercase md:table-cell"><Thermometer className="mr-1 inline h-3 w-3" />Temp</th>
                                <th className="hidden px-3 py-2 text-center text-xs font-bold tracking-widest text-amber-900/60 uppercase md:table-cell"><Droplets className="mr-1 inline h-3 w-3" />Humid</th>
                                <th className="hidden px-3 py-2 text-center text-xs font-bold tracking-widest text-amber-900/60 uppercase md:table-cell"><Wind className="mr-1 inline h-3 w-3" />MQ135</th>
                                <th className="hidden px-3 py-2 text-center text-xs font-bold tracking-widest text-amber-900/60 uppercase md:table-cell">HRI</th>
                                <th className="px-3 py-2 text-center text-xs font-bold tracking-widest text-amber-900/60 uppercase">Status</th>
                                <th className="hidden px-3 py-2 text-center text-xs font-bold tracking-widest text-amber-900/60 uppercase md:table-cell">Last Reading</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedHives.map((hive, index) => (
                                <tr key={hive.id} onClick={() => onSelect(index)} className="cursor-pointer border-b border-yellow-50 transition-colors hover:bg-yellow-50/50">
                                    <td className="px-3 py-3 text-xs font-bold text-amber-900/60 tabular-nums">{index + 1}</td>
                                    <td className="px-3 py-3 font-bold text-amber-900">{hive.hive_name}</td>
                                    <td className="hidden px-3 py-3 text-amber-800 sm:table-cell">{hive.beekeeper}</td>
                                    <td className="hidden px-3 py-3 text-xs text-amber-700 italic md:table-cell">{hive.species}</td>
                                    <td className="hidden px-3 py-3 text-center text-amber-800 md:table-cell">{hive.temp > 0 ? `${hive.temp}°C` : '—'}</td>
                                    <td className="hidden px-3 py-3 text-center text-amber-800 md:table-cell">{hive.humidity > 0 ? `${hive.humidity}%` : '—'}</td>
                                    <td className="hidden px-3 py-3 text-center md:table-cell">
                                        <span className={hive.co2 > WARN_CO2_ABOVE ? 'font-bold text-red-600' : 'text-amber-800'}>{hive.co2 > 0 ? hive.co2 : '—'}</span>
                                    </td>
                                    <td className="hidden px-3 py-3 text-center md:table-cell">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-yellow-100">
                                                <div className="h-full rounded-full bg-yellow-400" style={{ width: `${hive.readiness}%` }} />
                                            </div>
                                            <span className="text-xs font-bold text-amber-900">{hive.readiness}%</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 text-center">
                                        <span className={`rounded-lg px-2 py-1 text-xs font-bold ${STATUS_BADGE[hive.status]}`}>{STATUS_LABEL[hive.status]}</span>
                                    </td>
                                    <td className="hidden px-3 py-3 text-center text-xs text-amber-900/70 md:table-cell">{formatLastReading(hive.last_reading)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
}
