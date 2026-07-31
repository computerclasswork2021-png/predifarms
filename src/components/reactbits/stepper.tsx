import {
  Children,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Stepper — React Bits stepper rebuilt on the app's semantic tokens so it
 * works in both light and dark themes. Used for guided, low-literacy data
 * entry where one question per screen beats a long form.
 */
export default function Stepper({
  children,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  stepCircleContainerClassName = "",
  stepContainerClassName = "",
  contentClassName = "",
  footerClassName = "",
  backButtonText = "Back",
  nextButtonText = "Continue",
  completeButtonText = "Complete",
  disableStepIndicators = false,
  nextDisabled = false,
  renderStepIndicator,
  ...rest
}: {
  children: ReactNode;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  stepCircleContainerClassName?: string;
  stepContainerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  backButtonText?: string;
  nextButtonText?: string;
  completeButtonText?: string;
  disableStepIndicators?: boolean;
  nextDisabled?: boolean;
  renderStepIndicator?: (p: {
    step: number;
    currentStep: number;
    onStepClick: (s: number) => void;
  }) => ReactNode;
} & HTMLAttributes<HTMLDivElement>) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [direction, setDirection] = useState(0);
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep);
    if (newStep > totalSteps) onFinalStepCompleted();
    else onStepChange(newStep);
  };

  return (
    <div className="flex w-full flex-col items-center" {...rest}>
      <div
        className={cn(
          "w-full rounded-3xl border border-glass-border bg-surface-1/70 shadow-[0_30px_80px_-60px_oklch(0_0_0/0.6)] backdrop-blur-xl",
          stepCircleContainerClassName,
        )}
      >
        <div className={cn("flex w-full items-center px-6 pt-6", stepContainerClassName)}>
          {stepsArray.map((_, index) => {
            const stepNumber = index + 1;
            const onStepClick = (clicked: number) => {
              setDirection(clicked > currentStep ? 1 : -1);
              updateStep(clicked);
            };
            return (
              <div key={stepNumber} className="flex flex-1 items-center last:flex-none">
                {renderStepIndicator ? (
                  renderStepIndicator({ step: stepNumber, currentStep, onStepClick })
                ) : (
                  <StepIndicator
                    step={stepNumber}
                    currentStep={currentStep}
                    disabled={disableStepIndicators}
                    onClickStep={onStepClick}
                  />
                )}
                {index < totalSteps - 1 && <StepConnector isComplete={currentStep > stepNumber} />}
              </div>
            );
          })}
        </div>

        <StepContentWrapper
          isCompleted={isCompleted}
          currentStep={currentStep}
          direction={direction}
          className={cn("relative overflow-hidden px-6", contentClassName)}
        >
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>

        {!isCompleted && (
          <div className={cn("px-6 pb-6", footerClassName)}>
            <div className={cn("mt-6 flex", currentStep !== 1 ? "justify-between" : "justify-end")}>
              {currentStep !== 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setDirection(-1);
                    updateStep(currentStep - 1);
                  }}
                  className="min-h-11 rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {backButtonText}
                </button>
              )}
              <button
                type="button"
                disabled={nextDisabled}
                onClick={() => {
                  setDirection(1);
                  updateStep(currentStep + 1);
                }}
                className="min-h-11 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {isLastStep ? completeButtonText : nextButtonText}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepContentWrapper({
  isCompleted,
  currentStep,
  direction,
  children,
  className,
}: {
  isCompleted: boolean;
  currentStep: number;
  direction: number;
  children: ReactNode;
  className?: string;
}) {
  const [parentHeight, setParentHeight] = useState(0);

  return (
    <motion.div
      className={className}
      style={{ position: "relative", overflow: "hidden" }}
      animate={{ height: isCompleted ? 0 : parentHeight }}
      transition={{ type: "spring", stiffness: 260, damping: 32 }}
    >
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        {!isCompleted && (
          <SlideTransition key={currentStep} direction={direction} onHeightReady={setParentHeight}>
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const stepVariants = {
  enter: (dir: number) => ({ x: dir >= 0 ? "-100%" : "100%", opacity: 0 }),
  center: { x: "0%", opacity: 1 },
  exit: (dir: number) => ({ x: dir >= 0 ? "50%" : "-50%", opacity: 0 }),
};

function SlideTransition({
  children,
  direction,
  onHeightReady,
}: {
  children: ReactNode;
  direction: number;
  onHeightReady: (h: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (containerRef.current) onHeightReady(containerRef.current.offsetHeight);
  }, [children, onHeightReady]);

  return (
    <motion.div
      ref={containerRef}
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{ position: "absolute", left: 0, right: 0, top: 0 }}
    >
      {children}
    </motion.div>
  );
}

export function Step({ children }: { children: ReactNode }) {
  return <div className="py-6">{children}</div>;
}

function StepIndicator({
  step,
  currentStep,
  onClickStep,
  disabled,
}: {
  step: number;
  currentStep: number;
  onClickStep: (s: number) => void;
  disabled?: boolean;
}) {
  const status = currentStep === step ? "active" : currentStep < step ? "inactive" : "complete";

  return (
    <button
      type="button"
      aria-label={`Step ${step}`}
      aria-current={status === "active" ? "step" : undefined}
      onClick={() => {
        if (step !== currentStep && !disabled) onClickStep(step);
      }}
      className="relative outline-none"
    >
      <motion.div
        animate={status}
        variants={{
          inactive: { backgroundColor: "var(--surface-3)", color: "var(--muted-foreground)" },
          active: { backgroundColor: "var(--primary)", color: "var(--primary-foreground)" },
          complete: { backgroundColor: "var(--primary)", color: "var(--primary-foreground)" },
        }}
        transition={{ duration: 0.3 }}
        className="grid size-9 place-items-center rounded-full text-sm font-semibold"
      >
        {status === "complete" ? (
          <Check className="size-4" />
        ) : status === "active" ? (
          <span className="size-2.5 rounded-full bg-primary-foreground" />
        ) : (
          step
        )}
      </motion.div>
    </button>
  );
}

function StepConnector({ isComplete }: { isComplete: boolean }) {
  return (
    <div className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded bg-surface-3">
      <motion.div
        className="absolute left-0 top-0 h-full bg-primary"
        initial={{ width: 0 }}
        animate={{ width: isComplete ? "100%" : 0 }}
        transition={{ duration: 0.35 }}
      />
    </div>
  );
}
