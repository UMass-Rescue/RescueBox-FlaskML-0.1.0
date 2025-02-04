import * as React from 'react';
import { useState } from 'react';
import log from 'electron-log';
import { useDeploy, useServers } from '../lib/hooks';
import { Button } from '../components/ui/button';
import { DyProgressCircle } from '../components/custom_ui/customButtons';
import GreenRunIcon from '../components/icons/GreenRunIcon';
import LoadingScreen from '../components/LoadingScreen';

function Deploy() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentStep, setCurrentStep] = useState(1);
  const { servers } = useServers();

  const tSteps = 10;
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
    setCurrentStep(progress);
    await mutate();
  };

  if (currentStep === tSteps) {
    // COMPLETE = 100;
    log.info('Proceed to auto register servers on startup !');
    try {
      window.serverStatus.setGlobalVariable('serverReady', true);
      if (servers) {
        for (let i = 0; i < servers.length; i += 1) {
          window.registration.getModelAppStatus({
            modelUid: servers[i].modelUid,
          });
        }
      }
    } catch (errord) {
      log.info(errord);
    }
    return (
      // eslint-disable-next-line react/style-prop-object
      <div
        className="bold"
        style={{ color: 'green', backgroundColor: 'white' }}
      >
        <h3>
          Model Servers installed and Started <strong>OK</strong> !
        </h3>
      </div>
    );
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
        <DyProgressCircle totalSteps={tSteps} currentStep={currentStep} />
      </div>
    </div>
  );
}

export default Deploy;
