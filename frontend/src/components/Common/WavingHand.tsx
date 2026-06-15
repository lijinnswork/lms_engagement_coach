import { motion } from "framer-motion";

interface WavingHandProps {
  hasNudges?: boolean;
  onClick?: () => void;
}

export const WavingHand = ({
  hasNudges = false,
  onClick,
}: WavingHandProps) => {
  const strokeColor = hasNudges
    ? "#E8A87C"
    : "var(--color-text-secondary, #6B6778)";

  return (
    <motion.button
      onClick={onClick}
      title={hasNudges ? "You have nudges" : "You are all caught up"}
      animate={
        hasNudges
          ? {
              rotate: [0, 15, -5, 15, -5, 0],
              transition: {
                duration: 1.2,
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: 2.5,
              },
            }
          : {
              rotate: 0,
              transition: { duration: 0.3, ease: "easeOut" },
            }
      }
      style={{
        transformOrigin: "50% 90%",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "4px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "32px",
        height: "32px",
        borderRadius: "6px",
      }}
      whileHover={{
        backgroundColor: "rgba(0, 0, 0, 0.05)",
      }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ring finger */}
        <path
          d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"
          stroke={strokeColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Middle finger */}
        <path
          d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"
          stroke={strokeColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Index finger */}
        <path
          d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"
          stroke={strokeColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Pinky, Palm, Wrist, and Thumb */}
        <path
          d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"
          stroke={strokeColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.button>
  );
};

export default WavingHand;
