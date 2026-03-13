import { cn } from "@/lib/utils";

interface GoldHouseLogoProps {
   className?: string;
}
function GoldHouseLogo({ className }: GoldHouseLogoProps) {
    return (
        <div className={cn("w-16 h-16 rounded-2xl gradient-gold flex items-center justify-center mb-5 shadow-lg",className)}>
            <span className="text-2xl font-bold text-primary">GH</span>
          </div>
    );
}

export default GoldHouseLogo;