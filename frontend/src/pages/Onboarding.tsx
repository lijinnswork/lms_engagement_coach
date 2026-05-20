import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GentleButton } from '../components/Common/GentleButton';

export const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-primary)]">
      <div className="w-full max-w-lg text-center">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <h2 className="text-3xl font-serif text-[var(--text-primary)]">How do you feel about your learning right now?</h2>
              <div className="flex flex-wrap justify-center gap-4">
                {['Overwhelmed', 'Tired', 'Okay', 'Good', 'Great'].map(mood => (
                  <GentleButton key={mood} variant="secondary" onClick={handleNext}>
                    {mood}
                  </GentleButton>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <h2 className="text-3xl font-serif text-[var(--text-primary)]">What's one thing you'd like to get from your courses?</h2>
              <textarea 
                className="w-full h-32 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-4 focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                placeholder="Share your thoughts..."
              />
              <GentleButton onClick={handleNext} className="mx-auto">Continue</GentleButton>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <h2 className="text-3xl font-serif text-[var(--text-primary)]">When do you usually study best?</h2>
              <div className="flex flex-col gap-4 max-w-xs mx-auto">
                {['Morning', 'Afternoon', 'Evening', 'Night'].map(time => (
                  <GentleButton key={time} variant="secondary" onClick={handleNext}>
                    {time}
                  </GentleButton>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <h2 className="text-3xl font-serif text-[var(--text-primary)]">I'll be here when you need me, quiet when you don't.</h2>
              <p className="text-[var(--text-secondary)] text-lg">Just so you know — you're in charge. I'll only speak when I think it'll help.</p>
              <GentleButton onClick={handleNext} className="mx-auto" variant="accent-soft">
                Ready to see your courses?
              </GentleButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
