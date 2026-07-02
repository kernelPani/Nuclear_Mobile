import { DialogPanel, Dialog as HeadlessDialog } from '@headlessui/react';
import { AnimatePresence, motion } from 'motion/react';
import React, { FC, PropsWithChildren } from 'react';

import { cn } from '../../utils';
import { DialogContext } from './context';
import { DialogOverlayBackdrop } from './DialogOverlayBackdrop';
import { DialogXClose } from './DialogXClose';

type DialogRootProps = PropsWithChildren<{
  isOpen: boolean;
  onClose: () => void;
  initialFocus?: React.RefObject<HTMLElement | null>;
  className?: string;
  showCloseButton?: boolean;
  // Full-bleed variant for mobile: the panel fills the viewport (minus safe-area
  // insets) instead of floating centered with a margin. The default centered
  // card layout is kept intact for desktop dialogs.
  fullScreen?: boolean;
}>;

export const DialogRoot: FC<DialogRootProps> = ({
  isOpen,
  onClose,
  initialFocus,
  className,
  showCloseButton = true,
  fullScreen = false,
  children,
}) => {
  return (
    <DialogContext.Provider value={{ onClose }}>
      <AnimatePresence>
        {isOpen && (
          <HeadlessDialog
            static
            open={isOpen}
            onClose={onClose}
            initialFocus={initialFocus}
            className="relative z-50"
          >
            <DialogOverlayBackdrop />
            <div
              className={cn(
                'fixed inset-0 flex items-center justify-center',
                fullScreen ? 'p-0' : 'p-4',
              )}
            >
              <motion.div
                className={fullScreen ? 'h-dvh w-screen' : undefined}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 17,
                  mass: 0.8,
                }}
              >
                <DialogPanel
                  className={cn(
                    'border-border bg-background shadow-shadow relative',
                    fullScreen
                      ? 'pt-safe-top pb-safe-bottom pl-safe-left pr-safe-right flex h-full w-full flex-col border-(length:--border-width)'
                      : 'w-full max-w-md rounded-md border-(length:--border-width) p-6',
                    className,
                  )}
                >
                  {showCloseButton && <DialogXClose />}
                  {children}
                </DialogPanel>
              </motion.div>
            </div>
          </HeadlessDialog>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
};
