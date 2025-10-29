import { useState } from 'react';

interface CloseCareTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { closeReason: string; notes?: string; closedByUserKey?: string }) => void;
  isPending: boolean;
  currentUserId?: string;
}

export function CloseCareTransitionModal({ isOpen, onClose, onSubmit, isPending, currentUserId }: CloseCareTransitionModalProps) {
  const [closeReason, setCloseReason] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setCloseReason('');
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log('=== Close Care Transition Submit ===');
    console.log('closeReason:', closeReason);
    console.log('notes:', notes);
    console.log('currentUserId:', currentUserId);

    onSubmit({
      closeReason,
      notes: notes || undefined,
      closedByUserKey: currentUserId || '',
    });

    // Reset form after submission
    resetForm();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-25 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative bg-purple-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Close Care Transition</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
              disabled={isPending}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Close Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Close Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                required
                className="block pl-2 bg-black h-10 w-full rounded-lg border-gray-800 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              >
                <option value="">Select a reason...</option>
                <option value="Completed Successfully">Completed Successfully</option>
                <option value="Patient Discharged">Patient Discharged</option>
                <option value="Patient Declined Services">Patient Declined Services</option>
                <option value="Unable to Contact">Unable to Contact</option>
                <option value="Transferred to Another Facility">Transferred to Another Facility</option>
                <option value="No Longer Needed">No Longer Needed</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="block bg-black p-2 w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                placeholder="Additional notes about closing this care transition..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !closeReason}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isPending ? 'Closing...' : 'Close Care Transition'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
