/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import CircularProgress, {
  CircularProgressProps,
} from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function CircularProgressWithLabel(
  props: CircularProgressProps & { value: number },
) {
  return (
    <Box width="10%" height="10%" p={2} position="relative">
      <Box component="section" sx={{ p: 2, border: '1px dashed white' }}>
        <CircularProgress variant="determinate" {...props} />
        <Typography
          variant="caption"
          component="div"
          sx={{ right: 100, color: 'custom.black' }}
        >{`${Math.round(props.value)}%`}</Typography>
      </Box>
    </Box>
  );
}

/*
export function CircularWithValueLabel({
  totalSteps,
  currentStep,
}: {
  totalSteps: number;
  currentStep: number;
}) {
  const [progress, setProgress] = useState(0);

  React.useEffect(() => {
    const calculatedProgress = (currentStep / totalSteps) * 100;
    setProgress(calculatedProgress);
  }, [currentStep, totalSteps]);

  return <CircularProgressWithLabel value={progress} />;
}
  */
