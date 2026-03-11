import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Impressum() {
    return (
        <div className="min-h-screen bg-obsidian text-ivory font-sans">

            {/* Back nav */}
            <div className="px-6 sm:px-12 lg:px-24 pt-10">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-ivory/50 hover:text-champagne transition-colors text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Zurück zur Startseite
                </Link>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-6 sm:px-12 py-16 flex flex-col gap-10">

                <div className="flex flex-col gap-2">
                    <span className="font-mono text-xs text-champagne uppercase tracking-widest">Rechtliches</span>
                    <h1 className="font-drama text-4xl sm:text-5xl text-ivory">Impressum</h1>
                </div>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">Angaben gemäß § 5 ECG</h2>
                    <div className="flex flex-col gap-1 text-ivory/80 leading-relaxed">
                        <p className="font-semibold text-ivory">Elité Auto Aufbereitung</p>
                        <p>Bundesstraße 2a</p>
                        <p>6714 Nüziders</p>
                        <p>Österreich</p>
                    </div>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">Kontakt</h2>
                    <div className="flex flex-col gap-1 text-ivory/80 leading-relaxed">
                        <p>Telefon: <a href="tel:+436642546078" className="text-champagne hover:underline">+43 664 2546078</a></p>
                        <p>E-Mail: <a href="mailto:info.eliteaufbereitung@gmail.com" className="text-champagne hover:underline">info.eliteaufbereitung@gmail.com</a></p>
                    </div>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">Unternehmensangaben</h2>
                    <div className="flex flex-col gap-1 text-ivory/80 leading-relaxed">
                        <p>Inhaber: Matthias Kaufmann</p>
                        <p>UID-Nummer: ATU78342619</p>
                        <p>Mitglied der Wirtschaftskammer Vorarlberg</p>
                        <p>Gewerbebehörde: Bezirkshauptmannschaft Bludenz</p>
                        <p>Gerichtsstand: Feldkirch</p>
                    </div>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">Haftungsausschluss</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Die Inhalte dieser Website wurden mit größtmöglicher Sorgfalt erstellt. Für die Richtigkeit,
                        Vollständigkeit und Aktualität der Inhalte übernehmen wir jedoch keine Gewähr. Als
                        Diensteanbieter sind wir gemäß § 7 Abs. 1 ECG für eigene Inhalte auf diesen Seiten nach
                        den allgemeinen Gesetzen verantwortlich.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">Urheberrecht</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Die durch uns erstellten Inhalte und Werke auf diesen Seiten unterliegen dem österreichischen
                        Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung
                        außerhalb der Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung des jeweiligen
                        Autors bzw. Erstellers.
                    </p>
                </section>

            </div>

            {/* Footer strip */}
            <div className="border-t border-ivory/10 px-6 sm:px-12 lg:px-24 py-8 text-center font-sans text-xs text-ivory/30">
                © 2026 Elité Auto Aufbereitung. Alle Rechte vorbehalten.
            </div>

        </div>
    );
}
