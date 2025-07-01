import { useState, useCallback } from 'react';

interface UseModalReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Custom hook for managing modal state
 * 
 * @param initialState - Initial open state (default: false)
 * @returns Object with modal state and control functions
 * 
 * @example
 * const modal = useModal();
 * 
 * return (
 *   <>
 *     <button onClick={modal.open}>Open Modal</button>
 *     <Modal isOpen={modal.isOpen} onClose={modal.close} title="My Modal">
 *       Modal content here
 *     </Modal>
 *   </>
 * );
 */
export const useModal = (initialState: boolean = false): UseModalReturn => {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
};