import React from "react";
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
  onJump,
  children,
}: Omit<ProgressProps, "summaries"> & {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="wizard-rail-layout">
      <nav className="wizard-rail-progress" aria-label="Setup steps">
        <ol>
          {steps.map((step, index) => {
            const reached = step.n <= furthest;
            return (
              <li key={step.n}>
                <button
                  type="button"
                  disabled={!reached}
                  aria-current={current === step.n ? "step" : undefined}
                  onClick={(event) => onJump(step.n, event.detail > 0)}
                >
                  <span className="wizard-rail-number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span>{step.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
      <div className="wizard-rail-stage" data-wizard-current-step="">
        {children}
      </div>
    </div>
  );
}
