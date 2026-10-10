import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, Send } from 'lucide-react';
import { api } from '../lib/api.ts';

interface CorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEntityName?: string;
  defaultEntityId?: string;
  defaultEntityType?: 'bus' | 'route' | 'counter' | 'company' | 'other';
}

export const CorrectionModal: React.FC<CorrectionModalProps> = ({
  isOpen,
  onClose,
  defaultEntityName = '',
  defaultEntityId = '',
  defaultEntityType = 'bus',
}) => {
  const [busOrRouteName, setBusOrRouteName] = useState(defaultEntityName);
  const [incorrectInfo, setIncorrectInfo] = useState('');
  const [proposedCorrection, setProposedCorrection] = useState('');
  const [proofLink, setProofLink] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [submitterPhone, setSubmitterPhone] = useState('');
  const [submitterComments, setSubmitterComments] = useState('');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busOrRouteName.trim() || !incorrectInfo.trim() || !proposedCorrection.trim()) {
      setErrorMsg('বাস/রুটের নাম, ভুল তথ্য এবং সঠিক প্রস্তাব পূরণ করুন।');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.submitCorrection({
        bus_or_route_name: busOrRouteName,
        entity_id: defaultEntityId || undefined,
        entity_type: defaultEntityType,
        incorrect_info: incorrectInfo,
        proposed_correction: proposedCorrection,
        proof_link: proofLink,
        submitter_name: submitterName,
        submitter_phone: submitterPhone,
        submitter_comments: submitterComments,
      });

      setSuccessMsg(res.message_bn || 'আপনার তথ্য সংশোধনের অনুরোধ সফলভাবে জমা দেওয়া হয়েছে!');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'অনুরোধ জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-emerald-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">তথ্য সংশোধনের অনুরোধ পাঠান</h3>
              <p className="text-xs text-slate-500">ভুল তথ্য থাকলে যাচাইয়ের জন্য আমাদের জানান</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        {successMsg ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="text-lg font-bold text-slate-900">ধন্যবাদ!</h4>
            <p className="text-sm text-slate-600">{successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                বাস বা রুটের নাম <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={busOrRouteName}
                onChange={(e) => setBusOrRouteName(e.target.value)}
                placeholder="যেমন: শ্যামলী পরিবহন / পাবনা-ঢাকা রুট"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                কোন তথ্যটি ভুল? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={incorrectInfo}
                onChange={(e) => setIncorrectInfo(e.target.value)}
                rows={2}
                placeholder="যেমন: ভাড়া বর্তমানে ৬৫০ টাকা নয়, অথবা ছাড়ার সময় ভুল"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                সঠিক তথ্যের প্রস্তাবনা <span className="text-red-500">*</span>
              </label>
              <textarea
                value={proposedCorrection}
                onChange={(e) => setProposedCorrection(e.target.value)}
                rows={2}
                placeholder="সঠিক সময়, বর্তমান ভাড়া বা নতুন কাউন্টার নম্বর উল্লেখ করুন"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                প্রমাণের লিংক বা তথ্যের উৎস (যদি থাকে)
              </label>
              <input
                type="text"
                value={proofLink}
                onChange={(e) => setProofLink(e.target.value)}
                placeholder="অফিসিয়াল পোস্ট বা টিকিট ফটোর লিংক"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">আপনার নাম (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={submitterName}
                  onChange={(e) => setSubmitterName(e.target.value)}
                  placeholder="নাম"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">মোবাইল নম্বর (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={submitterPhone}
                  onChange={(e) => setSubmitterPhone(e.target.value)}
                  placeholder="০১৭xxxxxxxx"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">অতিরিক্ত মন্তব্য</label>
              <input
                type="text"
                value={submitterComments}
                onChange={(e) => setSubmitterComments(e.target.value)}
                placeholder="যেকোনো প্রাসঙ্গিক বিস্তারিত"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'জমা হচ্ছে...' : 'অনুরোধ পাঠান'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
