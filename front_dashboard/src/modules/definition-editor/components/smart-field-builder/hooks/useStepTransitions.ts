/**
 * Hook for managing wizard step transitions with animations
 */

import { useState, useCallback, useEffect } from 'react';
import { WizardState } from '../types/smartFieldTypes';

interface StepTransitionState {
  currentStep: number;
  previousStep: number;
  direction: 'forward' | 'backward' | 'none';
  isTransitioning: boolean;
}

export const useStepTransitions = (wizardState: WizardState, onStateChange: (state: WizardState) => void) => {
  const [transitionState, setTransitionState] = useState<StepTransitionState>({
    currentStep: wizardState.currentStep,
    previousStep: wizardState.currentStep,
    direction: 'none',
    isTransitioning: false
  });

  // Handle step navigation with animation direction detection
  const navigateToStep = useCallback((newStep: number, userInitiated = true) => {
    if (newStep === wizardState.currentStep || transitionState.isTransitioning) {
      return;
    }

    // Determine transition direction
    const direction = newStep > wizardState.currentStep ? 'forward' : 'backward';
    
    // Update transition state
    setTransitionState(prev => ({
      ...prev,
      previousStep: wizardState.currentStep,
      direction,
      isTransitioning: true
    }));

    // Update wizard state
    const newWizardState = {
      ...wizardState,
      currentStep: newStep
    };

    onStateChange(newWizardState);

    // Reset transition state after animation completes
    setTimeout(() => {
      setTransitionState(prev => ({
        ...prev,
        currentStep: newStep,
        isTransitioning: false,
        direction: 'none'
      }));
    }, 300); // Match animation duration
  }, [wizardState, onStateChange, transitionState.isTransitioning]);

  // Navigation helpers
  const goToNextStep = useCallback(() => {
    const nextStep = wizardState.currentStep + 1;
    if (nextStep < wizardState.steps.length) {
      navigateToStep(nextStep);
    }
  }, [wizardState.currentStep, wizardState.steps.length, navigateToStep]);

  const goToPreviousStep = useCallback(() => {
    const prevStep = wizardState.currentStep - 1;
    if (prevStep >= 0) {
      navigateToStep(prevStep);
    }
  }, [wizardState.currentStep, navigateToStep]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < wizardState.steps.length) {
      navigateToStep(stepIndex);
    }
  }, [wizardState.steps.length, navigateToStep]);

  // Validation helpers
  const canGoToNextStep = useCallback(() => {
    const currentStepData = wizardState.steps[wizardState.currentStep];
    return currentStepData?.isValid && !transitionState.isTransitioning;
  }, [wizardState.steps, wizardState.currentStep, transitionState.isTransitioning]);

  const canGoToPreviousStep = useCallback(() => {
    return wizardState.currentStep > 0 && !transitionState.isTransitioning;
  }, [wizardState.currentStep, transitionState.isTransitioning]);

  const canGoToStep = useCallback((stepIndex: number) => {
    if (transitionState.isTransitioning) return false;
    
    // Allow going to completed steps or current step
    if (stepIndex <= wizardState.currentStep) return true;
    
    // Allow going to next step if current is valid
    if (stepIndex === wizardState.currentStep + 1) {
      return canGoToNextStep();
    }
    
    return false;
  }, [wizardState.currentStep, transitionState.isTransitioning, canGoToNextStep]);

  // Step completion helpers
  const markStepAsComplete = useCallback((stepIndex: number) => {
    const updatedSteps = wizardState.steps.map((step, index) => {
      if (index === stepIndex) {
        return { ...step, isValid: true, isComplete: true };
      }
      return step;
    });

    onStateChange({
      ...wizardState,
      steps: updatedSteps
    });
  }, [wizardState, onStateChange]);

  const markStepAsIncomplete = useCallback((stepIndex: number) => {
    const updatedSteps = wizardState.steps.map((step, index) => {
      if (index === stepIndex) {
        return { ...step, isValid: false, isComplete: false };
      }
      return step;
    });

    onStateChange({
      ...wizardState,
      steps: updatedSteps
    });
  }, [wizardState, onStateChange]);

  // Progress calculation
  const getProgress = useCallback(() => {
    const completedSteps = wizardState.steps.filter(s => s.isComplete).length;
    return (completedSteps / wizardState.steps.length) * 100;
  }, [wizardState.steps]);

  const getStepProgress = useCallback((stepIndex: number) => {
    const step = wizardState.steps[stepIndex];
    if (!step) return 0;
    
    if (step.isComplete) return 100;
    if (stepIndex === wizardState.currentStep) return 50;
    return 0;
  }, [wizardState.steps, wizardState.currentStep]);

  // Auto-save current step data
  const updateCurrentStepData = useCallback((data: any) => {
    onStateChange({
      ...wizardState,
      config: { ...wizardState.config, ...data }
    });
  }, [wizardState, onStateChange]);

  // Validation state management
  const setStepValidation = useCallback((stepIndex: number, isValid: boolean, errors: Record<string, string> = {}) => {
    const updatedSteps = wizardState.steps.map((step, index) => {
      if (index === stepIndex) {
        return { ...step, isValid };
      }
      return step;
    });

    onStateChange({
      ...wizardState,
      steps: updatedSteps,
      errors: { ...wizardState.errors, ...errors }
    });
  }, [wizardState, onStateChange]);

  // Update transition state when wizard state changes externally
  useEffect(() => {
    if (wizardState.currentStep !== transitionState.currentStep && !transitionState.isTransitioning) {
      setTransitionState(prev => ({
        ...prev,
        currentStep: wizardState.currentStep,
        previousStep: prev.currentStep
      }));
    }
  }, [wizardState.currentStep, transitionState.currentStep, transitionState.isTransitioning]);

  return {
    // Transition state
    transitionState,
    
    // Navigation
    goToNextStep,
    goToPreviousStep,
    goToStep,
    
    // Validation
    canGoToNextStep,
    canGoToPreviousStep,
    canGoToStep,
    
    // Step management
    markStepAsComplete,
    markStepAsIncomplete,
    setStepValidation,
    
    // Progress
    getProgress,
    getStepProgress,
    
    // Data management
    updateCurrentStepData,
    
    // State
    currentStep: wizardState.currentStep,
    totalSteps: wizardState.steps.length,
    isLastStep: wizardState.currentStep === wizardState.steps.length - 1,
    isFirstStep: wizardState.currentStep === 0
  };
};