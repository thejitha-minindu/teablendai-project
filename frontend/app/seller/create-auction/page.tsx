"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; 
import { ArrowRight, ArrowLeft, CheckCircle2, Home, Package, DollarSign } from 'lucide-react'; 
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';

const SRI_LANKAN_GRADES = [
  "BOP", "BOPF", "OP", "OP1", "OPA", "FBOP", 
  "Pekoe", "Pekoe 1", "Dust", "Dust 1", "Silver Tips", "Golden Tips"
];

export default function CreateAuctionPage() {
  const router = useRouter(); 
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [minDateTime, setMinDateTime] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [formData, setFormData] = useState({
    companyName: '',
    estateName: '',
    sellerBrand: '',
    grade: '',
    customGrade: '',
    quantity: '',
    origin: '',
    description: '',
    startingPrice: '',
    scheduledStart: '',
    duration: ''
  });

  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setMinDateTime(now.toISOString().slice(0, 16));
  }, []);

  const handleNext = () => {
    if (step === 1) {
      if (!formData.companyName.trim() || !formData.estateName.trim()) {
        toast.error("Please fill in all required fields.");
        return;
      }
    }
    if (step === 2) {
      if (!formData.grade || (formData.grade === "Other" && !formData.customGrade.trim())) {
        toast.error("Please specify the tea grade.");
        return;
      }
      if (!formData.origin.trim() || !formData.quantity || parseFloat(formData.quantity) <= 0) {
        toast.error("Please provide a valid origin and a positive quantity.");
        return;
      }
    }
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Step 3
    if (!formData.startingPrice || parseFloat(formData.startingPrice) < 0) {
      toast.error("Please provide a valid starting price.");
      return;
    }
    if (!formData.scheduledStart) {
      toast.error("Please select a scheduled start time.");
      return;
    }
    const startTime = new Date(formData.scheduledStart);
    if (startTime <= new Date()) {
      toast.error("Scheduled start time must be in the future.");
      return;
    }
    if (!formData.duration || parseFloat(formData.duration) <= 0) {
      toast.error("Please provide a valid duration.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate scheduled start is in the future (client-side guard)
      if (!formData.scheduledStart) {
        alert('Please select a scheduled start time.');
        setIsSubmitting(false);
        return;
      }

      const selected = new Date(formData.scheduledStart).getTime();
      const now = Date.now();
      // require at least 30 seconds in the future to account for small clock skew
      if (selected <= now + 30 * 1000) {
        alert('Scheduled start time must be in the future. Please choose a later time.');
        setIsSubmitting(false);
        return;
      }

      const finalGrade = formData.grade === "Other" ? formData.customGrade : formData.grade;
      let finalImageUrl = "";

      // 1. Upload the image if one is selected
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append("file", imageFile);
        const uploadRes = await apiClient.post('/auctions/upload-image', imageFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalImageUrl = uploadRes.data.image_url;
      }

      const payload = {
        auction_name: `${finalGrade} - ${formData.origin}`,
        seller_brand: formData.sellerBrand || "",
        company_name: formData.companyName,
        estate_name: formData.estateName,
        grade: finalGrade,
        quantity: parseFloat(formData.quantity),
        origin: formData.origin,
        description: formData.description,
        image_url: finalImageUrl || undefined,
        base_price: parseInt(formData.startingPrice),
        start_time: new Date(formData.scheduledStart).toISOString(),
        duration: parseFloat(formData.duration)
      };

      const response = await apiClient.post('/auctions', payload);
      toast.success(`Auction created successfully!`);
      router.push('/seller/dashboard'); 
    } catch (error: any) {
      console.error("Error submitting form:", error.response?.data || error);
      toast.error(error.response?.data?.detail || 'Error creating auction. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-12 relative max-w-2xl mx-auto">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-gray-200 z-0 rounded-full hidden md:block"></div>
      <div 
        className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 bg-gradient-to-r from-[#3A5A40] to-[#588157] z-0 rounded-full transition-all duration-700 hidden md:block" 
        style={{ width: `${((step - 1) / 2) * 100}%` }}
      ></div>
      
      {[
        { id: 1, icon: Home, label: "Estate Info" },
        { id: 2, icon: Package, label: "Tea Details" },
        { id: 3, icon: DollarSign, label: "Pricing & Times" },
      ].map((item) => {
        const isActive = step >= item.id;
        const isCurrent = step === item.id;
        return (
          <div key={item.id} className="relative z-10 flex flex-col items-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 shadow-md ${
              isActive ? 'bg-[#3A5A40] text-white ring-4 ring-[#E5F7CB]' : 'bg-white text-gray-400 border-2 border-gray-200'
            } ${isCurrent ? 'scale-110' : 'scale-100'}`}>
              <item.icon className="w-6 h-6" />
            </div>
            <span className={`mt-3 font-bold text-sm transition-colors duration-300 ${
              isActive ? 'text-[#3A5A40]' : 'text-gray-400'
            }`}>{item.label}</span>
          </div>
        )
      })}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 min-h-screen">
      <div className="text-center mb-10">
        <h1 className="text-[#1A2F1C] text-4xl md:text-5xl font-extrabold mb-3">Create Auction</h1>
        <p className="text-gray-500 font-medium text-lg">List your exquisite teas for global buyers.</p>
      </div>

      {renderStepIndicator()}

      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border-2 border-gray-50/50 relative overflow-hidden">
        {/* Subtle decorative background element */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#E5F7CB] rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#E5F7CB] rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="relative z-10">
          
          {/* STEP 1: ESTATE INFORMATION */}
          <div className={`transition-all duration-500 ease-in-out ${step === 1 ? 'opacity-100 translate-x-0 block' : 'opacity-0 translate-x-10 hidden'}`}>
            <h2 className="text-2xl font-bold text-gray-800 mb-8 border-b-2 border-gray-100 pb-4">Estate Information</h2>
            <div className="space-y-6">

              <div className="space-y-2">
                <label className="font-bold text-gray-700 ml-1">Upload Tea Image <span className="text-gray-400 font-normal text-sm ml-2">(Optional)</span></label>
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-40 md:h-64 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 relative overflow-hidden transition-all duration-300">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover transition-transform hover:scale-105" />
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                        <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-500">PNG, JPG or WEBP (MAX. 5MB)</p>
                      </div>
                    )}
                    <input 
                      id="dropzone-file" 
                      type="file" 
                      accept="image/*"
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setImageFile(file);
                          setImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-bold text-gray-700 ml-1">Company Name <span className="text-red-500">*</span></label>
                  <input 
                    required={step === 1}
                    type="text" 
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    className="w-full bg-gray-50/80 border-2 border-gray-200 rounded-xl p-4 text-gray-800 focus:bg-white focus:ring-4 focus:ring-[#E5F7CB] focus:border-[#3A5A40] transition-all outline-none shadow-sm" 
                    placeholder="e.g., Nuwara Eliya Plantations Ltd."
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="font-bold text-gray-700 ml-1">Estate Name <span className="text-red-500">*</span></label>
                  <input 
                    required={step === 1}
                    type="text" 
                    value={formData.estateName}
                    onChange={(e) => setFormData({...formData, estateName: e.target.value})}
                    className="w-full bg-gray-50/80 border-2 border-gray-200 rounded-xl p-4 text-gray-800 focus:bg-white focus:ring-4 focus:ring-[#E5F7CB] focus:border-[#3A5A40] transition-all outline-none shadow-sm" 
                    placeholder="e.g., Pedro Estate"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-gray-700 ml-1 flex items-center gap-2">
                  Seller Brand Name 
                  <span className="bg-gray-100 text-gray-500 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full">Optional</span>
                </label>
                <input 
                  type="text" 
                  value={formData.sellerBrand}
                  onChange={(e) => setFormData({...formData, sellerBrand: e.target.value})}
                  className="w-full bg-gray-50/80 border-2 border-gray-200 rounded-xl p-4 text-gray-800 focus:bg-white focus:ring-4 focus:ring-[#E5F7CB] focus:border-[#3A5A40] transition-all outline-none shadow-sm" 
                  placeholder="e.g., Lover's Leap Authentic (Leave blank to use default)"
                />
              </div>

            </div>
          </div>

          {/* STEP 2: TEA DETAILS */}
          <div className={`transition-all duration-500 ease-in-out ${step === 2 ? 'opacity-100 translate-x-0 block' : 'opacity-0 translate-x-10 hidden'}`}>
            <h2 className="text-2xl font-bold text-gray-800 mb-8 border-b-2 border-gray-100 pb-4">Tea Listing Details</h2>
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-bold text-gray-700 ml-1">Tea Grade <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      required={step === 2}
                      value={formData.grade}
                      onChange={(e) => setFormData({...formData, grade: e.target.value})}
                      className="w-full bg-gray-50/80 border-2 border-gray-200 rounded-xl p-4 pr-10 text-gray-800 focus:bg-white focus:ring-4 focus:ring-[#E5F7CB] focus:border-[#3A5A40] transition-all outline-none shadow-sm appearance-none"
                    >
                      <option value="" disabled>Select a grade</option>
                      {SRI_LANKAN_GRADES.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                      <option value="Other">Other (Type manually)</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>

                {formData.grade === "Other" && (
                  <div className="space-y-2 animate-fade-in">
                    <label className="font-bold text-gray-700 ml-1">Specify Grade <span className="text-red-500">*</span></label>
                    <input 
                      required={step === 2 && formData.grade === "Other"}
                      type="text" 
                      value={formData.customGrade}
                      onChange={(e) => setFormData({...formData, customGrade: e.target.value})}
                      className="w-full bg-yellow-50/50 border-2 border-yellow-200 rounded-xl p-4 text-gray-800 focus:bg-white focus:ring-4 focus:ring-yellow-100 focus:border-yellow-400 transition-all outline-none shadow-sm" 
                      placeholder="e.g., BOPF Sp"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="font-bold text-gray-700 ml-1">Origin Region <span className="text-red-500">*</span></label>
                  <input 
                    required={step === 2}
                    type="text" 
                    value={formData.origin}
                    onChange={(e) => setFormData({...formData, origin: e.target.value})}
                    className="w-full bg-gray-50/80 border-2 border-gray-200 rounded-xl p-4 text-gray-800 focus:bg-white focus:ring-4 focus:ring-[#E5F7CB] focus:border-[#3A5A40] transition-all outline-none shadow-sm" 
                    placeholder="e.g., Uva Region"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-gray-700 ml-1">Quantity (kg) <span className="text-red-500">*</span></label>
                <div className="flex shadow-sm rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-[#E5F7CB] focus-within:border-[#3A5A40] border-2 border-gray-200 bg-gray-50/80 transition-all">
                  <input 
                    required={step === 2}
                    type="number" 
                    min="1" step="0.1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="flex-1 bg-transparent p-4 text-gray-800 outline-none" 
                    placeholder="e.g., 50"
                  />
                  <div className="bg-gray-100 flex items-center justify-center px-6 border-l border-gray-200 font-bold text-gray-500">kg</div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-gray-700 ml-1">Lot Description</label>
                <textarea 
                  rows={4} 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-gray-50/80 border-2 border-gray-200 rounded-xl p-4 text-gray-800 focus:bg-white focus:ring-4 focus:ring-[#E5F7CB] focus:border-[#3A5A40] transition-all outline-none shadow-sm resize-none"
                  placeholder="Describe your tea's unique notes, altitude, manufacturing process..."
                ></textarea>
              </div>

            </div>
          </div>

          {/* STEP 3: PRICING & TIMING */}
          <div className={`transition-all duration-500 ease-in-out ${step === 3 ? 'opacity-100 translate-x-0 block' : 'opacity-0 translate-x-10 hidden'}`}>
            <h2 className="text-2xl font-bold text-gray-800 mb-8 border-b-2 border-gray-100 pb-4">Pricing & Timings</h2>
            <div className="space-y-6">
              
              <div className="bg-green-50/50 p-6 rounded-2xl border border-green-100 mb-8">
                <label className="font-bold border-b border-green-200 pb-2 text-green-800 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5"/> Base Starting Price <span className="text-red-500">*</span>
                </label>
                <div className="flex shadow-md rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-green-200 border-2 border-green-300 bg-white transition-all">
                  <div className="bg-green-600 text-white flex items-center justify-center px-6 font-bold text-lg tracking-wider">LKR</div>
                  <input 
                    required={step === 3}
                    type="number" 
                    min="0" step="1"
                    onKeyDown={(e) => { if (e.key === '.' || e.key === 'e' || e.key === '-') e.preventDefault(); }}
                    value={formData.startingPrice}
                    onChange={(e) => setFormData({...formData, startingPrice: e.target.value})}
                    className="flex-1 bg-transparent p-4 text-2xl font-bold text-gray-800 outline-none" 
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-bold text-gray-700 ml-1">Scheduled Start Time <span className="text-red-500">*</span></label>
                  <input 
                    required={step === 3}
                    type="datetime-local" 
                    min={minDateTime}
                    value={formData.scheduledStart}
                    onChange={(e) => setFormData({...formData, scheduledStart: e.target.value})}
                    className="w-full bg-gray-50/80 border-2 border-gray-200 rounded-xl p-4 text-gray-800 focus:bg-white focus:ring-4 focus:ring-[#E5F7CB] focus:border-[#3A5A40] transition-all outline-none shadow-sm" 
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="font-bold text-gray-700 ml-1">Duration (Hours) <span className="text-red-500">*</span></label>
                  <div className="flex shadow-sm rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-[#E5F7CB] focus-within:border-[#3A5A40] border-2 border-gray-200 bg-gray-50/80 transition-all">
                    <input 
                      required={step === 3}
                      type="number" 
                      min="1" step="1"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      className="flex-1 bg-transparent p-4 text-gray-800 outline-none" 
                      placeholder="e.g., 24"
                    />
                    <div className="bg-gray-100 flex items-center justify-center px-6 border-l border-gray-200 font-bold text-gray-500">HRS</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div className="pt-10 flex gap-4 mt-8 border-t-2 border-gray-50">
            {step > 1 && (
              <button 
                type="button" 
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-700 font-bold text-lg px-8 py-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
              >
                <ArrowLeft className="w-5 h-5" /> Back
              </button>
            )}
            
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`flex-1 flex justify-center items-center gap-2 bg-[#3A5A40] text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:bg-[#2D4A2B] ${isSubmitting ? 'opacity-70 cursor-wait' : 'hover:scale-[1.01]'}`}
            >
              {isSubmitting ? (
                <>Processing Request...</>
              ) : step < 3 ? (
                <>Next Step <ArrowRight className="w-5 h-5" /></>
              ) : (
                <>Publish Auction <CheckCircle2 className="w-6 h-6 ml-1" /></>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
