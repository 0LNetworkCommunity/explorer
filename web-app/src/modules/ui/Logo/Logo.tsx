import { FC } from 'react';

interface Props {
  color?: string;
  className?: string;
}

const Logo: FC<Props> = ({ color = '#FFFFFF', className }) => {
  return (
    <div className="flex gap-2 justify-center items-center">
      <svg
        viewBox="0 0 512 512"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        className={className}
      >
        <path
          d="M235.037221,38.1141439 C219.703043,39.5333081 204.827408,42.5348413 190.57072,46.954664 L235.037221,170.243176 L235.037221,38.1141439 Z M158.570157,58.4416873 C140.097739,67.5557091 123.088094,79.20258 107.990074,92.9312808 L207.086849,193.111663 L158.570157,58.4416873 Z M84.0115865,118.153846 C74.0933981,130.710128 65.4990409,144.378861 58.4416873,158.944874 L174.054591,209.627792 L84.0115865,118.153846 Z M46.2761762,191.841191 C40.9485793,209.232222 37.706717,227.54032 36.8436725,246.471464 L171.513648,246.471464 L46.2761762,191.841191 Z M35.573201,276.962779 C37.1109118,293.22474 40.5059465,308.962727 45.5496031,323.970223 L165.16129,276.962779 L35.573201,276.962779 Z M60.9826303,357.809681 C69.5443864,374.094568 80.103652,389.179167 92.3372361,402.739454 L180.406948,309.995037 L60.9826303,357.809681 Z M118.153846,427.929934 C129.121564,436.70686 140.948402,444.452131 153.487515,451.01737 L196.923077,344.297767 L118.153846,427.929934 Z M186.759305,464.979006 C202.160066,470.136421 218.323445,473.601967 235.037221,475.156328 L235.037221,345.568238 L186.759305,464.979006 Z M266.799007,476.426799 C383.472927,471.080278 476.426799,374.722302 476.426799,256.635673 C476.426799,138.548694 383.472927,42.1896691 266.799007,36.8436725 L266.799007,252.344823 L266.799007,252.344823 L266.799007,252.344823 L266.799007,254.410723 L266.799007,254.412471 L266.799007,254.412471 L266.799007,272.455013 L266.799007,272.455013 L266.799007,272.455013 L266.799007,476.426799 Z M256.000874,0 C114.615227,0 0,114.615157 0,256.000717 C0,397.385228 114.615227,512 256.000874,512 C397.385298,512 512,397.385228 512,256.000717 C512,114.615157 397.385298,0 256.000874,0 Z"
          fillRule="evenodd"
          fill={color}
        />
      </svg>
      <span className="text-white font-medium text-base whitespace-nowrap">OL Explorer</span>
    </div>
  );
};

export default Logo;
