import { Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    ShieldCheck,
    BarChart3,
    Users,
    Zap,
    Globe,
    Leaf,
} from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState } from 'react';
import { BeeIcon as Bee } from '@/components/core/bee-icon';
import { Button } from '@/components/core/button';
import { ScrollArea } from '@/components/core/scroll-area';
import { ThesisModal } from '@/components/core/thesis-modal';
import type { Auth } from '@/types';

type Props = { thesisUrl?: string | null };

export default function LandingPage({ thesisUrl }: Props) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const dashboardHref =
        auth?.user?.role === 'admin' ? '/admin' : '/dashboard';
    const [showThesis, setShowThesis] = useState(false);

    return (
        <ScrollArea className="h-screen bg-[#FFFBEB]">
            {/* Section 1: Editorial Hero (Beekeeper Focus) */}
            <section className="relative flex min-h-screen flex-col justify-center overflow-hidden px-6 py-20 md:px-20">
                <motion.div
                    initial={{ x: '150%', skewX: -12 }}
                    animate={{ x: '25%', skewX: -12 }}
                    transition={{
                        duration: 0.6,
                        ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    className="absolute top-0 right-0 z-0 hidden h-full w-1/2 bg-yellow-400 lg:block"
                />

                <div className="relative z-10 max-w-5xl">
                    {/* 1. Badge drops down after panel settles */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.4 }}
                        className="mb-6 flex items-center justify-center gap-2 lg:justify-start"
                    >
                        <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold tracking-widest text-yellow-950 uppercase">
                            The Future of Meliponiculture
                        </span>
                    </motion.div>

                    {/* 2. Headline — each line staggers in */}
                    <h1 className="mb-8 text-center text-[12vw] leading-[0.85] font-black tracking-tighter text-amber-950 uppercase lg:text-left lg:text-[100px]">
                        <motion.span
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.45,
                                delay: 0.52,
                                ease: [0.25, 0.46, 0.45, 0.94],
                            }}
                            className="block"
                        >
                            Buzzy
                        </motion.span>
                        <motion.span
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.45,
                                delay: 0.64,
                                ease: [0.25, 0.46, 0.45, 0.94],
                            }}
                            className="block text-yellow-500"
                        >
                            Hive 2.0
                        </motion.span>
                    </h1>

                    {/* 3. Subtitle fades in */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.74 }}
                        className="mb-10 max-w-xl text-center text-xl leading-snug font-medium text-amber-900/70 lg:text-justify lg:text-2xl"
                    >
                        IoT sensors on every hive. A KNN model that classifies
                        harvest readiness in real time. One dashboard for every
                        hive, harvest, and inspection. Built for kelulut beekeepers.
                    </motion.p>

                    {/* 4. CTAs slide up last */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.86 }}
                        className="flex flex-wrap justify-center gap-4 lg:justify-start"
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
                            onClick={() => thesisUrl && setShowThesis(true)}
                            disabled={!thesisUrl}
                            title={
                                !thesisUrl
                                    ? 'No thesis uploaded yet'
                                    : undefined
                            }
                        >
                            Read Research
                        </Button>
                    </motion.div>
                </div>

                {/* Floating Bee Elements */}
                <motion.div
                    animate={{
                        y: [0, -20, 0],
                        rotate: [0, 5, 0],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    className="absolute top-1/4 right-1/4 hidden lg:block"
                >
                    <div className="rotate-12 rounded-3xl border border-yellow-100 bg-white p-6 shadow-2xl">
                        <Bee className="h-16 w-16 text-yellow-500" />
                    </div>
                </motion.div>
            </section>

            {/* Section 2: Brutalist Grid (Admin/Management Focus) */}
            <section className="bg-amber-950 px-6 py-24 text-white md:px-20">
                <div className="mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 items-center gap-20 lg:grid-cols-2">
                        <div>
                            <h2 className="mb-8 text-5xl leading-none font-black tracking-tighter uppercase md:text-7xl">
                                BuzzyHive <br />
                                <span className="text-yellow-400">
                                    Intelligence.
                                </span>
                            </h2>
                            <p className="mb-12 max-w-md text-xl text-amber-100/60 lg:text-justify">
                                Modernizing kelulut farming through IoT-driven
                                harvest readiness predictions and real-time hive
                                analytics.
                            </p>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="border-t border-amber-800 pt-6">
                                    <span className="mb-2 block text-4xl font-bold">
                                        HRI
                                    </span>
                                    <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
                                        Readiness Index
                                    </span>
                                </div>
                                <div className="border-t border-amber-800 pt-6">
                                    <span className="mb-2 block text-4xl font-bold">
                                        Multi-Gas
                                    </span>
                                    <span className="text-xs font-bold tracking-widest text-amber-400 uppercase">
                                        Sensor Array
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {[
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
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ scale: 1.02 }}
                                    className="rounded-[2rem] border border-amber-800 bg-amber-900/50 p-8"
                                >
                                    <item.icon className="mb-6 h-10 w-10 text-yellow-400" />
                                    <h3 className="mb-2 text-xl font-bold">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-amber-100/40">
                                        {item.desc}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 3: Clean Utility / Sustainability */}
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
                                transition: {
                                    staggerChildren: 0.12,
                                    delayChildren: 0.1,
                                },
                            },
                        }}
                    >
                        {/* 1. Badge Slide Down */}
                        <motion.div
                            variants={{
                                hidden: { opacity: 0, y: -20 },
                                visible: { opacity: 1, y: 0 },
                            }}
                            className="mb-8 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700"
                        >
                            <Leaf className="h-4 w-4" /> Sustainable Kelulut
                            Farming
                        </motion.div>

                        {/* 2. Headline Reveal */}
                        <motion.h2
                            variants={{
                                hidden: { opacity: 0, y: 30 },
                                visible: {
                                    opacity: 1,
                                    y: 0,
                                    transition: {
                                        duration: 0.8,
                                        ease: 'easeOut',
                                    },
                                },
                            }}
                            className="mb-8 text-4xl font-black tracking-tighter text-amber-950 md:text-6xl"
                        >
                            Preserving the <br />
                            <span className="font-serif text-emerald-600 italic">
                                Stingless Bee
                            </span>{' '}
                            Legacy.
                        </motion.h2>

                        {/* 3. Paragraph Fade */}
                        <motion.p
                            variants={{
                                hidden: { opacity: 0 },
                                visible: {
                                    opacity: 1,
                                    transition: { duration: 1 },
                                },
                            }}
                            className="mb-12 text-lg leading-relaxed text-amber-900/60"
                        >
                            BuzzyHive 2.0 ensures that technology serves nature
                            by monitoring internal hive conditions to detect
                            colony health without human interference. Our goal
                            is to empower beekeepers with data that supports
                            sustainable harvesting and long-term productivity.
                        </motion.p>

                        {/* 4. Staggered Icons with "Hover" Animation */}
                        <div className="flex flex-wrap justify-center gap-12">
                            {[
                                { icon: Globe, label: 'Floral Context' },
                                { icon: Zap, label: 'Non-Invasive' },
                                { icon: Users, label: 'Decision Support' },
                            ].map((item, index) => (
                                <motion.div
                                    key={index}
                                    variants={{
                                        hidden: { opacity: 0, scale: 0.8 },
                                        visible: { opacity: 1, scale: 1 },
                                    }}
                                    whileHover={{
                                        y: -8, // "Bee-like" hover movement
                                        transition: {
                                            repeat: Infinity,
                                            repeatType: 'mirror',
                                            duration: 0.4,
                                        },
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

            {/* Thesis PDF Modal */}
            {thesisUrl && (
                <ThesisModal
                    isOpen={showThesis}
                    onClose={() => setShowThesis(false)}
                    thesisUrl={thesisUrl}
                />
            )}

            {/* Footer */}
            <footer className="bg-yellow-400 px-6 py-20 text-yellow-950 md:px-20">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-5">
                        {/* Brand */}
                        <div className="md:col-span-2">
                            <div className="mb-4 flex items-center gap-2">
                                <Bee className="h-7 w-7" />
                                <span className="text-xl font-black tracking-tighter uppercase">
                                    BuzzyHive 2.0
                                </span>
                            </div>
                            <p className="mb-6 max-w-xs text-sm leading-relaxed text-yellow-900/70">
                                IoT-integrated harvest intelligence for
                                stingless bee farmers. Know exactly when to
                                harvest, every time.
                            </p>
                            <Link href={dashboardHref}>
                                <Button className="bg-yellow-950 text-xs font-bold tracking-tight text-yellow-400 uppercase hover:bg-black">
                                    Launch App
                                </Button>
                            </Link>
                        </div>

                        {/* Product */}
                        <div>
                            <h4 className="mb-5 text-[10px] font-bold tracking-widest uppercase opacity-60">
                                Product
                            </h4>
                            <ul className="space-y-3 text-sm font-medium">
                                <li>
                                    <a
                                        href="#hri-analytics"
                                        className="transition-opacity hover:opacity-60"
                                    >
                                        HRI Analytics
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#hive-management"
                                        className="transition-opacity hover:opacity-60"
                                    >
                                        Hive Management
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#floral-context"
                                        className="transition-opacity hover:opacity-60"
                                    >
                                        Floral Context
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#sensor-health"
                                        className="transition-opacity hover:opacity-60"
                                    >
                                        Sensor Health
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Resources */}
                        <div>
                            <h4 className="mb-5 text-[10px] font-bold tracking-widest uppercase opacity-60">
                                Resources
                            </h4>
                            <ul className="space-y-3 text-sm font-medium">
                                <li>
                                    <button
                                        onClick={() =>
                                            thesisUrl && setShowThesis(true)
                                        }
                                        disabled={!thesisUrl}
                                        className="transition-opacity hover:opacity-60 disabled:cursor-not-allowed disabled:opacity-30"
                                    >
                                        Documentation
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() =>
                                            thesisUrl && setShowThesis(true)
                                        }
                                        disabled={!thesisUrl}
                                        className="transition-opacity hover:opacity-60 disabled:cursor-not-allowed disabled:opacity-30"
                                    >
                                        Research
                                    </button>
                                </li>
                                <li>
                                    <Link
                                        href={dashboardHref}
                                        className="transition-opacity hover:opacity-60"
                                    >
                                        Support
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Company */}
                        <div>
                            <h4 className="mb-5 text-[10px] font-bold tracking-widest uppercase opacity-60">
                                Company
                            </h4>
                            <ul className="space-y-3 text-sm font-medium">
                                <li>
                                    <Link
                                        href={dashboardHref}
                                        className="transition-opacity hover:opacity-60"
                                    >
                                        About
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href={dashboardHref}
                                        className="transition-opacity hover:opacity-60"
                                    >
                                        Contact
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-between gap-4 border-t border-yellow-900/10 pt-8 text-[10px] font-black tracking-widest uppercase opacity-40 md:flex-row">
                        <div>© 2026 BuzzyHive 2.0. All rights reserved.</div>
                        <div>FYP · Universiti Teknologi MARA</div>
                    </div>
                </div>
            </footer>
        </ScrollArea>
    );
}
