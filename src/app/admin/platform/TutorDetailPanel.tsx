import React from "react";
import TutorEditForm from "./TutorEditForm";

type TutorDetailPanelProps = {
  tutor: {
    id: number;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    province?: string | null;
    price_per_hour?: number | null;
    experience_years?: number | null;
    levels?: string[] | null;
    mode_online?: boolean;
    mode_offline?: boolean;
    bank_name?: string | null;
    bank_account_number?: string | null;
    bank_account_holder?: string | null;
    bio?: string | null;
    verification_note?: string | null;
    subjects?: { name: string }[];
  };
  editForm: Record<string, any>;
  editing: boolean;
  acting: boolean;
  updateField: (field: string, value: any) => void;
  onSave: (id: number) => void;
  onCancelEdit: () => void;
};

export default function TutorDetailPanel({
  tutor,
  editForm,
  editing,
  acting,
  updateField,
  onSave,
  onCancelEdit,
}: TutorDetailPanelProps) {
  return (
    <div className="mt-4 border-t border-gray-200 pt-4 text-sm text-gray-700 space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Email</div>
          <div className="mt-1 text-slate-900">{tutor.email ?? "-"}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Telepon</div>
          <div className="mt-1 text-slate-900">{tutor.phone ?? "-"}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Alamat</div>
          <div className="mt-1 text-slate-900">{[tutor.address, tutor.city, tutor.province].filter(Boolean).join(", ") || "-"}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Harga / jam</div>
          <div className="mt-1 text-slate-900">{tutor.price_per_hour != null ? `Rp ${tutor.price_per_hour.toLocaleString()}` : "-"}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Pengalaman</div>
          <div className="mt-1 text-slate-900">{tutor.experience_years != null ? `${tutor.experience_years} tahun` : "-"}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Jenjang</div>
          <div className="mt-1 text-slate-900">{tutor.levels?.join(" / ") || "-"}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Mode</div>
          <div className="mt-1 text-slate-900">{[tutor.mode_online ? "Online" : null, tutor.mode_offline ? "Offline" : null].filter(Boolean).join(" / ") || "-"}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Bank</div>
          <div className="mt-1 text-slate-900">{tutor.bank_name ? `${tutor.bank_name} • ${tutor.bank_account_number} • ${tutor.bank_account_holder}` : "-"}</div>
        </div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500">Bio</div>
        <div className="mt-1 text-slate-900">{tutor.bio || "-"}</div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500">Catatan verifikasi</div>
        <div className="mt-1 text-slate-900">{tutor.verification_note || "-"}</div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500">Mata pelajaran</div>
        <div className="mt-1 text-slate-900">{tutor.subjects?.map((subject) => subject.name).join(", ") || "-"}</div>
      </div>
      {editing && (
        <TutorEditForm
          tutorId={tutor.id}
          editForm={editForm}
          updateField={updateField}
          onSave={onSave}
          onCancel={onCancelEdit}
          acting={acting}
        />
      )}
    </div>
  );
}
