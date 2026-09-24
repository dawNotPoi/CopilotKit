import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { StepperStep } from "./wizard-stepper-parts";

export type WizardLayout = "classic" | "journey" | "rail";

type ProgressProps = {
  steps: readonly StepperStep[];
  current: number;
  furthest: number;
  summaries: Readonly<Record<number, string>>;
  onJump: (step: number, pointerActivated: boolean) => void;
};

export function WizardLayoutPicker({
  layout,
  onChange,
}: {
  layout: WizardLayout;
  onChange: (layout: WizardLayout) => void;
}): React.JSX.Element {
  const options: readonly { value: WizardLayout; label: string }[] = [
    { value: "classic", label: "Original" },
    { value: "journey", label: "A · Open journey" },
    { value: "rail", label: "B · Focused step" },
  ];
  return (
    <div
      className="wizard-layout-picker not-prose"
      role="group"
      aria-label="Preview wizard layouts"
    >
      <span className="wizard-layout-picker-label">Preview layouts</span>
      <div className="wizard-layout-picker-options">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={layout === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function WizardJourney({
  steps,
  current,
  furthest,
  summaries,
  onJump,
  children,
}: ProgressProps & { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="wizard-journey">
      <div className="wizard-journey-stage" data-wizard-current-step="">
        {children}
      </div>
      <ol className="wizard-journey-list" aria-label="Setup steps">
        {steps.map((step, index) => {
          const active = current === step.n;
          const reached = step.n <= furthest;
          const row = (
            <>
              <span className="wizard-journey-row-label">{step.label}</span>
              <span className="wizard-journey-row-note">
                {active
                  ? "Current step"
                  : reached
                    ? summaries[step.n] || "Change"
                    : step.label === "Features"
                      ? "Optional"
                      : "Up next"}
              </span>
            </>
          );
          return (
            <li
              key={step.n}
              className={`wizard-journey-step${active ? " is-current" : ""}`}
            >
              <span className="wizard-journey-number" aria-hidden="true">
                {index + 1}
              </span>
              {active ? (
                <div
                  className="wizard-journey-row is-current"
                  aria-current="step"
                >
                  {row}
                </div>
              ) : reached ? (
                <button
                  type="button"
                  className="wizard-journey-row"
                  onClick={(event) => onJump(step.n, event.detail > 0)}
                >
                  {row}
                </button>
              ) : (
                <div className="wizard-journey-row is-upcoming">{row}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function WizardRail({
  steps,
  current,
  furthest,
  summaries,
  selectedSteps,
  onJump,
  children,
}: ProgressProps & {
  selectedSteps: ReadonlySet<number>;
  children: React.ReactNode;
}): React.JSX.Element {
  const activeIndex = Math.max(
    0,
    steps.findIndex((step) => step.n === current),
  );
  return (
    <div className="wizard-rail-layout">
      <nav className="wizard-rail-progress" aria-label="Setup steps">
        <div className="wizard-rail-progress-heading">Your setup</div>
        <div className="wizard-rail-list-wrap">
          <span
            className={`wizard-rail-active-marker${selectedSteps.has(current) ? " is-selected" : ""}`}
            aria-hidden="true"
            style={{ transform: `translateY(${activeIndex * 4}rem)` }}
          />
          <ol>
            {steps.map((step, index) => {
              const reached = step.n <= furthest;
              const active = current === step.n;
              const selected = selectedSteps.has(step.n);
              return (
                <li key={step.n}>
                  <button
                    type="button"
                    disabled={!reached}
                    aria-current={active ? "step" : undefined}
                    data-selected={selected || undefined}
                    onClick={(event) => onJump(step.n, event.detail > 0)}
                  >
                    <span className="wizard-rail-number" aria-hidden="true">
                      {index + 1}
                    </span>
                    <span className="wizard-rail-step-copy">
                      <span className="wizard-rail-step-label">
                        {step.label}
                      </span>
                      {reached && !active && summaries[step.n] ? (
                        <span className="wizard-rail-step-summary">
                          {summaries[step.n]}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="wizard-rail-progress-footer">
          <span>
            Step {activeIndex + 1} of {steps.length}
          </span>
          <span className="wizard-rail-progress-track" aria-hidden="true">
            <span
              style={{
                transform: `scaleX(${(activeIndex + 1) / steps.length})`,
              }}
            />
          </span>
          <div className="wizard-rail-arrows">
            <button
              type="button"
              aria-label="Previous step"
              disabled={activeIndex === 0}
              onClick={(event) =>
                onJump(steps[activeIndex - 1].n, event.detail > 0)
              }
            >
              <ArrowLeft aria-hidden="true" size={16} />
            </button>
            <button
              type="button"
              aria-label="Next visited step"
              disabled={
                activeIndex === steps.length - 1 ||
                steps[activeIndex + 1].n > furthest
              }
              onClick={(event) =>
                onJump(steps[activeIndex + 1].n, event.detail > 0)
              }
            >
              <ArrowRight aria-hidden="true" size={16} />
            </button>
          </div>
        </div>
      </nav>
      <div
        className="wizard-rail-stage"
        data-wizard-current-step=""
        data-wizard-step={current}
      >
        {children}
      </div>
    </div>
  );
}
