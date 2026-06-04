import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Widerruf() {
    return (
        <div className="min-h-screen bg-obsidian text-ivory font-sans overflow-hidden">
            <Navbar />

            {/* Content */}
            <div className="max-w-3xl mx-auto px-6 sm:px-12 pt-32 sm:pt-36 pb-16 flex flex-col gap-10">

                <div className="flex flex-col gap-2">
                    <span className="font-mono text-xs text-champagne uppercase tracking-widest">Rechtliches</span>
                    <h1 className="font-drama text-4xl sm:text-5xl text-ivory">Widerrufsbelehrung</h1>
                </div>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">Widerrufsrecht</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Wenn Sie Verbraucher im Sinne des Fern- und Auswärtsgeschäfte-Gesetzes (FAGG) sind und
                        einen Vertrag im Wege der Fernkommunikation (z. B. über das Buchungsformular dieser
                        Website) abschließen, haben Sie das Recht, binnen vierzehn Tagen ohne Angabe von Gründen
                        diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des
                        Vertragsabschlusses.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">Ausübung des Widerrufs</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Um Ihr Widerrufsrecht auszuüben, müssen Sie uns mittels einer eindeutigen Erklärung
                        (z. B. ein mit der Post versandter Brief oder eine E-Mail) über Ihren Entschluss,
                        diesen Vertrag zu widerrufen, informieren:
                    </p>
                    <div className="flex flex-col gap-1 text-ivory/80 leading-relaxed text-sm">
                        <p className="font-semibold text-ivory">Elité Auto Aufbereitung</p>
                        <p>Matthias Kaufmann</p>
                        <p>Bundesstraße 2a, 6714 Nüziders, Österreich</p>
                        <p>Tel: <a href="tel:+436642546078" className="text-champagne hover:underline">+43 664 2546078</a></p>
                        <p>E-Mail: <a href="mailto:info.eliteaufbereitung@gmail.com" className="text-champagne hover:underline">info.eliteaufbereitung@gmail.com</a></p>
                    </div>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Sie können dafür das untenstehende Muster-Widerrufsformular verwenden, was jedoch nicht
                        vorgeschrieben ist. Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung
                        über die Ausübung des Widerrufsrechts vor Ablauf der Frist absenden.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">Vorzeitiges Erlöschen des Widerrufsrechts</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Wünschen Sie ausdrücklich, dass mit der Dienstleistung bereits vor Ablauf der
                        Widerrufsfrist begonnen wird, so erlischt Ihr Widerrufsrecht mit vollständiger Erbringung
                        der Dienstleistung. Wird die Leistung auf Ihren Wunsch hin vor Ablauf der Frist begonnen,
                        aber widerrufen Sie davor, haben Sie einen der bereits erbrachten Leistung anteilig
                        entsprechenden Betrag zu zahlen.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">Folgen des Widerrufs</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen
                        erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag
                        zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf bei uns eingegangen ist.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">Muster-Widerrufsformular</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        (Wenn Sie den Vertrag widerrufen wollen, füllen Sie bitte dieses Formular aus und senden
                        Sie es zurück.)
                    </p>
                    <div className="rounded-2xl border border-ivory/10 bg-ivory/[0.03] p-6 text-ivory/70 leading-relaxed text-sm flex flex-col gap-2">
                        <p>An Elité Auto Aufbereitung, Bundesstraße 2a, 6714 Nüziders, info.eliteaufbereitung@gmail.com:</p>
                        <p>Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung:</p>
                        <p>______________________________________________</p>
                        <p>Bestellt am (*) / erhalten am (*): _______________</p>
                        <p>Name des/der Verbraucher(s): ____________________</p>
                        <p>Anschrift des/der Verbraucher(s): _______________</p>
                        <p>Datum und Unterschrift (nur bei Mitteilung auf Papier): _______________</p>
                        <p className="text-ivory/40">(*) Unzutreffendes streichen.</p>
                    </div>
                </section>

            </div>

            <Footer />
        </div>
    );
}
