import React from "react";
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  MapPin, 
  Home, 
  Key, 
  FileText, 
  DollarSign, 
  Clock, 
  Award, 
  CheckCircle,
  XCircle
} from "lucide-react";

type TutorEditFormProps = {
  tutorId: number;
  editForm: Record<string, any>;
  updateField: (field: string, value: any) => void;
  onSave: (id: number) => void;
  onCancel: () => void;
  acting: boolean;
};

export default function TutorEditForm({
  tutorId,
  editForm,
  updateField,
  onSave,
  onCancel,
  acting,
}: TutorEditFormProps) {
  const formFields = [
    { label: "Nama", field: "name", value: editForm.name, icon: <User size={14} />, type: "text" },
    { label: "Email", field: "email", value: editForm.email, icon: <Mail size={14} />, type: "email" },
    { label: "Telepon", field: "phone", value: editForm.phone, icon: <Phone size={14} />, type: "text" },
    { label: "Judul", field: "headline", value: editForm.headline, icon: <Briefcase size={14} />, type: "text" },
    { label: "Kota", field: "city", value: editForm.city, icon: <MapPin size={14} />, type: "text" },
    { label: "Provinsi", field: "province", value: editForm.province, icon: <MapPin size={14} />, type: "text" },
    { label: "Alamat", field: "address", value: editForm.address, icon: <Home size={14} />, type: "text" },
    { label: "Password Baru", field: "password", value: editForm.password, icon: <Key size={14} />, type: "password" },
    { label: "Harga per jam", field: "price_per_hour", value: editForm.price_per_hour, icon: <DollarSign size={14} />, type: "number" },
    { label: "Pengalaman (tahun)", field: "experience_years", value: editForm.experience_years, icon: <Clock size={14} />, type: "number" },
    { label: "Badge", field: "badge", value: editForm.badge, icon: <Award size={14} />, type: "text" },
    { label: "Catatan Verifikasi", field: "verification_note", value: editForm.verification_note, icon: <CheckCircle size={14} />, type: "text" },
  ];

  return (
    <div className="border border-blue-200 bg-blue-50 p-4">
      <div className="mb-3 text-sm font-semibold text-gray-900 flex items-center gap-2">
        <FileText size={16} className="text-blue-600" />
        Edit Data Tutor
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {formFields.map(({ label, field, value, icon, type }) => (
          <label 
            key={field} 
            className={`block text-xs font-medium text-gray-700 ${
              field === "bio" ? "md:col-span-2" : ""
            } ${field === "levels" ? "md:col-span-2" : ""}`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-gray-500">{icon}</span>
              {label}
            </div>
            {field === "bio" ? (
              <textarea
                value={editForm.bio ?? ""}
                onChange={(e) => updateField("bio", e.target.value)}
                className="mt-1 w-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none"
                rows={3}
              />
            ) : field === "levels" ? (
              <input
                value={Array.isArray(editForm.levels) ? editForm.levels.join(", ") : ""}
                onChange={(e) => updateField("levels", e.target.value.split(",").map((value) => value.trim()).filter(Boolean))}
                placeholder="Pisahkan dengan koma"
                className="mt-1 w-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none"
              />
            ) : (
              <input
                type={type === "password" ? "password" : type === "number" ? "number" : "text"}
                value={value ?? ""}
                onChange={(e) => {
                  if (type === "number") {
                    updateField(field, Number(e.target.value));
                  } else {
                    updateField(field, e.target.value);
                  }
                }}
                className="mt-1 w-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none"
              />
            )}
          </label>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSave(tutorId)}
          disabled={acting}
          className="border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:bg-blue-700 transition-colors focus:outline-none"
        >
          Simpan
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none"
        >
          Batal
        </button>
      </div>
    </div>
  );
}