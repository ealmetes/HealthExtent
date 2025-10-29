import { useState } from 'react';
import type { LogOutreachRequest } from '@/types';

interface LogOutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LogOutreachRequest) => void;
  isPending: boolean;
  currentUserId?: string; // Current user's ID from members_hp
}

export function LogOutreachModal({ isOpen, onClose, onSubmit, isPending, currentUserId }: LogOutreachModalProps) {
  const [outreachMethod, setOutreachMethod] = useState('Phone');
  const [contactOutcome, setContactOutcome] = useState('Left VM');
  const [nextOutreachDate, setNextOutreachDate] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setOutreachMethod('Phone');
    setContactOutcome('Left VM');
    setNextOutreachDate('');
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Current datetime in ISO format for outreachDate
    const now = new Date().toISOString();

    // Convert nextOutreachDate from datetime-local format to ISO string
    let nextOutreachDateISO: string | undefined = undefined;
    if (nextOutreachDate) {
      // datetime-local gives us "YYYY-MM-DDTHH:mm", convert to ISO string
      nextOutreachDateISO = new Date(nextOutreachDate).toISOString();
    }

    console.log('=== Log Outreach Submit ===');
    console.log('nextOutreachDate (from input):', nextOutreachDate);
    console.log('nextOutreachDateISO (converted):', nextOutreachDateISO);

    const submitData = {
      outreachMethod,
      outreachDate: now,
      contactOutcome,
      nextOutreachDate_TS: nextOutreachDateISO,
      notes: notes || undefined,
      assignedToUserKey: currentUserId || '',
      Status:"In Progress"
    };

    console.log('Submit data:', submitData);
    console.log('currentUserId:', currentUserId);

    onSubmit(submitData);

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
            <h3 className="text-lg font-semibold text-gray-900">Log Outreach</h3>
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
            {/* Method */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Method <span className="text-red-500">*</span>
              </label>
              <select
                value={outreachMethod}
                onChange={(e) => setOutreachMethod(e.target.value)}
                required
                className="block pl-2 bg-black h-10 w-full rounded-lg border-gray-800 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              >
                <option value="Phone">Phone</option>
                <option value="Email">Email</option>
                <option value="SMS">SMS</option>
                <option value="InPerson">In Person</option>
              </select>
            </div>

            {/* Outcome */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Outcome <span className="text-red-500">*</span>
              </label>
              <select
                value={contactOutcome}
                onChange={(e) => setContactOutcome(e.target.value)}
                required
                className="block pl-2 bg-black h-10 w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              >
                <option value="Reached">Reached</option>
                <option value="Left VM">Left VM</option>
                <option value="No Answer">No Answer</option>
                <option value="Wrong Number">Wrong Number</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Next Outreach Date */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Next Outreach Date
              </label>
              <input
                type="datetime-local"
                value={nextOutreachDate}
                onChange={(e) => setNextOutreachDate(e.target.value)}
                className="block pl-2 bg-black h-10 w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
              />
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
                placeholder="Additional notes about this outreach attempt..."
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
                disabled={isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isPending ? 'Logging...' : 'Log Outreach'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
