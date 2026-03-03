import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useMobileDetect() {
    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT);

    useEffect(() => {
        const onResize = () => {
            setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    return isMobile;
}
