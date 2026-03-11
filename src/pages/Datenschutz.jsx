import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Datenschutz() {
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
                    <h1 className="font-drama text-4xl sm:text-5xl text-ivory">Datenschutzerklärung</h1>
                </div>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">1. Verantwortlicher</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Verantwortlich für die Datenverarbeitung auf dieser Website ist:<br /><br />
                        <span className="text-ivory font-semibold">Elité Auto Aufbereitung</span><br />
                        Bundesstraße 2a, 6714 Nüziders, Österreich<br />
                        Tel: <a href="tel:+436642546078" className="text-champagne hover:underline">+43 664 2546078</a><br />
                        E-Mail: <a href="mailto:info.eliteaufbereitung@gmail.com" className="text-champagne hover:underline">info.eliteaufbereitung@gmail.com</a>
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">2. Erhebung und Verarbeitung personenbezogener Daten</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Wir erheben personenbezogene Daten nur, wenn Sie uns diese im Rahmen einer Terminanfrage
                        freiwillig mitteilen. Dies betrifft folgende Daten:
                    </p>
                    <ul className="list-disc list-inside text-ivory/70 text-sm leading-relaxed flex flex-col gap-1 ml-2">
                        <li>Vor- und Nachname</li>
                        <li>Telefonnummer</li>
                        <li>E-Mail-Adresse</li>
                        <li>Fahrzeugtyp und optionale Anmerkungen</li>
                    </ul>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Diese Daten werden ausschließlich zur Bearbeitung Ihrer Terminanfrage verwendet und nicht
                        an Dritte weitergegeben.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">3. Rechtsgrundlage</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Die Verarbeitung der von Ihnen übermittelten Daten erfolgt auf Grundlage von Art. 6 Abs. 1
                        lit. b DSGVO (Vertragsanbahnung) sowie Ihrer ausdrücklichen Einwilligung gemäß Art. 6 Abs. 1
                        lit. a DSGVO.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">4. Speicherdauer</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Ihre personenbezogenen Daten werden nur so lange gespeichert, wie es für die Erfüllung des
                        jeweiligen Zwecks erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen.
                        Anfragedaten werden nach vollständiger Abwicklung des Termins gelöscht, sofern keine
                        gesetzlichen Aufbewahrungspflichten entgegenstehen.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">5. Cookies und Tracking</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Diese Website verwendet keine Tracking-Cookies und kein Web-Analytics-Tool (z. B. Google
                        Analytics). Es werden lediglich technisch notwendige Cookies gesetzt, die für den Betrieb
                        der Website erforderlich sind.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">6. Ihre Rechte</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Sie haben gemäß DSGVO folgende Rechte gegenüber uns bezüglich der Sie betreffenden
                        personenbezogenen Daten:
                    </p>
                    <ul className="list-disc list-inside text-ivory/70 text-sm leading-relaxed flex flex-col gap-1 ml-2">
                        <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
                        <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
                        <li>Recht auf Löschung (Art. 17 DSGVO)</li>
                        <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                        <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
                        <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
                    </ul>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Zur Ausübung Ihrer Rechte wenden Sie sich bitte an:{' '}
                        <a href="mailto:info.eliteaufbereitung@gmail.com" className="text-champagne hover:underline">
                            info.eliteaufbereitung@gmail.com
                        </a>
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">7. Beschwerderecht</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Sie haben das Recht, sich bei der österreichischen Datenschutzbehörde zu beschweren:<br /><br />
                        Österreichische Datenschutzbehörde<br />
                        Barichgasse 40–42, 1030 Wien<br />
                        <a href="https://www.dsb.gv.at" target="_blank" rel="noreferrer" className="text-champagne hover:underline">www.dsb.gv.at</a>
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">8. Externe Dienste</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Diese Website bindet YouTube-Videos über den Dienst von Google LLC ein. Beim Abspielen
                        eines Videos können Daten (z. B. Ihre IP-Adresse) an Google übertragen werden. Weitere
                        Informationen finden Sie in der{' '}
                        <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="text-champagne hover:underline">
                            Datenschutzerklärung von Google
                        </a>.
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
