import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Bug as Bee, MapPin, Thermometer, Droplets, BarChart3, Leaf, MoreVertical, Plus, Edit2, Trash2, Power } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { Button } from '@/components/core/button';
import { Card } from '@/components/core/card';
import { DatePickerField } from '@/components/core/date-picker';
import { Dropdown } from '@/components/core/dropdown';
import { Alert, Progress } from '@/components/core/feedback';
import { Input } from '@/components/core/input';
import { Modal } from '@/components/core/modal';
import { Breadcrumbs } from '@/components/core/navigation';
import { SelectField } from '@/components/core/select-field';
import { AuthenticatedLayout } from '@/layouts/authenticated-layout';
import { cn } from '@/lib/utils';

type HiveCard = {
    id: number;
    name: string;
    species: string | null;
    species_id: number | null;
    location: string | null;
    site_id: number | null;
    status: 'active' | 'inactive';
    age_months: number;
    harvest_count: number;
    readiness_level: string | null;
    hri_value: number;
    avg_temperature: number | null;
    avg_humidity: number | null;
    avg_mq2: number | null;
};

type MasterItem = { id: number; name: string };

type Props = {
    hives: HiveCard[];
    species_list: MasterItem[];
    sites_list: MasterItem[];
};

type ActiveModal =
    | { type: 'create' }
    | { type: 'edit'; hive: HiveCard }
    | { type: 'delete'; hive: HiveCard }
    | { type: 'toggle'; hive: HiveCard }
    | null;

function ReadinessBadge({ level }: { level: string | null }) {
    if (!level) return <span className="text-amber-900/40 text-sm">No data yet</span>;
    const styles: Record<string, string> = {
        'Not Ready':        'bg-rose-100 text-rose-700',
        'Approaching':      'bg-amber-100 text-amber-700',
        'Nearly Ready':     'bg-yellow-100 text-yellow-700',
        'Ready to Harvest': 'bg-emerald-100 text-emerald-700',
    };
    return (
        <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-sm font-bold', styles[level] ?? 'bg-gray-100 text-gray-500')}>
            {level}
        </span>
    );
}

export default function Dashboard({ hives, species_list, sites_list }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [selectedHive, setSelectedHive] = useState<HiveCard | null>(null);
    const [activeModal, setActiveModal]   = useState<ActiveModal>(null);
    const [deleting, setDeleting]         = useState(false);
    const close = () => setActiveModal(null);

    const speciesOptions = [
        { value: '', label: '— None —' },
        ...species_list.map(s => ({ value: String(s.id), label: s.name })),
    ];
    const siteOptions = [
        { value: '', label: '— None —' },
        ...sites_list.map(s => ({ value: String(s.id), label: s.name })),
    ];
    const statusOptions = [
        { value: 'active',   label: 'Active'   },
        { value: 'inactive', label: 'Inactive' },
    ];

    const createForm = useForm({ name: '', species_id: '', site_id: '' });

    const editForm = useForm({ name: '', species_id: '', site_id: '', status: 'active' });

    const openEdit = (hive: HiveCard) => {
        editForm.setData({
            name:       hive.name,
            species_id: hive.species_id ? String(hive.species_id) : '',
            site_id:    hive.site_id    ? String(hive.site_id)    : '',
            status:     hive.status,
        });
        setActiveModal({ type: 'edit', hive });
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('hives.store'), { onSuccess: () => { createForm.reset(); close(); } });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (activeModal?.type !== 'edit') return;
        editForm.patch(route('hives.update', { hive: activeModal.hive.id }), { onSuccess: () => close() });
    };

    const confirmToggle = () => {
        if (activeModal?.type !== 'toggle') return;
        router.patch(route('hives.toggle-status', { hive: activeModal.hive.id }), {}, { onSuccess: () => close() });
    };

    const confirmDelete = () => {
        if (activeModal?.type !== 'delete') return;
        setDeleting(true);
        router.delete(route('hives.destroy', { hive: activeModal.hive.id }), {
            onFinish: () => { setDeleting(false); close(); setSelectedHive(null); },
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="My Hives" />
            <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">

                {/* Breadcrumb + page nav */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'My Hives' }]} />
                    <nav className="flex gap-1 bg-yellow-100/50 rounded-2xl p-1.5">
                        <Link href="/dashboard" className="px-4 py-2 text-sm rounded-xl transition-all whitespace-nowrap bg-white shadow-sm font-semibold text-amber-900">
                            My Hives
                        </Link>
                        <Link href="/harvests" className="px-4 py-2 text-sm rounded-xl transition-all whitespace-nowrap text-amber-900/60 hover:bg-yellow-200/50">
                            Harvests
                        </Link>
                    </nav>
                </div>

                {flash?.success && <Alert variant="success">{flash.success}</Alert>}
                {flash?.error   && <Alert variant="error">{flash.error}</Alert>}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Left: Hive list */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-amber-900">Your Hives</h3>
                            <Button variant="outline" size="sm" onClick={() => setActiveModal({ type: 'create' })}>
                                <Plus className="w-4 h-4 mr-1" /> New Hive
                            </Button>
                        </div>

                        {hives.length === 0 ? (
                            <div className="text-center py-16 border-4 border-dashed border-yellow-200 rounded-3xl">
                                <div className="bg-yellow-100 p-6 rounded-full mb-4 inline-block">
                                    <Bee className="w-10 h-10 text-yellow-600" />
                                </div>
                                <p className="text-amber-900 font-semibold">No hives yet.</p>
                                <p className="text-amber-700/60 text-sm mt-1">Create your first hive to get started.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {hives.map((hive) => (
                                    <motion.div key={hive.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                                        <Card
                                            className={cn(
                                                'cursor-pointer transition-all border-2',
                                                selectedHive?.id === hive.id
                                                    ? 'border-yellow-400 ring-4 ring-yellow-400/10'
                                                    : 'border-transparent'
                                            )}
                                            onClick={() => setSelectedHive(hive)}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-bold text-lg text-amber-900">{hive.name}</h3>
                                                    <p className="text-sm text-amber-700 italic">{hive.species ?? 'Unknown species'}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {hive.location && (
                                                        <div className="bg-yellow-50 p-1.5 rounded-lg flex items-center gap-1 text-xs text-amber-700">
                                                            <MapPin className="w-3 h-3" /> {hive.location}
                                                        </div>
                                                    )}
                                                    <Dropdown
                                                        align="right"
                                                        trigger={
                                                            <button
                                                                onClick={e => e.stopPropagation()}
                                                                className="p-1.5 hover:bg-yellow-100 rounded-xl transition-colors"
                                                            >
                                                                <MoreVertical className="w-4 h-4 text-amber-900/50" />
                                                            </button>
                                                        }
                                                        items={[
                                                            {
                                                                id: 'edit',
                                                                label: 'Edit Hive',
                                                                icon: <Edit2 className="w-4 h-4" />,
                                                                onClick: () => openEdit(hive),
                                                            },
                                                            {
                                                                id: 'toggle',
                                                                label: hive.status === 'active' ? 'Set Inactive' : 'Set Active',
                                                                icon: <Power className="w-4 h-4" />,
                                                                onClick: () => setActiveModal({ type: 'toggle', hive }),
                                                            },
                                                            {
                                                                id: 'delete',
                                                                label: 'Delete Hive',
                                                                icon: <Trash2 className="w-4 h-4" />,
                                                                variant: 'danger' as const,
                                                                onClick: () => setActiveModal({ type: 'delete', hive }),
                                                            },
                                                        ]}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-amber-600/60 font-medium uppercase text-[10px] tracking-wider">Age</span>
                                                    <span className="font-semibold">{hive.age_months}m</span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-amber-600/60 font-medium uppercase text-[10px] tracking-wider">Harvests</span>
                                                    <span className="font-semibold">{hive.harvest_count}</span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-amber-600/60 font-medium uppercase text-[10px] tracking-wider">Status</span>
                                                    <span className={cn('font-semibold text-xs', hive.status === 'active' ? 'text-emerald-600' : 'text-rose-500')}>
                                                        {hive.status === 'active' ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-amber-900/40">
                                                    <span>Readiness</span>
                                                    <span>{Math.round(hive.hri_value * 100)}%</span>
                                                </div>
                                                <Progress value={hive.hri_value * 100} />
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Detail panel */}
                    <div className="lg:col-span-7">
                        <AnimatePresence mode="wait">
                            {selectedHive ? (
                                <motion.div
                                    key={selectedHive.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-6"
                                >
                                    <Card className="bg-gradient-to-br from-yellow-400 to-amber-500 text-white border-none p-8 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-8 opacity-10">
                                            <Leaf className="w-32 h-32" />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Leaf className="w-5 h-5" />
                                                <span className="text-sm font-bold uppercase tracking-widest opacity-80">Readiness Score</span>
                                            </div>
                                            <div className="flex items-baseline gap-4">
                                                <span className="text-7xl font-black tracking-tighter">
                                                    {Math.round(selectedHive.hri_value * 100)}%
                                                </span>
                                                <div className="bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full text-sm font-bold">
                                                    {selectedHive.readiness_level ?? 'No prediction yet'}
                                                </div>
                                            </div>
                                            <div className="mt-6 flex items-center gap-6">
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Total Harvests</p>
                                                    <p className="text-xl font-bold">{selectedHive.harvest_count}</p>
                                                </div>
                                                <div className="w-px h-10 bg-white/20" />
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Hive Age</p>
                                                    <p className="text-xl font-bold">{selectedHive.age_months} months</p>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>

                                    {(selectedHive.avg_temperature !== null || selectedHive.avg_humidity !== null || selectedHive.avg_mq2 !== null) && (
                                        <div className="grid grid-cols-3 gap-4">
                                            <Card>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Thermometer className="w-4 h-4 text-orange-400" />
                                                    <span className="text-xs font-bold uppercase tracking-wider text-amber-900/50">Avg Temp</span>
                                                </div>
                                                <p className="text-2xl font-black text-amber-900">
                                                    {selectedHive.avg_temperature !== null ? `${selectedHive.avg_temperature}°C` : '—'}
                                                </p>
                                            </Card>
                                            <Card>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Droplets className="w-4 h-4 text-blue-400" />
                                                    <span className="text-xs font-bold uppercase tracking-wider text-amber-900/50">Avg Humidity</span>
                                                </div>
                                                <p className="text-2xl font-black text-amber-900">
                                                    {selectedHive.avg_humidity !== null ? `${selectedHive.avg_humidity}%` : '—'}
                                                </p>
                                            </Card>
                                            <Card>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <BarChart3 className="w-4 h-4 text-purple-400" />
                                                    <span className="text-xs font-bold uppercase tracking-wider text-amber-900/50">Avg MQ2</span>
                                                </div>
                                                <p className="text-2xl font-black text-amber-900">
                                                    {selectedHive.avg_mq2 !== null ? selectedHive.avg_mq2 : '—'}
                                                </p>
                                            </Card>
                                        </div>
                                    )}

                                    <Card>
                                        <p className="text-xs font-bold uppercase tracking-widest text-amber-900/40 mb-3">Latest Prediction</p>
                                        <ReadinessBadge level={selectedHive.readiness_level} />
                                        {!selectedHive.readiness_level && (
                                            <p className="text-xs text-amber-900/40 mt-2">
                                                Predictions appear once sensor data has been collected and processed by the ML model.
                                            </p>
                                        )}
                                    </Card>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full flex flex-col items-center justify-center min-h-[400px] text-center p-12 border-4 border-dashed border-yellow-200 rounded-3xl"
                                >
                                    <div className="bg-yellow-100 p-6 rounded-full mb-6">
                                        <Bee className="w-12 h-12 text-yellow-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-amber-900 mb-2">Select a Hive</h3>
                                    <p className="text-amber-700 max-w-xs">
                                        Choose one of your hives from the list to see its readiness score and sensor summary.
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* ── Create Hive Modal ── */}
            <Modal isOpen={activeModal?.type === 'create'} onClose={close} title="New Hive" maxWidth="sm">
                <form onSubmit={submitCreate} className="space-y-4">
                    <Input
                        label="Hive Name"
                        value={createForm.data.name}
                        onChange={e => createForm.setData('name', e.target.value)}
                        placeholder="e.g. Hive Alpha"
                        autoFocus
                        error={createForm.errors.name}
                    />
                    <SelectField
                        label="Species (optional)"
                        value={createForm.data.species_id}
                        onChange={v => createForm.setData('species_id', v)}
                        options={speciesOptions}
                        error={createForm.errors.species_id}
                    />
                    <SelectField
                        label="Site (optional)"
                        value={createForm.data.site_id}
                        onChange={v => createForm.setData('site_id', v)}
                        options={siteOptions}
                        error={createForm.errors.site_id}
                    />
                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={close} className="flex-1">Cancel</Button>
                        <Button type="submit" variant="primary" disabled={createForm.processing} className="flex-1">
                            {createForm.processing ? 'Creating...' : 'Create Hive'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ── Edit Hive Modal ── */}
            {activeModal?.type === 'edit' && (
                <Modal isOpen onClose={close} title="Edit Hive" maxWidth="sm">
                    <form onSubmit={submitEdit} className="space-y-4">
                        <Input
                            label="Hive Name"
                            value={editForm.data.name}
                            onChange={e => editForm.setData('name', e.target.value)}
                            autoFocus
                            error={editForm.errors.name}
                        />
                        <SelectField
                            label="Species (optional)"
                            value={editForm.data.species_id}
                            onChange={v => editForm.setData('species_id', v)}
                            options={speciesOptions}
                            error={editForm.errors.species_id}
                        />
                        <SelectField
                            label="Site (optional)"
                            value={editForm.data.site_id}
                            onChange={v => editForm.setData('site_id', v)}
                            options={siteOptions}
                            error={editForm.errors.site_id}
                        />
                        <SelectField
                            label="Status"
                            value={editForm.data.status}
                            onChange={v => editForm.setData('status', v as 'active' | 'inactive')}
                            options={statusOptions}
                            error={editForm.errors.status}
                        />
                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="ghost" onClick={close} className="flex-1">Cancel</Button>
                            <Button type="submit" variant="primary" disabled={editForm.processing} className="flex-1">
                                {editForm.processing ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ── Toggle Status Confirmation ── */}
            {activeModal?.type === 'toggle' && (
                <Modal isOpen onClose={close} title={activeModal.hive.status === 'active' ? 'Set Hive Inactive' : 'Set Hive Active'} maxWidth="sm">
                    <div className="space-y-4">
                        <p className="text-sm text-amber-900/70">
                            {activeModal.hive.status === 'active'
                                ? `Setting "${activeModal.hive.name}" to inactive will stop it from receiving sensor data.`
                                : `Setting "${activeModal.hive.name}" to active will allow it to receive sensor data again.`}
                        </p>
                        <div className="flex gap-3">
                            <Button type="button" variant="ghost" onClick={close} className="flex-1">Cancel</Button>
                            <Button
                                type="button"
                                variant={activeModal.hive.status === 'active' ? 'destructive' : 'primary'}
                                onClick={confirmToggle}
                                className="flex-1"
                            >
                                {activeModal.hive.status === 'active' ? 'Set Inactive' : 'Set Active'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Delete Confirmation ── */}
            {activeModal?.type === 'delete' && (
                <Modal isOpen onClose={close} title="Delete Hive" maxWidth="sm">
                    <div className="space-y-4">
                        <p className="text-sm text-amber-900/70">
                            Delete <span className="font-semibold text-amber-950">"{activeModal.hive.name}"</span>? This will permanently remove the hive and all its sensor logs. This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <Button type="button" variant="ghost" onClick={close} disabled={deleting} className="flex-1">Cancel</Button>
                            <Button type="button" variant="destructive" onClick={confirmDelete} disabled={deleting} className="flex-1">
                                {deleting ? 'Deleting...' : 'Delete Hive'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </AuthenticatedLayout>
    );
}
