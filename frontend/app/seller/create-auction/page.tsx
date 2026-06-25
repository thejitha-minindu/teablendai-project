"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; 
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'; 
import { apiClient } from '@/lib/apiClient';
import axios from 'axios';
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
  const [existingImageUrl, setExistingImageUrl] = useState<string>('');

  const [formData, setFormData] = useState({
    estateName: '',
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

  useEffect(() => {
    try {
      const relistStr = sessionStorage.getItem('relist_auction');
      if (relistStr) {
        const relistData = JSON.parse(relistStr);
        
        // Determine grade
        let gradeVal = relistData.grade || '';
        let customGradeVal = '';
        if (gradeVal && !SRI_LANKAN_GRADES.includes(gradeVal)) {
          customGradeVal = gradeVal;
          gradeVal = 'Other';
        }

        setFormData({
          estateName: relistData.estateName || '',
          grade: gradeVal,
          customGrade: customGradeVal,
          quantity: relistData.quantity || '',
          origin: relistData.origin || '',
          description: relistData.description || '',
          startingPrice: relistData.startingPrice || '',
          scheduledStart: '',
          duration: ''
        });

        if (relistData.image_url) {
          setImagePreview(relistData.image_url);
          setExistingImageUrl(relistData.image_url);
        }

        sessionStorage.removeItem('relist_auction');
      }
    } catch (e) {
      console.error("Failed to load relist data", e);
    }
  }, []);

  const handleNext = () => {
    if (step === 1) {
      if (!formData.estateName.trim()) {
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
        toast.error('Please select a scheduled start time.');
        setIsSubmitting(false);
        return;
      }

      const selected = new Date(formData.scheduledStart).getTime();
      const now = Date.now();
      // require at least 30 seconds in the future to account for small clock skew
      if (selected <= now + 30 * 1000) {
        toast.error('Scheduled start time must be in the future. Please choose a later time.');
        setIsSubmitting(false);
        return;
      }

      const finalGrade = formData.grade === "Other" ? formData.customGrade : formData.grade;
      let finalImageUrl = existingImageUrl;

      // 1. Upload the image if one is selected
      if (imageFile) {
        // Client-Side Pre-Upload Validation
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(imageFile.type)) {
          toast.error("Invalid file type. Only JPEG, PNG, and WEBP are allowed.");
          setIsSubmitting(false);
          return;
        }

        if (imageFile.size > 5 * 1024 * 1024) {
          toast.error("File size too large. Maximum allowed is 5MB.");
          setIsSubmitting(false);
          return;
        }

        // Fetch signature from backend
        const signatureRes = await apiClient.get('/auctions/cloudinary-signature');
        const { signature, timestamp, cloud_name, api_key } = signatureRes.data;

        // Upload directly to Cloudinary using standard axios (no auth headers injected)
        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`;
        const uploadData = new FormData();
        uploadData.append("file", imageFile);
        uploadData.append("api_key", api_key);
        uploadData.append("timestamp", timestamp.toString());
        uploadData.append("signature", signature);

        const uploadRes = await axios.post(cloudinaryUrl, uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalImageUrl = uploadRes.data.secure_url;
      }

      const payload = {
        auction_name: `${finalGrade} - ${formData.origin}`,
        estate_name: formData.estateName,
        grade: finalGrade,
        quantity: parseFloat(formData.quantity),
        origin: formData.origin,
        description: formData.description,
        image_url: finalImageUrl || undefined,
        base_price: parseInt(formData.startingPrice),
        start_time: new Date(formData.scheduledStart).toISOString(),
        duration: Math.round(parseFloat(formData.duration) * 60)
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

  const steps = [
    { id: 1, label: "Estate" },
    { id: 2, label: "Details" },
    { id: 3, label: "Pricing" },
  ];

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 mb-10">
      {/* Header */}
      <div className="mb-5 items-start">
        <h1 className="text-3xl font-bold">Create Auction</h1>
        <p className="text-muted-foreground mt-2">Set up a new tea lot listing for buyers.</p>
      </div>

      {/* Step indicator — simple numbered pills */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <React.Fragment key={s.id}>
            <button
              type="button"
              onClick={() => { if (s.id < step) setStep(s.id); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                step === s.id
                  ? 'bg-[#3A5A40] text-white hover:bg-[#2D4A2B]'
                  : step > s.id
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer'
                    : 'bg-gray-50 text-gray-400 cursor-default'
              }`}
            >
              <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold ${
                step === s.id ? 'bg-white text-[#3A5A40]' : step > s.id ? 'bg-gray-300 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                {step > s.id ? '✓' : s.id}
              </span>
              {s.label}
            </button>
            {i < steps.length - 1 && (
              <div className={`h-px flex-1 ${step > s.id ? 'bg-gray-300' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Form card */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200">
        <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
          
          {/* STEP 1: ESTATE INFORMATION */}
          <div className={step === 1 ? 'block' : 'hidden'}>
            <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-100">Estate Information</h2>
            <div className="space-y-5">

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Tea Image <span className="text-gray-400 font-normal">(optional)</span></label>
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-40 md:h-56 border border-gray-200 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 relative overflow-hidden transition-colors">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6">
                        <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                        <p className="text-sm text-gray-500"><span className="font-medium">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG or WEBP (max 5MB)</p>
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
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Estate Name <span className="text-red-500">*</span></label>
                <input 
                  required={step === 1}
                  type="text" 
                  value={formData.estateName}
                  onChange={(e) => setFormData({...formData, estateName: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all outline-none" 
                  placeholder="e.g., Pedro Estate"
                />
              </div>

            </div>
          </div>

          {/* STEP 2: TEA DETAILS */}
          <div className={step === 2 ? 'block' : 'hidden'}>
            <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-100">Tea Listing Details</h2>
            <div className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Tea Grade <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      required={step === 2}
                      value={formData.grade}
                      onChange={(e) => setFormData({...formData, grade: e.target.value})}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 text-gray-900 focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all outline-none appearance-none"
                    >
                      <option value="" disabled>Select a grade</option>
                      {SRI_LANKAN_GRADES.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                      <option value="Other">Other (type manually)</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>

                {formData.grade === "Other" && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Specify Grade <span className="text-red-500">*</span></label>
                    <input 
                      required={step === 2 && formData.grade === "Other"}
                      type="text" 
                      value={formData.customGrade}
                      onChange={(e) => setFormData({...formData, customGrade: e.target.value})}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all outline-none" 
                      placeholder="e.g., BOPF Sp"
                    />
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Origin Region <span className="text-red-500">*</span></label>
                  <input 
                    required={step === 2}
                    type="text" 
                    value={formData.origin}
                    onChange={(e) => setFormData({...formData, origin: e.target.value})}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all outline-none" 
                    placeholder="e.g., Uva Region"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Quantity (kg) <span className="text-red-500">*</span></label>
                <div className="flex rounded-xl overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-gray-200 focus-within:border-gray-400 transition-all">
                  <input 
                    required={step === 2}
                    type="number" 
                    min="1" step="0.1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="flex-1 bg-white px-4 py-3 text-gray-900 outline-none" 
                    placeholder="e.g., 50"
                  />
                  <div className="bg-gray-50 flex items-center px-4 border-l border-gray-200 text-sm font-medium text-gray-500">kg</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea 
                  rows={3} 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all outline-none resize-none"
                  placeholder="Brief notes about the tea lot..."
                ></textarea>
              </div>

            </div>
          </div>

          {/* STEP 3: PRICING & TIMING */}
          <div className={step === 3 ? 'block' : 'hidden'}>
            <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-100">Pricing & Schedule</h2>
            <div className="space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Base Starting Price <span className="text-red-500">*</span></label>
                <div className="flex rounded-xl overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-gray-200 focus-within:border-gray-400 transition-all">
                  <div className="bg-gray-50 flex items-center px-4 border-r border-gray-200 text-sm font-medium text-gray-500">LKR</div>
                  <input 
                    required={step === 3}
                    type="number" 
                    min="0" step="1"
                    onKeyDown={(e) => { if (e.key === '.' || e.key === 'e' || e.key === '-') e.preventDefault(); }}
                    value={formData.startingPrice}
                    onChange={(e) => setFormData({...formData, startingPrice: e.target.value})}
                    className="flex-1 bg-white px-4 py-3 text-lg font-semibold text-gray-900 outline-none" 
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Start Time <span className="text-red-500">*</span></label>
                  <input 
                    required={step === 3}
                    type="datetime-local" 
                    min={minDateTime}
                    value={formData.scheduledStart}
                    onChange={(e) => setFormData({...formData, scheduledStart: e.target.value})}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all outline-none" 
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Duration <span className="text-red-500">*</span></label>
                  <div className="flex rounded-xl overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-gray-200 focus-within:border-gray-400 transition-all">
                    <input 
                      required={step === 3}
                      type="number" 
                      min="1" step="1"
                      value={formData.duration}
                      onChange={(e) => setFormData({...formData, duration: e.target.value})}
                      className="flex-1 bg-white px-4 py-3 text-gray-900 outline-none" 
                      placeholder="e.g., 24"
                    />
                    <div className="bg-gray-50 flex items-center px-4 border-l border-gray-200 text-sm font-medium text-gray-500">hrs</div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Navigation buttons */}
          <div className="pt-6 flex gap-3 mt-6 border-t border-gray-100">
            {step > 1 && (
              <button 
                type="button" 
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`flex-1 flex justify-center items-center gap-2 font-medium px-6 py-3 rounded-xl transition-colors ${
                isSubmitting
                  ? 'bg-gray-400 text-white cursor-wait'
                  : 'bg-[#3A5A40] text-white hover:bg-[#2D4A2B]'
              }`}
            >
              {isSubmitting ? (
                <>Processing...</>
              ) : step < 3 ? (
                <>Continue <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>Publish Auction <CheckCircle2 className="w-4 h-4" /></>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
