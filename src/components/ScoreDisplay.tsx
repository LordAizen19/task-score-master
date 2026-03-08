import { Coins } from "lucide-react";
import { motion } from "framer-motion";

interface ScoreDisplayProps {
  score: number;
  size?: "sm" | "lg";
}

const ScoreDisplay = ({ score, size = "lg" }: ScoreDisplayProps) => {
  const isNeg = score < 0;

  return (
    <motion.div
      className={`flex items-center gap-2 ${size === "lg" ? "gap-3" : "gap-1.5"}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      key={score}
    >
      <div
        className={`flex items-center justify-center rounded-full bg-primary/15 coin-shadow ${
          size === "lg" ? "h-14 w-14" : "h-8 w-8"
        }`}
      >
        <Coins className={`text-primary ${size === "lg" ? "h-7 w-7" : "h-4 w-4"}`} />
      </div>
      <div>
        <p className={`font-display font-bold gold-glow ${size === "lg" ? "text-4xl" : "text-xl"} ${isNeg ? "text-destructive" : "text-foreground"}`}>
          {score}
        </p>
        {size === "lg" && <p className="text-xs text-muted-foreground">Gold Coins</p>}
      </div>
    </motion.div>
  );
};

export default ScoreDisplay;
