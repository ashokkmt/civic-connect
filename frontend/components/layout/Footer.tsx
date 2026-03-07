import Link from "next/link";

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[var(--surface)]">
            <div className="mx-auto w-full max-w-6xl px-6 py-16">
                <div className="grid gap-12 lg:grid-cols-[1.1fr_2fr]">
                    <div className="space-y-5">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-sm">
                                CC
                            </div>
                            <div>
                                <span className="block text-base font-semibold text-zinc-900 dark:text-white">CivicConnect</span>
                                <span className="block text-xs text-zinc-500 dark:text-zinc-400">Community issue reporting</span>
                            </div>
                        </Link>
                        <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
                            Empowering communities through transparent communication, faster response times, and visible outcomes.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                                Public transparency
                            </span>
                            <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                                Citizen-first
                            </span>
                        </div>
                    </div>
                    <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Platform</h3>
                            <ul className="mt-4 space-y-3 text-sm">
                                <li><Link href="/" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white">Home</Link></li>
                                <li><Link href="/issues" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white">Issues</Link></li>
                                <li><Link href="/register" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white">Report an Issue</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Resources</h3>
                            <ul className="mt-4 space-y-3 text-sm">
                                <li><Link href="/docs" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white">Documentation</Link></li>
                                <li><Link href="/faq" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white">FAQ</Link></li>
                                <li><Link href="/contact" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white">Contact Support</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Legal</h3>
                            <ul className="mt-4 space-y-3 text-sm">
                                <li><Link href="/privacy" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white">Privacy Policy</Link></li>
                                <li><Link href="/terms" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white">Terms of Service</Link></li>
                                <li><Link href="/mission" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white">Our Mission</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-[var(--border)] pt-6 text-xs text-zinc-500 dark:text-zinc-400 md:flex-row md:items-center">
                    <p>&copy; {currentYear} CivicConnect. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                        <a href="#" className="transition hover:text-zinc-900 dark:hover:text-white">Twitter</a>
                        <a href="#" className="transition hover:text-zinc-900 dark:hover:text-white">GitHub</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
