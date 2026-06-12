import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { BeeIcon as Bee } from '@/components/core/bee-icon';
import { Button } from '@/components/core/button';

interface Props {
    dashboardHref: string;
    hasThesis: boolean;
    onReadResearch: () => void;
}

export function HeroSection({ dashboardHref, hasThesis, onReadResearch }: Props) {
    return (
        <section className="relative flex min-h-screen flex-col justify-center overflow-hidden px-6 py-20 md:px-20">
            <motion.div
                initial={{ x: '150%', skewX: -12 }}
                animate={{ x: '25%', skewX: -12 }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="absolute top-0 right-0 z-0 hidden h-full w-1/2 bg-yellow-400 lg:block"
            />

            <div className="relative z-10 max-w-5xl">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.4 }}
                    className="mb-6 flex items-center gap-2"
                >
                    <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold tracking-widest text-yellow-950 uppercase">
                        The Future of Meliponiculture
                    </span>
                </motion.div>

                <h1 className="mb-8 text-[12vw] leading-[0.85] font-black tracking-tighter text-amber-950 uppercase lg:text-[100px]">
                    <motion.span
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.52, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="block"
                    >
                        Buzzy
                    </motion.span>
                    <motion.span
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.64, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="block text-yellow-500"
                    >
                        Hive 2.0
                    </motion.span>
                </h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.74 }}
                    className="mb-10 max-w-xl text-justify text-xl leading-snug font-medium text-amber-900/70 lg:text-2xl"
                >
                    IoT sensors on every hive. A KNN model that classifies harvest readiness in real
                    time. One dashboard for every hive, harvest, and inspection. Built for kelulut
                    beekeepers.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.86 }}
                    className="flex flex-wrap gap-4"
                >
                    <Link href={dashboardHref}>
                        <Button size="lg" className="group">
                            Launch Dashboard{' '}
                            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={onReadResearch}
                        disabled={!hasThesis}
                        title={!hasThesis ? 'No thesis uploaded yet' : undefined}
                    >
                        Read Research
                    </Button>
                </motion.div>
            </div>

            <motion.div
                animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-1/4 right-1/4 hidden lg:block"
            >
                <div className="rotate-12 rounded-3xl border border-yellow-100 bg-white p-6 shadow-2xl">
                    <Bee className="h-16 w-16 text-yellow-500" />
                </div>
            </motion.div>
        </section>
    );
}
