'use client';

import CountUp from "react-countup";

const AnimatedCounter = ({ amount }: { amount: number }) => {
  return (
    <div className="w-full">
        <CountUp 
            end={amount}
            decimal=","
            prefix="$"
            duration={1.25}
        />
    </div>
  )
}

export default AnimatedCounter