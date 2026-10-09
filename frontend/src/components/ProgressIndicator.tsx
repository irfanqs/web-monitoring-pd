'use client';

import { cn } from '@/lib/utils';
import { EMPLOYEE_ROLES } from '@/lib/constants';
import { useRoleStore } from '@/lib/useRoleStore';
import { Check } from 'lucide-react';

interface StepConfig {
  stepNumber: number;
  stepName: string;
  requiredEmployeeRole: string;
  isLsOnly: boolean;
  isNonLsOnly: boolean;
  isParallel: boolean;
  parallelGroup: string | null;
}

interface ProgressIndicatorProps {
  currentStep: number;
  histories?: Array<{
    stepNumber: number;
    processorName: string;
    processedAt: string;
  }>;
  compact?: boolean;
  isLs?: boolean;
  stepConfigs?: StepConfig[];
  getStepPicName?: (stepNumber: number, roleCode?: string) => string;
}

export function ProgressIndicator({
  currentStep,
  histories = [],
  compact = false,
  isLs = false,
  stepConfigs = [],
  getStepPicName,
}: ProgressIndicatorProps) {
  const getRoleLabel = useRoleStore((state) => state.getRoleLabel);

  // Get applicable steps based on LS/Non-LS
  const applicableSteps = stepConfigs.filter(step => {
    if (isLs) return !step.isNonLsOnly;
    return !step.isLsOnly;
  });

  // All step numbers from config
  const allStepNumbers = stepConfigs.map(s => s.stepNumber);
  const maxStepNumber = allStepNumbers.length > 0 ? Math.max(...allStepNumbers) : 15;
  
  // Applicable step numbers
  const applicableStepNumbers = applicableSteps.map(s => s.stepNumber);
  const totalApplicableSteps = applicableSteps.length;

  // Get parallel steps
  const parallelGroups = [...new Set(stepConfigs.filter(s => s.isParallel && s.parallelGroup).map(s => s.parallelGroup))];
  const getParallelStepNumbers = (group: string | null) => {
    if (!group) return [];
    return stepConfigs.filter(s => s.parallelGroup === group).map(s => s.stepNumber);
  };

  const getStepHistory = (step: number) =>
    histories.find((h) => h.stepNumber === step);

  // Processed steps show who actually did it; other steps show everyone holding the role
  const getPicLabel = (step: number, skipped: boolean, roleCode?: string) => {
    if (skipped) return '-';
    const processed = histories.find((h) => h.stepNumber === step && !h.processorName.includes('[DIKEMBALIKAN]'));
    if (processed) return processed.processorName;
    return getStepPicName ? getStepPicName(step, roleCode) : '-';
  };

  const currentStepClass = isLs ? 'bg-blue-700 text-white' : 'bg-orange-700 text-white';

  const getStepConfig = (step: number) =>
    stepConfigs.find((s) => s.stepNumber === step);

  // Check if step is in a parallel group
  const isParallelStep = (step: number) => {
    const config = getStepConfig(step);
    return config?.isParallel && config?.parallelGroup;
  };

  // Check if parallel step is completed
  const isParallelStepCompleted = (step: number) => {
    if (!isParallelStep(step)) return false;
    return histories.some(h => h.stepNumber === step);
  };

  // Determine if a step should show as completed
  const isStepCompleted = (step: number) => {
    const config = getStepConfig(step);
    
    // For parallel steps
    if (config?.isParallel && config?.parallelGroup) {
      return isParallelStepCompleted(step);
    }
    
    return histories.some(h => h.stepNumber === step);
  };

  // Check if step is skipped (not applicable for this ticket type)
  const isStepSkipped = (step: number) => {
    return !applicableStepNumbers.includes(step);
  };

  // Check if step is current
  const isCurrentStep = (step: number) => {
    const config = getStepConfig(step);
    
    // For parallel steps, check if in same group as current
    if (config?.isParallel && config?.parallelGroup) {
      const parallelSteps = getParallelStepNumbers(config.parallelGroup);
      const currentConfig = getStepConfig(currentStep);
      if (currentConfig?.parallelGroup === config.parallelGroup) {
        return !isParallelStepCompleted(step);
      }
    }
    
    return step === currentStep;
  };

  // Get current parallel group info
  const getCurrentParallelInfo = () => {
    const currentConfig = getStepConfig(currentStep);
    if (currentConfig?.isParallel && currentConfig?.parallelGroup) {
      const parallelSteps = getParallelStepNumbers(currentConfig.parallelGroup);
      const completedCount = parallelSteps.filter(s => histories.some(h => h.stepNumber === s)).length;
      return { parallelSteps, completedCount, total: parallelSteps.length };
    }
    return null;
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {/* LS/Non-LS Indicator */}
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded",
            isLs
              ? "bg-blue-50 text-blue-900 border border-blue-300"
              : "bg-orange-50 text-orange-900 border border-orange-300"
          )}>
            {isLs ? 'LS' : 'Non-LS'} - {totalApplicableSteps} Steps
          </span>
        </div>
        
        <div className="flex items-start gap-0.5 overflow-x-auto">
          {Array.from({ length: maxStepNumber }, (_, i) => i + 1).map((step) => {
            const skipped = isStepSkipped(step);
            const completed = isStepCompleted(step);
            const isCurrent = isCurrentStep(step);
            const config = getStepConfig(step);
            const picLabel = getPicLabel(step, skipped, config?.requiredEmployeeRole);

            return (
              <div key={step} className="w-[56px] flex flex-col items-center text-center">
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium relative',
                    skipped
                      ? 'bg-slate-100 text-slate-500'
                      : completed
                      ? 'bg-green-700 text-white'
                      : isCurrent
                      ? cn(currentStepClass, isLs ? 'ring-2 ring-blue-300' : 'ring-2 ring-orange-300')
                      : 'bg-slate-200 text-slate-800',
                    config?.isParallel && 'rounded-sm' // Square for parallel steps
                  )}
                  title={skipped ? 'Tidak berlaku' : config?.stepName}
                >
                  {skipped ? '−' : completed ? <Check className="w-3 h-3" /> : step}
                  {config?.isParallel && !skipped && (
                    <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full border border-white" title="Paralel" />
                  )}
                </div>
                <p
                  className={cn(
                    'mt-1 text-[8px] leading-tight line-clamp-2 min-h-[18px]',
                    skipped ? 'text-slate-500' : 'text-slate-900'
                  )}
                  title={picLabel}
                >
                  {picLabel}
                </p>
              </div>
            );
          })}
          {currentStep > maxStepNumber && (
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center",
              "bg-green-700 text-white"
            )}>
              <Check className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>
    );
  }

  const parallelInfo = getCurrentParallelInfo();
  const currentConfig = getStepConfig(currentStep);

  return (
    <div className="space-y-3">
      {/* Header with LS/Non-LS indicator */}
      <div className="flex items-center justify-between">
        <div className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold",
          isLs 
            ? "bg-blue-50 text-blue-900 border-2 border-blue-200"
            : "bg-orange-50 text-orange-900 border-2 border-orange-200"
        )}>
          <span>{isLs ? 'Langsung (LS)' : 'Non-LS'}</span>
          <span className="text-xs">• {totalApplicableSteps} steps</span>
        </div>
        {parallelInfo && (
          <div className="text-xs text-amber-900 bg-amber-50 px-2 py-1 rounded border border-amber-200">
            Paralel: {parallelInfo.completedCount}/{parallelInfo.total}
          </div>
        )}
      </div>

  <div className="flex items-start gap-0.5 overflow-x-auto pb-4 pl-2 pt-1">
        {Array.from({ length: maxStepNumber }, (_, i) => i + 1).map((step) => {
          const history = getStepHistory(step);
          const config = getStepConfig(step);
          const skipped = isStepSkipped(step);
          const completed = isStepCompleted(step);
          const isCurrent = isCurrentStep(step);
          const picLabel = getPicLabel(step, skipped, config?.requiredEmployeeRole);

          return (
            <div key={step} className="flex items-start">
              <div className="w-[72px] flex flex-col items-center text-center">
                <div
                  className={cn(
                    'w-10 h-10 flex items-center justify-center text-sm font-medium relative group z-0',
                    skipped
                      ? 'bg-slate-100 text-slate-500 rounded-full'
                      : completed
                      ? 'bg-green-700 text-white rounded-full'
                      : isCurrent
                      ? cn(currentStepClass, isLs ? 'ring-4 ring-blue-200' : 'ring-4 ring-orange-200', 'rounded-full shadow-lg')
                      : 'bg-slate-200 text-slate-800 rounded-full',
                    config?.isParallel && !skipped && 'rounded-lg' // Rounded square for parallel
                  )}
                >
                  {skipped ? '−' : completed ? <Check className="w-5 h-5" /> : step}
                  {config?.isParallel && !skipped && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white shadow" title="Step Paralel" />
                  )}
                  {(history || skipped || config) && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block z-50 pointer-events-none">
                      <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl max-w-xs">
                        <p className="font-medium whitespace-nowrap">
                          Step {step}
                        </p>
                        {config?.isParallel && <p className="text-amber-300 text-xs">Paralel</p>}
                        {skipped ? (
                          <p className="text-slate-300 whitespace-nowrap mt-1">
                            Dilewati ({isLs ? 'Non-LS Only' : 'LS Only'})
                          </p>
                        ) : (
                          <>
                            <p className="whitespace-nowrap mt-1">{picLabel}</p>
                            {history && (
                              <p className="text-slate-300 whitespace-nowrap text-xs">
                                {new Date(history.processedAt).toLocaleString('id-ID')}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <p
                  className={cn(
                    'mt-2 text-[9px] leading-tight px-1 min-h-[24px] line-clamp-2',
                    skipped ? 'text-slate-500' : 'text-slate-900',
                    isCurrent && !skipped && 'font-semibold'
                  )}
                  title={picLabel}
                >
                  {picLabel}
                </p>
              </div>
              {step < maxStepNumber && (
                <div
                  className={cn(
                    'w-2 h-1 mt-[18px]',
                    skipped || isStepSkipped(step + 1)
                      ? 'bg-slate-100'
                      : completed
                      ? 'bg-green-700'
                      : 'bg-slate-200'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-sm text-slate-800">
        {currentStep > maxStepNumber 
          ? 'Selesai' 
          : parallelInfo
          ? `Step ${parallelInfo.parallelSteps.join(', ')} (Paralel) - ${parallelInfo.completedCount}/${parallelInfo.total} selesai`
          : `Step ${currentStep} dari ${maxStepNumber} - ${currentConfig ? (getRoleLabel(currentConfig.requiredEmployeeRole) || currentConfig.stepName) : ''}`
        }
      </p>
    </div>
  );
}
