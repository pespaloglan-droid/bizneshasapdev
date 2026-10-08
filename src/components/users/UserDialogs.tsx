import React from 'react';
import { X } from 'lucide-react';
import { AppUser, LanguageCode } from '../../types';

interface DeleteUserDialogProps {
  language: LanguageCode;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({
  language,
  onCancel,
  onConfirm,
}) => (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
      <p className="font-bold text-gray-800 text-sm">
        {language === 'tm'
          ? 'Bu ulanyjyny pozmak isleýärsiňizmi?'
          : 'Bu kullanıcıyı silmek istiyor musunuz?'}
      </p>
      <div className="flex gap-3 justify-center">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
        >
          Ýatyr
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-6 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs"
        >
          Pozmak
        </button>
      </div>
    </div>
  </div>
);

interface ResetPasswordDialogProps {
  user: AppUser;
  password: string;
  confirmPassword: string;
  error: string;
  onPasswordChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({
  user,
  password,
  confirmPassword,
  error,
  onPasswordChange,
  onConfirmChange,
  onClose,
  onSubmit,
}) => (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
    <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-[#0B1F3A] to-[#163864] text-white flex items-center justify-between">
        <span className="font-bold text-sm">Paroly täzele</span>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-5 space-y-3">
        <p className="text-xs text-gray-500 font-medium">{user.fullName}</p>
        <input
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="Täze parol"
          className="w-full h-9 px-3 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 outline-none"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => onConfirmChange(e.target.value)}
          placeholder="Paroly tassykla"
          className="w-full h-9 px-3 border border-gray-200 rounded-xl text-sm bg-[#F8FAFC] focus:ring-2 focus:ring-emerald-500 outline-none"
        />
        {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs"
          >
            Ýatyr
          </button>
          <button
            type="submit"
            className="h-9 px-5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs"
          >
            Ýatda sakla
          </button>
        </div>
      </div>
    </form>
  </div>
);
