import { useEffect } from 'react';

/**
 * Hook to intercept Android hardware/gesture back button for closing modals or drawers.
 */
export function useAndroidBackNavigation(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    // Push a dummy state so back navigation triggers popstate
    const stateId = 'capp_modal_' + Date.now();
    window.history.pushState({ cappModal: stateId }, '');

    const handlePopState = (e: PopStateEvent) => {
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Clean up history state if closed by other means (e.g. user tap close button)
      if (window.history.state && window.history.state.cappModal === stateId) {
        window.history.back();
      }
    };
  }, [isOpen, onClose]);
}
