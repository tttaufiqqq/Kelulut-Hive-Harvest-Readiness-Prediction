import { Globe, Leaf, Users, Zap } from 'lucide-react';
import { motion } from 'motion/react';

const ICON_CARDS = [
    { icon: Globe, label: 'Floral Context' },
    { icon: Zap, label: 'Non-Invasive' },
    { icon: Users, label: 'Decision Support' },
];

export function SustainabilitySection() {
    return (
        <section className="overflow-hidden bg-white px-6 py-24 md:px-20">
            <div className="mx-auto max-w-4xl text-center">
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-100px' }}
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: { staggerChildren: 0.12, delayChildren: 0.1 },
                        },
                    }}
                >
                    <motion.div
                        variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}
                        className="mb-8 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700"
                    >
                        <Leaf className="h-4 w-4" /> Sustainable Kelulut Farming
                    </motion.div>

                    <motion.h2
                        variants={{
                            hidden: { opacity: 0, y: 30 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
                        }}
                        className="mb-8 text-4xl font-black tracking-tighter text-amber-950 md:text-6xl"
                    >
                        Preserving the <br />
                        <span className="font-serif text-emerald-600 italic">Stingless Bee</span>{' '}
                        Legacy.
                    </motion.h2>

                    <motion.p
                        variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1, transition: { duration: 1 } },
                        }}
                        className="mb-12 text-lg leading-relaxed text-amber-900/60"
                    >
                        BuzzyHive 2.0 ensures that technology serves nature by monitoring internal
                        hive conditions to detect colony health without human interference. Our goal
                        is to empower beekeepers with data that supports sustainable harvesting and
                        long-term productivity.
                    </motion.p>

                    <div className="flex flex-wrap justify-center gap-12">
                        {ICON_CARDS.map((item, index) => (
                            <motion.div
                                key={index}
                                variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}
                                whileHover={{
                                    y: -8,
                                    transition: { repeat: Infinity, repeatType: 'mirror', duration: 0.4 },
                                }}
                                className="flex flex-col items-center"
                            >
                                <item.icon className="mb-4 h-8 w-8 text-amber-900" />
                                <span className="text-sm font-bold tracking-widest text-amber-950 uppercase">
                                    {item.label}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
