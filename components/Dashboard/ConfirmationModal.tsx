// components/Dashboard/ConfirmationModal.tsx
// Or: components/UI/ConfirmationModal.tsx

import React from 'react';
import { Dialog, Transition } from '@headlessui/react'; // Using Headless UI for accessible modals
import {
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon // For processing spinner
} from '@heroicons/react/24/outline';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>; // Allow async confirm
  title: string;
  message: string | React.ReactNode; // Allow ReactNode for more complex messages
  confirmText?: string;
  cancelText?: string;
  isDangerousAction?: boolean; // Differentiates styling for dangerous actions
  isProcessing?: boolean; // Shows a loading state on the confirm button
  icon?: React.ElementType; // Custom icon for the modal title area
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDangerousAction = false,
  isProcessing = false,
  icon: CustomIcon,
}) => {
  const effectiveIcon = CustomIcon || (isDangerousAction ? ExclamationTriangleIcon : CheckIcon);
  const iconColorClass = isDangerousAction ? "text-red-500" : "text-green-500"; // Or blue-500 for general confirm

  const confirmButtonBaseClasses = "inline-flex items-center justify-center w-full sm:w-auto rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed";
  const confirmButtonColorClasses = isDangerousAction
    ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
    : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"; // Example: blue for non-dangerous

  const cancelButtonClasses = "mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={isProcessing ? () => {} : onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        {/* Modal Panel */}
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center"> {/* Centering */}
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${isDangerousAction ? 'bg-red-100' : 'bg-blue-100'} sm:mx-0 sm:h-10 sm:w-10`}>
                      <effectiveIcon className={`h-6 w-6 ${iconColorClass}`} aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                        {title}
                      </Dialog.Title>
                      <div className="mt-2">
                        {typeof message === 'string' ? (
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{message}</p>
                        ) : (
                          message // Render ReactNode directly
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 space-y-2 sm:space-y-0 sm:space-x-3 sm:space-x-reverse">
                  <button
                    type="button"
                    className={`${confirmButtonBaseClasses} ${confirmButtonColorClasses}`}
                    onClick={onConfirm}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      // No default icon here, text should be enough or pass one via confirmText
                      null
                    )}
                    {isProcessing ? "Processing..." : confirmText}
                  </button>
                  <button
                    type="button"
                    className={cancelButtonClasses}
                    onClick={onClose}
                    disabled={isProcessing}
                  >
                    {cancelText}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ConfirmationModal;