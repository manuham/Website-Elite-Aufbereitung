import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function AGB() {
    return (
        <div className="min-h-screen bg-obsidian text-ivory font-sans overflow-hidden">
            <Navbar />

            {/* Content */}
            <div className="max-w-3xl mx-auto px-6 sm:px-12 pt-32 sm:pt-36 pb-16 flex flex-col gap-10">

                <div className="flex flex-col gap-2">
                    <span className="font-mono text-xs text-champagne uppercase tracking-widest">Rechtliches</span>
                    <h1 className="font-drama text-4xl sm:text-5xl text-ivory">Allgemeine Geschäftsbedingungen</h1>
                </div>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">1. Geltungsbereich</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge über
                        Fahrzeugaufbereitungs- und Pflegeleistungen zwischen der Elité Auto Aufbereitung,
                        Inhaber Matthias Kaufmann, Bundesstraße 2a, 6714 Nüziders (nachfolgend „Anbieter“),
                        und ihren Kundinnen und Kunden (nachfolgend „Kunde“). Abweichende Bedingungen des
                        Kunden werden nur anerkannt, wenn der Anbieter ihnen ausdrücklich schriftlich zustimmt.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">2. Vertragsabschluss</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Die Darstellung der Leistungen und Preise auf dieser Website stellt kein bindendes
                        Angebot dar. Mit dem Absenden einer Terminanfrage über das Buchungsformular gibt der
                        Kunde eine unverbindliche Anfrage ab. Ein Vertrag kommt erst mit der ausdrücklichen
                        Bestätigung des Termins durch den Anbieter (z. B. per E-Mail oder Telefon) zustande.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">3. Leistungen und Preise</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Art und Umfang der Leistung ergeben sich aus der jeweiligen Terminbestätigung. Die auf
                        der Website angegebenen Preise verstehen sich als Richtpreise. Der endgültige Preis kann
                        je nach tatsächlichem Zustand, Größe und Verschmutzungsgrad des Fahrzeugs abweichen und
                        wird vor Beginn der Arbeiten mit dem Kunden abgestimmt.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">4. Zahlungsbedingungen</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Die Zahlung ist nach Erbringung der Leistung fällig, sofern nichts anderes vereinbart
                        wurde. Akzeptierte Zahlungsmittel werden vor Ort bzw. bei der Terminbestätigung
                        bekanntgegeben.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">5. Terminänderung und Stornierung</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Vereinbarte Termine können bis spätestens 24 Stunden vor dem Termin kostenfrei
                        verschoben oder abgesagt werden. Bei kurzfristiger Absage oder Nichterscheinen behält
                        sich der Anbieter vor, einen angemessenen Aufwandsersatz zu verrechnen. Das gesetzliche
                        Rücktrittsrecht für Verbraucher (siehe Widerrufsbelehrung) bleibt davon unberührt.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">6. Mitwirkung des Kunden</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Der Kunde stellt das Fahrzeug zum vereinbarten Termin frei von persönlichen
                        Gegenständen und Wertsachen bereit. Für im Fahrzeug zurückgelassene Gegenstände wird
                        keine Haftung übernommen. Bestehende Vorschäden sind dem Anbieter vor Beginn der
                        Arbeiten mitzuteilen.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">7. Gewährleistung und Haftung</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Es gelten die gesetzlichen Gewährleistungsbestimmungen. Der Anbieter haftet für Schäden
                        nur bei Vorsatz oder grober Fahrlässigkeit. Die Haftung für leichte Fahrlässigkeit ist
                        – soweit gesetzlich zulässig – ausgeschlossen. Für bereits bestehende Schäden,
                        materialbedingte Risiken (z. B. empfindliche Lacke, Altlackierungen, lose Anbauteile)
                        sowie für unvermeidbare, sachgerechte Bearbeitungsspuren wird keine Haftung übernommen.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">8. Schlussbestimmungen</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Es gilt österreichisches Recht. Sollte eine Bestimmung dieser AGB unwirksam sein, bleibt
                        die Wirksamkeit der übrigen Bestimmungen unberührt. Gerichtsstand ist Feldkirch, soweit
                        keine zwingenden gesetzlichen Verbraucherschutzbestimmungen entgegenstehen.
                    </p>
                </section>

            </div>

            <Footer />
        </div>
    );
}
