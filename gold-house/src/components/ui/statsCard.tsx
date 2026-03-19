import { FileText, CheckCircle, XCircle, Clock } from "lucide-react";
const stats = [
    { label: "TOTAL ORDERS", value: 10, icon: FileText, gradient: "gradient-gold" },
    { label: "PENDING", value: 5, icon: Clock, gradient: "gradient-dark" },
    { label: "DELIVERED", value: 3, icon: CheckCircle, gradient: "gradient-green" },
    { label: "CANCELLED", value: 2, icon: XCircle, gradient: "bg-gradient-to-br from-destructive/80 to-destructive" },
];
const StatCardsSection = () => {
    return (
        <section aria-label="Order statistics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map(({ label, value, icon: Icon, gradient }) => (
                <StatCards key={label} label={label} value={value.toString()} gradient={gradient} Icon={Icon} />
            ))}
        </section>
    );
}

const StatCards = ({ label, value, gradient, Icon }: { label: string; value: string; gradient: string; Icon: React.ComponentType<{ size?: number }> }) => {
    return (
        <article key={label} className={`${gradient} rounded-2xl p-5 flex items-center justify-between text-card min-h-[110px] animate-fade-in group hover:scale-[1.02] transition-transform duration-200`} aria-label={`${label}: ${value}`}>
            <div>
                <p className="text-3xl font-bold tracking-tight">{value}</p>
                <p className="text-[10px] font-bold tracking-[0.2em] mt-1 opacity-80">{label}</p>

            </div>
            <div className="bg-card/15 rounded-xl p-3 group-hover:bg-card/25 transition" aria-hidden="true">
                <Icon size={22} />
            </div>
        </article>
    );
}

export default StatCardsSection