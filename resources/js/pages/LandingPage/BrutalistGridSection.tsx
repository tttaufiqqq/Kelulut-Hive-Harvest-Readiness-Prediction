import { BarChart3, ShieldCheck, Users, Zap } from 'lucide-react';
import { motion } from 'motion/react';

const FEATURE_CARDS = [
    {
        icon: ShieldCheck,
        title: 'Colony Monitoring',
        desc: 'Track temperature, humidity, and gas levels to detect abnormal hive conditions early.',
    },
    {
        icon: BarChart3,
        title: 'Harvest Analytics',
        desc: 'Transform complex sensor data into actionable honey yield insights.',
    },
    {
        icon: Users,
        title: 'Farm Management',
        desc: 'Role-based access for Admins and Beekeepers to manage multiple farm sites.',
    },
    {
        icon: Zap,
        title: 'Predictive HRI',
        desc: 'Automated analysis of gas patterns to determine the perfect harvest moment.',
    },
];

export function BrutalistGridSection() {
    return (
        <section className="bg-amber-950 px-6 py-24 text-white md:px-20">
            <div className="mx-auto max-w-7xl">
                <div className="grid grid-cols-1 items-center gap-20 lg:grid-cols-2">
                    <div>
                        <h2 className="mb-8 text-5xl leading-none font-black tracking-tighter uppercase md:text-7xl">
                            BuzzyHive <br />
                            <span className="text-yellow-400">Intelligence.</span>
                        </h2>
                        <p className="mb-12 max-w-md text-xl text-amber-100/60 text-justify">
                            Modernizing kelulut farming through IoT-driven harvest readiness
                            predictions and real-time hive analytics.
                        </p>
                        <div className="grid grid-cols-2 gap-8">
                            <div className="border-t border-amber-800 pt-6">
                                <span className="mb-2 block text-4xl font-bold">HRI</span>
                                <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
                                    Readiness Index
                                </span>
                            </div>
                            <div className="border-t border-amber-800 pt-6">
                                <span className="mb-2 block text-4xl font-bold">Multi-Gas</span>
                                <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
                                    Sensor Array
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {FEATURE_CARDS.map((item, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ scale: 1.02 }}
                                className="rounded-[2rem] border border-amber-800 bg-amber-900/50 p-8"
                            >
                                <item.icon className="mb-6 h-10 w-10 text-yellow-400" />
                                <h3 className="mb-2 text-xl font-bold">{item.title}</h3>
                                <p className="text-sm text-amber-100/40">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
