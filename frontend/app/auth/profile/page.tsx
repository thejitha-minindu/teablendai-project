"use client"; // Tells Next.js to run this component in the browser

// --- Imports ---
import type { ChangeEvent, ReactNode } from "react";
import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, Calendar, CheckCircle2, Globe, Loader2,
  Mail, MapPin, Phone, Save, ShieldCheck, ShoppingBag, Store, User, Camera, Trash2, Pencil, X
} from "lucide-react"; // UI Icons
import { apiClient } from "@/lib/apiClient"; // Tool for sending backend requests
import { API_BASE_URL } from "@/lib/api.config";
import { getHomePathByRole, getStoredToken, setStoredAuthToken, type UserRole } from "@/lib/auth"; // Auth tools

// --- Types ---
// This defines exactly what data we expect from the backend profile API
type ProfileResponse = {
  user_id: string;
  email: string;
  phone_num: string;
  user_name: string;
  first_name: string;
  last_name: string;
  nic?: string | null;
  default_role: UserRole;
  active_role: UserRole;
  available_roles: UserRole[];
  verification_status: string;
  seller_verification_status?: string | null;
  seller_requested_at?: string | null;
  seller_approved_at?: string | null;
  seller_rejection_reason?: string | null;
  can_become_seller: boolean;
  shipping_address?: string | null;
  profile_image_url?: string | null;
  seller_profile?: {
    seller_name?: string | null;
    seller_registration_no?: string | null;
    seller_started_year?: number | null;
    seller_website?: string | null;
    seller_description?: string | null;
    seller_street_address?: string | null;
    seller_province?: string | null;
    seller_city?: string | null;
    seller_postal_code?: string | null;
  } | null;
};

// The shapes of the data we hold in the forms before saving
type PersonalFormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone_num: string;
  nic: string;
  shipping_address: string;
};

type SellerFormState = {
  seller_name: string;
  seller_registration_no: string;
  seller_started_year: string;
  seller_website: string;
  seller_description: string;
  seller_street_address: string;
  seller_province: string;
  seller_city: string;
  seller_postal_code: string;
};

// Default empty form values
const emptyPersonalForm: PersonalFormState = {
  first_name: "", last_name: "", email: "", phone_num: "", nic: "", shipping_address: "",
};

const emptySellerForm: SellerFormState = {
  seller_name: "", seller_registration_no: "", seller_started_year: "", seller_website: "",
  seller_description: "", seller_street_address: "", seller_province: "", seller_city: "", seller_postal_code: "",
};

// Common CSS classes to make styling forms easier
const inputBaseClass =
  "h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 disabled:bg-gray-50 disabled:text-gray-500";

const textareaBaseClass =
  "w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 disabled:bg-gray-50 disabled:text-gray-500";

// A small helper to pick the right color for the status badges
function statusBadgeClass(status?: string | null) {
  switch ((status || "").toUpperCase()) {
    case "APPROVED": return "border-green-200 bg-green-50 text-green-700";
    case "PENDING": return "border-yellow-200 bg-yellow-50 text-yellow-700";
    case "REJECTED": return "border-red-200 bg-red-50 text-red-700";
    default: return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

// A helper to format timestamps into readable dates (e.g. 10/24/2026)
function formatDate(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString();
}

export default function AuthProfilePage() {
  const router = useRouter();
  
  // --- React State ---
  const [profile, setProfile] = useState<ProfileResponse | null>(null); // Full profile data from backend
  const [personalForm, setPersonalForm] = useState<PersonalFormState>(emptyPersonalForm); // Data in buyer form
  const [sellerForm, setSellerForm] = useState<SellerFormState>(emptySellerForm); // Data in seller form
  
  // UI Statuses
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [isSavingSeller, setIsSavingSeller] = useState(false);
  const [isSubmittingUpgrade, setIsSubmittingUpgrade] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const [showSellerUpgradeForm, setShowSellerUpgradeForm] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingSeller, setIsEditingSeller] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convenience variables calculated from the profile data
  const hasSellerAccess = profile?.available_roles?.includes("seller") ?? false;
  const isSellerPending = (profile?.seller_verification_status || "").toUpperCase() === "PENDING";
  const isSellerRejected = (profile?.seller_verification_status || "").toUpperCase() === "REJECTED";
  const activeRole = profile?.active_role ?? "buyer";
  const isSellerFieldsDisabled = (activeRole === "seller" && !isEditingSeller) || isSellerPending;

  // Figure out where "Dashboard" should link to (buyer or seller dashboard)
  const dashboardHref = useMemo(() => {
    if (!profile) return "/buyer/dashboard";
    return getHomePathByRole(profile.active_role);
  }, [profile]);

  // --- Handlers ---
  
  // Fills the forms with the data we received from the backend
  const hydrateForms = (data: ProfileResponse) => {
    setPersonalForm({
      first_name: data.first_name || "",
      last_name: data.last_name || "",
      email: data.email || "",
      phone_num: data.phone_num || "",
      nic: data.nic || "",
      shipping_address: data.shipping_address || "",
    });

    setSellerForm({
      seller_name: data.seller_profile?.seller_name || "",
      seller_registration_no: data.seller_profile?.seller_registration_no || "",
      seller_started_year: data.seller_profile?.seller_started_year
        ? String(data.seller_profile.seller_started_year)
        : "",
      seller_website: data.seller_profile?.seller_website || "",
      seller_description: data.seller_profile?.seller_description || "",
      seller_street_address: data.seller_profile?.seller_street_address || "",
      seller_province: data.seller_profile?.seller_province || "",
      seller_city: data.seller_profile?.seller_city || "",
      seller_postal_code: data.seller_profile?.seller_postal_code || "",
    });
  };

  // Fetches the user profile from the API when the page loads
  const loadProfile = async () => {
    try {
      setIsPageLoading(true);
      const response = await apiClient.get<ProfileResponse>("/profile");
      setProfile(response.data);
      hydrateForms(response.data); // Fill the forms with this data
    } catch (error: any) {
      console.error("Failed to load profile:", error);
      setErrorMsg(error?.response?.data?.detail || "Failed to load profile details.");
    } finally {
      setIsPageLoading(false);
    }
  };

  // Run this once when the component mounts
  useEffect(() => {
    if (!getStoredToken()) {
      router.replace("/auth"); // Kick out if not logged in
      return;
    }
    loadProfile();
  }, [router]);

  // Update specific fields in the personal (buyer) form state as the user types
  const handlePersonalChange =
    (field: keyof PersonalFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setPersonalForm((prev) => ({ ...prev, [field]: event.target.value }));
      if (errorMsg) setErrorMsg("");
      if (successMsg) setSuccessMsg("");
    };

  // Update specific fields in the seller form state as the user types
  const handleSellerChange =
    (field: keyof SellerFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setSellerForm((prev) => ({ ...prev, [field]: event.target.value }));
      if (errorMsg) setErrorMsg("");
      if (successMsg) setSuccessMsg("");
    };

  // Check the seller data before sending it to the backend
  const validateSellerForm = () => {
    const currentYear = new Date().getFullYear();
    const parsedYear = Number(sellerForm.seller_started_year);

    if (!/^\d{4}$/.test(sellerForm.seller_started_year)) {
      setErrorMsg("Started year must be a valid 4-digit year.");
      return false;
    }

    if (parsedYear < 1800 || parsedYear > currentYear) {
      setErrorMsg(`Started year must be between 1800 and ${currentYear}.`);
      return false;
    }

    return true; // Form is valid!
  };

  // API Call to save the personal (buyer) form
  const handleSavePersonal = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setIsSavingPersonal(true);

    try {
      const response = await apiClient.put<ProfileResponse>("/profile", {
        first_name: personalForm.first_name.trim(),
        last_name: personalForm.last_name.trim(),
        email: personalForm.email.trim(),
        phone_num: personalForm.phone_num.trim(),
        nic: personalForm.nic.trim() || null,
        shipping_address: personalForm.shipping_address.trim() || null,
      });

      setProfile(response.data); // Update local profile
      hydrateForms(response.data); // Refill forms
      setSuccessMsg("Profile details updated successfully.");
      setIsEditingPersonal(false);
    } catch (error: any) {
      setErrorMsg(error?.response?.data?.detail || "Failed to update profile.");
    } finally {
      setIsSavingPersonal(false);
    }
  };

  // API Call to save the seller profile (only works if they are already an approved seller)
  const handleSaveSeller = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!validateSellerForm()) return;

    setIsSavingSeller(true);

    try {
      const response = await apiClient.put<ProfileResponse>("/profile", {
        seller_name: sellerForm.seller_name.trim(),
        seller_registration_no: sellerForm.seller_registration_no.trim(),
        seller_started_year: Number(sellerForm.seller_started_year),
        seller_website: sellerForm.seller_website.trim(),
        seller_description: sellerForm.seller_description.trim(),
        seller_street_address: sellerForm.seller_street_address.trim(),
        seller_province: sellerForm.seller_province.trim(),
        seller_city: sellerForm.seller_city.trim(),
        seller_postal_code: sellerForm.seller_postal_code.trim(),
      });

      setProfile(response.data);
      hydrateForms(response.data);
      setSuccessMsg("Seller profile updated successfully.");
      setIsEditingSeller(false);
    } catch (error: any) {
      setErrorMsg(error?.response?.data?.detail || "Failed to update seller profile.");
    } finally {
      setIsSavingSeller(false);
    }
  };

  // API Call to request an upgrade from buyer to seller
  const handleBecomeSeller = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!validateSellerForm()) return;

    setIsSubmittingUpgrade(true);

    try {
      // Send the seller form data to the upgrade endpoint
      await apiClient.post("/profile/become-seller", {
        seller_name: sellerForm.seller_name.trim(),
        seller_registration_no: sellerForm.seller_registration_no.trim(),
        seller_started_year: Number(sellerForm.seller_started_year),
        seller_website: sellerForm.seller_website.trim(),
        seller_description: sellerForm.seller_description.trim(),
        seller_street_address: sellerForm.seller_street_address.trim(),
        seller_province: sellerForm.seller_province.trim(),
        seller_city: sellerForm.seller_city.trim(),
        seller_postal_code: sellerForm.seller_postal_code.trim(),
      });

      // Redirect to the pending page so they know they are waiting for admin approval
      router.push("/auth/pending?context=seller-upgrade");
    } catch (error: any) {
      setErrorMsg(error?.response?.data?.detail || "Failed to submit your seller request.");
    } finally {
      setIsSubmittingUpgrade(false);
    }
  };

  // API Call to switch the user's active role between buyer and seller (if they have access to both)
  const handleSwitchRole = async (targetRole: UserRole) => {
    setErrorMsg("");
    setSuccessMsg("");
    setIsSwitchingRole(true);

    try {
      // Tell backend to switch the role
      const response = await apiClient.post("/auth/switch-role", { role: targetRole });
      
      // The backend returns a NEW JWT token, containing the new active role
      const newToken = response?.data?.access_token;

      if (!newToken || typeof newToken !== "string") {
        throw new Error("Role switch did not return a valid access token");
      }

      // Save the new token so future API requests know we switched roles
      setStoredAuthToken(newToken);
      router.refresh();
      await loadProfile(); // Reload the profile to update the UI
      setSuccessMsg(`Switched to ${targetRole} profile view.`);
    } catch (error: any) {
      setErrorMsg(error?.response?.data?.detail || `Failed to switch to ${targetRole}.`);
    } finally {
      setIsSwitchingRole(false);
    }
  };

  // API Call to upload a new profile picture
  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await apiClient.post<{ profile_image_url: string }>("/profile/upload-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setProfile((prev) => prev ? { ...prev, profile_image_url: response.data.profile_image_url } : null);
      setSuccessMsg("Profile picture updated successfully.");
    } catch (error: any) {
      setErrorMsg(error?.response?.data?.detail || "Failed to upload profile picture.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // API Call to delete the profile picture
  const handleImageDelete = async () => {
    setIsDeletingImage(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await apiClient.put<ProfileResponse>("/profile", {
        profile_image_url: null,
      });

      setProfile(response.data);
      setSuccessMsg("Profile picture removed.");
    } catch (error: any) {
      setErrorMsg(error?.response?.data?.detail || "Failed to remove profile picture.");
    } finally {
      setIsDeletingImage(false);
    }
  };

  // --- UI Renderers ---

  // Loading Screen
  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-green-200 bg-white px-5 py-3 text-sm font-semibold text-green-700 shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  // Error Screen (if API fails completely)
  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 flex items-center justify-center px-4">
        <div className="max-w-md rounded-[2rem] border border-red-200 bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-bold text-gray-900">Profile unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            We couldn&apos;t load your profile details right now.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={loadProfile} className="rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700">
              Retry
            </button>
            <Link href="/auth" className="rounded-full border border-green-200 px-5 py-2 text-sm font-semibold text-green-700 hover:bg-green-50">
              Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main Profile Page
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
      
      {/* Header NavBar */}
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 md:px-10 lg:px-12">
        <Link href="/" className="flex items-center gap-3">
          <img src="/Tealogo.png" alt="Tea Blend AI Logo" className="h-15 w-35" />
        </Link>
        <div className="flex items-center gap-3">
          <Link href={dashboardHref} className="rounded-full border border-green-200 bg-white px-5 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50">
            Dashboard
          </Link>
          <Link href="/auth" className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-white px-5 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </header>

      <main className="px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-8">
          
          {/* Top Info Banner */}
          <section className="overflow-hidden rounded-[2rem] border border-green-100 bg-white/95 shadow-2xl shadow-green-100/60 backdrop-blur-sm">
            <div className="bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.14),transparent_38%)] px-6 py-8 sm:px-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                
                <div className="flex items-start gap-4 sm:gap-6">
                  {/* Profile Picture */}
                  <div className="relative group shrink-0">
                    <div className="h-20 w-20 sm:h-28 sm:w-28 overflow-hidden rounded-full border-4 border-white shadow-xl bg-gray-100 flex items-center justify-center relative">
                      {profile.profile_image_url ? (
                        <img 
                          src={profile.profile_image_url.startsWith('http') ? profile.profile_image_url : `${API_BASE_URL.replace('/api/v1', '')}${profile.profile_image_url}`} 
                          alt="Profile" 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-10 w-10 text-gray-400" />
                      )}
                      
                      {/* Upload Overlay */}
                      <div 
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" 
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {isUploadingImage ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Camera className="h-6 w-6 text-white" />}
                      </div>
                    </div>
                    
                    {/* Delete Button */}
                    {profile.profile_image_url && (
                      <button 
                        onClick={handleImageDelete}
                        disabled={isDeletingImage}
                        className="absolute bottom-0 right-0 p-1.5 sm:p-2 bg-white rounded-full text-red-500 shadow-md hover:bg-red-50 border border-gray-200 disabled:opacity-50"
                        title="Remove photo"
                      >
                        {isDeletingImage ? <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> : <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />}
                      </button>
                    )}
                    
                    {/* Hidden file input */}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.10em] text-green-700 mt-2">
                      Profile Center
                    </div>
                    <h1 className="mt-3 text-2xl font-bold text-gray-900 sm:text-4xl">
                      {profile.first_name} {profile.last_name}
                    </h1>
                    <p className="mt-2 text-xs leading-6 text-gray-600 sm:text-base">
                      Manage your buyer and seller profile details from one account.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(profile.verification_status)}`}>
                    Account {profile.verification_status}
                  </span>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    Active: {activeRole === "seller" ? "Seller" : "Buyer"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Success / Error Messages */}
          {(errorMsg || successMsg) && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                errorMsg
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-green-200 bg-green-50 text-green-700"
              }`}
            >
              {errorMsg || successMsg}
            </div>
          )}

          {/* Status Cards (Available Roles, Seller Request, Actions) */}
          <section className="grid gap-4 md:grid-cols-3">
            
            {/* Available Roles Card */}
            <div className="rounded-[1.5rem] border border-green-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Available Roles</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.available_roles.map((role) => (
                  <span key={role} className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                    {role === "seller" ? "Seller" : "Buyer"}
                  </span>
                ))}
              </div>
            </div>

            {/* Request Status Card */}
            <div className="rounded-[1.5rem] border border-green-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Seller Request</p>
              <p className="mt-3 text-sm font-semibold text-gray-800">{profile.seller_verification_status || "Not requested"}</p>
              <p className="mt-1 text-xs text-gray-500">Requested: {formatDate(profile.seller_requested_at)}</p>
            </div>

            {/* Role Actions Card */}
            <div className="rounded-[1.5rem] border border-green-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Role Actions</p>
              <div className="mt-3 flex flex-col gap-2">
                {/* Button to switch from buyer to seller (only if they are an approved seller) */}
                {hasSellerAccess && activeRole === "buyer" && (
                  <button onClick={() => handleSwitchRole("seller")} disabled={isSwitchingRole} className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
                    {isSwitchingRole ? "Switching..." : "Switch to Seller"}
                  </button>
                )}

                {/* Button to switch from seller back to buyer */}
                {hasSellerAccess && activeRole === "seller" && (
                  <button onClick={() => handleSwitchRole("buyer")} disabled={isSwitchingRole} className="rounded-full border border-green-200 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50 disabled:opacity-60">
                    {isSwitchingRole ? "Switching..." : "Switch to Buyer"}
                  </button>
                )}

                {/* Button to open the seller upgrade form */}
                {!hasSellerAccess && !isSellerPending && profile.can_become_seller && (
                  <button onClick={() => setShowSellerUpgradeForm((prev) => !prev)} className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
                    {showSellerUpgradeForm ? "Hide Seller Form" : "Become a Seller"}
                  </button>
                )}

                {/* Status indicator for seller approval */}
                {isSellerPending ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm font-semibold text-yellow-700">
                    <Loader2 className="h-4 w-4 animate-spin" /> Seller approval pending
                  </div>
                ) : profile.seller_verification_status === "APPROVED" ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
                    <CheckCircle2 className="h-4 w-4" /> Seller Approved
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          {/* BUYER PROFILE FORM */}
          <section className="overflow-hidden rounded-[2rem] border border-green-100 bg-white/95 shadow-xl shadow-green-100/50">
            <div className="border-b border-green-100 px-6 py-6 sm:px-8">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-green-50 p-3 text-green-700"><User className="h-5 w-5" /></div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Buyer Profile</h2>
                  <p className="text-sm text-gray-500">Shared account details and buyer information.</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-8 sm:px-8">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="First Name" icon={<User className="h-5 w-5" />}>
                  <input value={personalForm.first_name} onChange={handlePersonalChange("first_name")} disabled={!isEditingPersonal} className={inputBaseClass} />
                </Field>
                <Field label="Last Name" icon={<User className="h-5 w-5" />}>
                  <input value={personalForm.last_name} onChange={handlePersonalChange("last_name")} disabled={!isEditingPersonal} className={inputBaseClass} />
                </Field>
                <Field label="Email Address" icon={<Mail className="h-5 w-5" />}>
                  <input type="email" value={personalForm.email} onChange={handlePersonalChange("email")} disabled={!isEditingPersonal} className={inputBaseClass} />
                </Field>
                <Field label="Phone Number" icon={<Phone className="h-5 w-5" />}>
                  <input value={personalForm.phone_num} onChange={handlePersonalChange("phone_num")} disabled={!isEditingPersonal} className={inputBaseClass} />
                </Field>
                <Field label="NIC" icon={<ShieldCheck className="h-5 w-5" />}>
                  <input value={personalForm.nic} onChange={handlePersonalChange("nic")} disabled={!isEditingPersonal} className={inputBaseClass} placeholder="Optional NIC number" />
                </Field>
                <Field label="Shipping Address" icon={<MapPin className="h-5 w-5" />} fullWidth>
                  <textarea value={personalForm.shipping_address} onChange={handlePersonalChange("shipping_address")} disabled={!isEditingPersonal} className={textareaBaseClass} rows={4} />
                </Field>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                {!isEditingPersonal ? (
                  <button onClick={() => setIsEditingPersonal(true)} className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                    <Pencil className="h-4 w-4" /> Edit Profile
                  </button>
                ) : (
                  <>
                    <button onClick={() => { setIsEditingPersonal(false); if (profile) hydrateForms(profile); }} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                      <X className="h-4 w-4" /> Cancel
                    </button>
                    <button onClick={handleSavePersonal} disabled={isSavingPersonal} className="inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
                      {isSavingPersonal ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Buyer Profile
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* SELLER PROFILE FORM (Only show if they are a seller, upgrading, or checking status) */}
          {(activeRole === "seller" || showSellerUpgradeForm || isSellerPending || isSellerRejected) && (
            <section className="overflow-hidden rounded-[2rem] border border-green-100 bg-white/95 shadow-xl shadow-green-100/50">
              <div className="border-b border-green-100 px-6 py-6 sm:px-8">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-green-50 p-3 text-green-700">
                    {activeRole === "seller" ? <Store className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {activeRole === "seller" ? "Seller Profile" : "Seller Upgrade"}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {activeRole === "seller" ? "Seller business details shown after approval." : "Complete the missing seller fields using your existing buyer account."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-8 sm:px-8">
                
                {/* Warnings based on application status */}
                {isSellerRejected && (
                  <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {profile.seller_rejection_reason || "Your previous seller request was rejected. You can update the details and submit again."}
                  </div>
                )}
                {isSellerPending && activeRole !== "seller" && (
                  <div className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-medium text-yellow-700">
                    Your seller request is pending admin approval. The submitted details are shown below.
                  </div>
                )}

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="Seller Name" icon={<Building2 className="h-5 w-5" />}>
                    <input value={sellerForm.seller_name} onChange={handleSellerChange("seller_name")} disabled={isSellerFieldsDisabled} className={inputBaseClass} />
                  </Field>
                  <Field label="Registration No" icon={<ShieldCheck className="h-5 w-5" />}>
                    <input value={sellerForm.seller_registration_no} onChange={handleSellerChange("seller_registration_no")} disabled={isSellerFieldsDisabled} className={inputBaseClass} />
                  </Field>
                  <Field label="Started Year" icon={<Calendar className="h-5 w-5" />}>
                    <input value={sellerForm.seller_started_year} onChange={handleSellerChange("seller_started_year")} disabled={isSellerFieldsDisabled} className={inputBaseClass} inputMode="numeric" />
                  </Field>
                  <Field label="Website (Optional)" icon={<Globe className="h-5 w-5" />}>
                    <input value={sellerForm.seller_website} onChange={handleSellerChange("seller_website")} disabled={isSellerFieldsDisabled} className={inputBaseClass} />
                  </Field>
                  <Field label="Seller Description" icon={<Store className="h-5 w-5" />} fullWidth>
                    <textarea value={sellerForm.seller_description} onChange={handleSellerChange("seller_description")} disabled={isSellerFieldsDisabled} className={textareaBaseClass} rows={4} />
                  </Field>
                  <Field label="Street Address" icon={<MapPin className="h-5 w-5" />} fullWidth>
                    <textarea value={sellerForm.seller_street_address} onChange={handleSellerChange("seller_street_address")} disabled={isSellerFieldsDisabled} className={textareaBaseClass} rows={3} />
                  </Field>
                  <Field label="Province" icon={<MapPin className="h-5 w-5" />}>
                    <input value={sellerForm.seller_province} onChange={handleSellerChange("seller_province")} disabled={isSellerFieldsDisabled} className={inputBaseClass} />
                  </Field>
                  <Field label="City" icon={<MapPin className="h-5 w-5" />}>
                    <input value={sellerForm.seller_city} onChange={handleSellerChange("seller_city")} disabled={isSellerFieldsDisabled} className={inputBaseClass} />
                  </Field>
                  <Field label="Postal Code" icon={<MapPin className="h-5 w-5" />}>
                    <input value={sellerForm.seller_postal_code} onChange={handleSellerChange("seller_postal_code")} disabled={isSellerFieldsDisabled} className={inputBaseClass} />
                  </Field>
                </div>

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  {/* Depending on if they are already a seller, the button either saves changes or submits a new request */}
                  {activeRole === "seller" ? (
                    !isEditingSeller ? (
                      <button onClick={() => setIsEditingSeller(true)} className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                        <Pencil className="h-4 w-4" /> Edit Profile
                      </button>
                    ) : (
                      <>
                        <button onClick={() => { setIsEditingSeller(false); if (profile) hydrateForms(profile); }} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                          <X className="h-4 w-4" /> Cancel
                        </button>
                        <button onClick={handleSaveSeller} disabled={isSavingSeller} className="inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
                          {isSavingSeller ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Seller Profile
                        </button>
                      </>
                    )
                  ) : !isSellerPending ? (
                    <button onClick={handleBecomeSeller} disabled={isSubmittingUpgrade} className="inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
                      {isSubmittingUpgrade ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Submit Seller Request
                    </button>
                  ) : null}
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

// A reusable little helper component that wraps an input with a label and an icon
function Field({
  label, icon, children, fullWidth = false,
}: {
  label: string; icon: ReactNode; children: ReactNode; fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "md:col-span-2" : ""}>
      <label className="mb-2 block text-sm font-semibold text-gray-700">{label}</label>
      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-3.5 text-gray-400">{icon}</div>
        {children}
      </div>
    </div>
  );
}
