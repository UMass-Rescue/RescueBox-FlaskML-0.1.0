import * as React from 'react';
import { useState } from 'react';
import { useDeploy } from '../lib/hooks';
import { Button } from '../components/ui/button';
import {
  DyProgressBar,
  DynamicProgressBar,
} from '../components/custom_ui/customButtons';
// import LoadingIcon from '../components/icons/LoadingIcon';
import GreenRunIcon from '../components/icons/GreenRunIcon';
import LoadingScreen from '../components/LoadingScreen';

function Deploy() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentStep, setCurrentStep] = useState(1);
  const tSteps = 5;
  // ... logic to update currentStep
  const {
    data: progress,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useDeploy();
  if (error) return <div>Error: {error.message}</div>;
  if (!progress) return <LoadingScreen />;
  if (progress <= 0) return <div>Deploy failed</div>;

  const handleRefresh = async (): Promise<void> => {
    // await window.logging.clearLogs();
    setCurrentStep(progress);
    await mutate();
  };

  if (currentStep === tSteps) {
    return <div>Deploy successful</div>;
  }
  return (
    <div>
      <div className="flex flex-row items-center gap-3 font-bold">
        <GreenRunIcon />
        <br />
      </div>
      <Button
        className="group disabled:pointer-events-none disabled:bg-transparent px-1 py-1 text-center hover:bg-slate-200 rounded-md flex items-center justify-center transition-all"
        aria-label="Back"
        onClick={handleRefresh}
      >
        Deploy Status {isLoading} {isValidating}
      </Button>
      <div>
        <DyProgressBar totalSteps={tSteps} currentStep={currentStep} />
      </div>
    </div>
  );
}

export default Deploy;

export function FileUpload() {
  const [progress, setProgress] = useState(0);
  const total = 1000; // Example: File size in KB

  const handleDeploy = () => {
    // Simulate file upload
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 1;
      setProgress(currentProgress);

      if (currentProgress >= total) {
        clearInterval(interval);
      }
    }, 100);
  };

  return (
    <div>
      <Button onClick={handleDeploy}>Upload File</Button>
      <DynamicProgressBar total={total} progress={progress} />
    </div>
  );
}
