/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import PropTypes from 'prop-types';
import LinearProgress, {
  LinearProgressProps,
} from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { JSX } from 'react/jsx-runtime';
import { cn } from 'src/renderer/lib/utils';

function LinearProgressWithLabelValue({ value }: { value: number }) {
  return (
    <Box display="flex" alignItems="center" bgcolor="red">
      <Box width="95%" mr={1}>
        <LinearProgress variant="determinate" />
      </Box>
      <Box minWidth={15}>
        <Typography color="common.white">{`${Math.round(value)}%`}</Typography>
      </Box>
    </Box>
  );
}

export default LinearProgressWithLabelValue;

function LinearProgressWithLabel(
  props: JSX.IntrinsicAttributes & LinearProgressProps,
) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {`${Math.round(props.value ?? 0)}%`}
        </Typography>
      </Box>
    </Box>
  );
}

LinearProgressWithLabel.propTypes = {
  /**
   * The value of the progress indicator for the determinate and buffer variants.
   * Value between 0 and 100.
   */
  value: PropTypes.number.isRequired,
};

export function LinearWithValueLabel() {
  const [progress, setProgress] = React.useState(10);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) =>
        prevProgress >= 100 ? 10 : prevProgress + 10,
      );
    }, 800);
    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className={cn.name}>
      <LinearProgressWithLabel value={progress} />
    </div>
  );
}
