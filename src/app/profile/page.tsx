"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithToken, uploadProfilePhoto } from "@/lib/api";
import {
  clearStoredAuth,
  getStoredAuth,
  StoredAuth,
} from "@/lib/auth";

// useRef to track if request is in flight (prevents double submit)
// More reliable than state because it's synchronous

type ProfileResponse = {
  id?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  nationality?: string;
  city?: string;
  countryOfResidence?: string;
  education?: string;
  occupation?: string;
  religiosityLevel?: string;
  religion?: string;
  maritalStatus?: string;
  marriageType?: string;
  polygamyAcceptance?: string;
  compatibilityTest?: string;
  about?: string;
  guardianName?: string;
  guardianContact?: string;
  photoUrl?: string;
  photoStorage?: "cloudinary" | "local";
  photoPublicId?: string | null;
  isVerified?: boolean;
};

// Payload type used when sending profile data to the backend.
// We keep it as a partial copy of the backend response shape so we can
// safely index fields and still benefit from TypeScript checking.
type ProfilePayload = Partial<ProfileResponse>;

type FieldConfig = {
  name: keyof ProfileResponse;
  label: string;
  type?: string;
};

// Required fields matching backend CreateProfileDto
const requiredFields: Set<keyof ProfileResponse> = new Set([
  "gender",
  "dateOfBirth",
  "city",
  "nationality",
  "maritalStatus",
  "education",
  "occupation",
  "religiosityLevel",
]);

const baseFields: FieldConfig[] = [
  { name: "firstName", label: "الاسم الأول" },
  { name: "lastName", label: "الاسم الأخير" },
  { name: "gender", label: "الجنس" },
  { name: "dateOfBirth", label: "تاريخ الميلاد", type: "date" },
  { name: "nationality", label: "الجنسية" },
  { name: "city", label: "المدينة" },
  { name: "countryOfResidence", label: "بلد الإقامة" },
  { name: "education", label: "المؤهل الدراسي" },
  { name: "occupation", label: "الوظيفة" },
  { name: "religion", label: "الديانة" },
  { name: "religiosityLevel", label: "درجة الالتزام" },
  { name: "maritalStatus", label: "الحالة الاجتماعية" },
  { name: "marriageType", label: "نوع الزواج" },
  { name: "polygamyAcceptance", label: "تقبل/تقبلين بالتعدد" },
  { name: "compatibilityTest", label: "إختبار التوافق" },
];
const femaleGuardianFields: FieldConfig[] = [
  { name: "guardianName", label: "اسم ولي الأمر" },
  { name: "guardianContact", label: "وسيلة تواصل ولي الأمر" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const [profile, setProfile] = useState<ProfileResponse>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoStatus, setPhotoStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  
  // Track if request is in flight to prevent double submit
  const isSubmittingRef = useRef(false);

  // Helper function to convert date to YYYY-MM-DD format for date input
  const formatDateForInput = (date: string | Date | undefined): string => {
    if (!date) return '';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return '';
      
      // Convert to YYYY-MM-DD format (required by HTML date input)
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  useEffect(() => {
    const stored = getStoredAuth();
    if (!stored) {
      router.push("/auth/login");
      return;
    }
    setAuth(stored);
    fetchWithToken<ProfileResponse | null>(
      `/profiles/me`,
      stored.token,
    )
      .then((data) => {
        console.log('Profile loaded from backend:', data);
        if (data) {
          // Convert dateOfBirth to YYYY-MM-DD format for date input
          // Initialize all profile fields to ensure they're always in state
          const formattedProfile: ProfileResponse = {
          // Initialize all fields with empty strings if not provided
          firstName: '',
          lastName: '',
          gender: '',
          nationality: '',
          city: '',
          countryOfResidence: '',
          education: '',
          occupation: '',
          religiosityLevel: '',
          religion: '',
          maritalStatus: '',
          marriageType: '',
          polygamyAcceptance: '',
          compatibilityTest: '',
          about: '',
          guardianName: '',
          guardianContact: '',
          // Override with data from backend
          ...data,
          // Format dateOfBirth for date input (set after spread to override)
          dateOfBirth: data.dateOfBirth ? formatDateForInput(data.dateOfBirth) : '',
          };
          console.log('Formatted profile for display:', formattedProfile);
          setProfile(formattedProfile);
          // Ensure profileId is stored in auth/localStorage for future fast access
          if (formattedProfile.id) {
            setAuth((prevAuth) => {
              if (!prevAuth) return prevAuth;
              if (prevAuth.user.profileId === formattedProfile.id) {
                return prevAuth;
              }
              const updatedAuth: StoredAuth = {
                ...prevAuth,
                user: {
                  ...prevAuth.user,
                  profileId: formattedProfile.id,
                },
              };
              if (typeof window !== "undefined") {
                window.localStorage.setItem(
                  "mawaddahUser",
                  JSON.stringify(updatedAuth.user),
                );
                window.dispatchEvent(new Event("storage"));
              }
              return updatedAuth;
            });
          }
        } else {
          // No profile exists yet - initialize all fields as empty
          console.log('No profile found for user');
          setProfile({
            firstName: '',
            lastName: '',
            gender: '',
            dateOfBirth: '',
            nationality: '',
            city: '',
            countryOfResidence: '',
            education: '',
            occupation: '',
            religiosityLevel: '',
            religion: '',
            maritalStatus: '',
            marriageType: '',
            polygamyAcceptance: '',
            compatibilityTest: '',
            about: '',
            guardianName: '',
            guardianContact: '',
          });
        }
      })
      .catch((err) => {
        console.error('Error loading profile:', err);
        console.error('Profile fetch error details:', err instanceof Error ? err.message : err);
        // On error, initialize all fields as empty
        setProfile({
          firstName: '',
          lastName: '',
          gender: '',
          dateOfBirth: '',
          nationality: '',
          city: '',
          countryOfResidence: '',
          education: '',
          occupation: '',
          religiosityLevel: '',
          religion: '',
          maritalStatus: '',
          marriageType: '',
          polygamyAcceptance: '',
          compatibilityTest: '',
          about: '',
          guardianName: '',
          guardianContact: '',
        });
      })
      .finally(() => setLoading(false));
  }, [router]);

  function handleChange(name: keyof ProfileResponse, value: string) {
    setProfile((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };
      if (name === "gender" && value !== "female") {
        delete next.guardianName;
        delete next.guardianContact;
      }
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    // GUARD 1: Prevent double submit - check ref first (synchronous)
    if (isSubmittingRef.current) {
      console.warn('Profile submission already in progress, ignoring duplicate request');
      return;
    }
    
    // GUARD 2: Prevent double submit - check state (backup check)
    if (saving) {
      console.warn('Profile submission already in progress (saving=true), ignoring duplicate request');
      return;
    }
    
    if (!auth) {
      router.push("/auth/login");
      return;
    }
    
    // Set submitting flag immediately (synchronous, prevents double execution)
    isSubmittingRef.current = true;
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    // Validate required fields (matching backend CreateProfileDto)
    const requiredFields = [
      { name: 'gender', label: 'الجنس' },
      { name: 'dateOfBirth', label: 'تاريخ الميلاد' },
      { name: 'city', label: 'المدينة' },
      { name: 'nationality', label: 'الجنسية' },
      { name: 'maritalStatus', label: 'الحالة الاجتماعية' },
      { name: 'education', label: 'المؤهل الدراسي' },
      { name: 'occupation', label: 'الوظيفة' },
      { name: 'religiosityLevel', label: 'درجة الالتزام' },
    ];

    const missingFields = requiredFields.filter(
      field => {
        const value = profile[field.name as keyof ProfileResponse];
        return !value || String(value).trim() === '';
      }
    );

    if (missingFields.length > 0) {
      const missingLabels = missingFields.map(f => f.label).join('، ');
      setError(`يجب ملء الحقول التالية (مطلوبة): ${missingLabels}`);
      setSuccess(null);
      isSubmittingRef.current = false; // Reset flag on validation error
      setSaving(false);
      return;
    }

    // Validate gender value (must be "male" or "female")
    if (profile.gender && profile.gender !== 'male' && profile.gender !== 'female') {
      setError('الجنس يجب أن يكون "male" أو "female" (ذكر أو أنثى)');
      setSuccess(null);
      isSubmittingRef.current = false; // Reset flag on validation error
      setSaving(false);
      return;
    }

    // Validate dateOfBirth format (must be valid ISO date string)
    if (profile.dateOfBirth) {
      const dateValue = new Date(profile.dateOfBirth);
      if (isNaN(dateValue.getTime())) {
        setError('تاريخ الميلاد غير صحيح. يرجى إدخال تاريخ صحيح');
        setSuccess(null);
        isSubmittingRef.current = false; // Reset flag on validation error
        setSaving(false);
        return;
      }
      // Ensure it's in ISO format (YYYY-MM-DD)
      const isoDate = dateValue.toISOString().split('T')[0];
      profile.dateOfBirth = isoDate;
    }

    // Validate about field if provided (min 2 characters)
    if (profile.about && profile.about.trim().length < 2) {
      setError('النبذة التعريفية يجب أن تكون على الأقل حرفين');
      setSuccess(null);
      isSubmittingRef.current = false; // Reset flag on validation error
      setSaving(false);
      return;
    }
    
    try {
      // Determine if profile exists - check if we have an id in state
      // Don't fetch existing profile during submit to avoid overwriting user's current input
      const profileExists = !!profile.id;
      
      // Use current profile state directly (has all user's latest form input)
      // Don't modify profile state during submit to preserve user input
      const currentFormState = { ...profile };
      
      let updated: ProfileResponse;
      
      if (profileExists) {
        // Update existing profile - send all fields from CURRENT form state (profile, not currentProfile)
        // Use the current profile state which has all the latest form values
        const payload: Record<string, string> = {};
        
        // List of all profile fields that should be sent
        const profileFields: (keyof ProfileResponse)[] = [
          'firstName', 'lastName', 'gender', 'dateOfBirth', 'nationality', 
          'city', 'countryOfResidence', 'education', 'occupation', 
          'religiosityLevel', 'religion', 'maritalStatus', 'marriageType', 
          'polygamyAcceptance', 'compatibilityTest', 'about', 
          'guardianName', 'guardianContact'
        ];
        
        // Send ALL profile fields from current form state (has latest form values)
        // CRITICAL: Always include ALL fields to ensure nothing is missed
        profileFields.forEach((fieldName) => {
          // Use currentFormState which is a snapshot of profile at submit time
          const value = currentFormState[fieldName];
          
          // ALWAYS include every field - never skip any field
          if (value === undefined || value === null) {
            // If undefined/null, send empty string
            payload[fieldName as string] = "";
          } else if (typeof value === "string") {
            // For strings, always include (even if empty after trim)
            const trimmed = value.trim();
            payload[fieldName as string] = trimmed;
          } else {
            // For non-strings (numbers, booleans, etc.), send as string
            payload[fieldName as string] = String(value);
          }
        });
        
        // Don't include internal fields like id, user, photoUrl, etc. in update payload
        // These are managed by the backend
        
        console.log('Updating profile - current form state:', currentFormState);
        console.log('Updating profile with payload:', payload);
        console.log('Payload keys count:', Object.keys(payload).length);
        console.log('Payload keys:', Object.keys(payload));
        console.log('Fields with values:', profileFields.filter(f => {
          const val = currentFormState[f];
          return val !== undefined && val !== null && (typeof val !== 'string' || val.trim().length > 0);
        }));
        
        updated = await fetchWithToken<ProfileResponse>(
          `/profiles/${auth.user.id}`,
          auth.token,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        );
        setSuccess("تم تحديث البيانات بنجاح.");
      } else {
        // Create new profile - only send required fields + optional 'about' (CreateProfileDto)
        // Backend has whitelist: true, forbidNonWhitelisted: true, so we can only send allowed fields
        const createPayload: ProfilePayload = {
          gender: currentFormState.gender?.trim(),
          dateOfBirth: currentFormState.dateOfBirth?.trim(),
          city: currentFormState.city?.trim(),
          nationality: currentFormState.nationality?.trim(),
          maritalStatus: currentFormState.maritalStatus?.trim(),
          education: currentFormState.education?.trim(),
          occupation: currentFormState.occupation?.trim(),
          religiosityLevel: currentFormState.religiosityLevel?.trim(),
        };
        
        // Add optional 'about' field if provided
        if (currentFormState.about && currentFormState.about.trim().length >= 2) {
          createPayload.about = currentFormState.about.trim();
        }
        
        console.log('Creating new profile with payload:', createPayload);
        updated = await fetchWithToken<ProfileResponse>(
          `/profiles`,
          auth.token,
          {
            method: "POST",
            body: JSON.stringify(createPayload),
          },
        );
        console.log('Profile created successfully:', updated);
        setSuccess("تم إنشاء الملف الشخصي بنجاح.");
        
        // After creating profile, if there are optional fields filled, update them with PATCH
        const optionalFields = ['firstName', 'lastName', 'countryOfResidence', 'religion', 
          'marriageType', 'polygamyAcceptance', 'compatibilityTest', 'guardianName', 'guardianContact'];
        const hasOptionalFields = optionalFields.some(field => currentFormState[field as keyof ProfileResponse] && 
          String(currentFormState[field as keyof ProfileResponse]).trim().length > 0);
        
        // Also check if 'about' field has valid content (min 2 chars) and wasn't included in create
        const hasAbout = currentFormState.about && currentFormState.about.trim().length >= 2;
        
        if (hasOptionalFields || hasAbout) {
          // Update with optional fields
          const updatePayload: Record<string, string> = {};
          
          // Include all optional fields that have values
          Object.entries(currentFormState).forEach(([key, value]) => {
            // Include all fields that are not required in CreateProfileDto
            if (key !== 'gender' && key !== 'dateOfBirth' && key !== 'city' && 
                key !== 'nationality' && key !== 'maritalStatus' && key !== 'education' && 
                key !== 'occupation' && key !== 'religiosityLevel' && key !== 'id' && key !== 'user') {
              if (value !== null && value !== undefined && value !== '') {
                if (typeof value === 'string') {
                  const trimmed = value.trim();
                  // For 'about', require min 2 chars; for others, any non-empty string
                  if (key === 'about') {
                    if (trimmed.length >= 2) {
                      updatePayload[key] = trimmed;
                    }
                  } else if (trimmed.length > 0) {
                    updatePayload[key] = trimmed;
                  }
                } else {
                  updatePayload[key] = String(value);
                }
              }
            }
          });
          
          if (Object.keys(updatePayload).length > 0) {
            console.log('Updating profile with optional fields:', updatePayload);
            // Update with optional fields - use the created profile's data to ensure we have the id
            const patchResult = await fetchWithToken<ProfileResponse>(
              `/profiles/${auth.user.id}`,
              auth.token,
              {
                method: "PATCH",
                body: JSON.stringify(updatePayload),
              },
            );
            console.log('Profile updated with optional fields:', patchResult);
            // Merge the update result with the created profile
            updated = { ...updated, ...patchResult };
            setSuccess("تم حفظ جميع البيانات بنجاح.");
          }
        }
      }
      
      // Format dateOfBirth for date input after saving
      // Also ensure all fields are preserved (merge with current form state to keep user's input)
      if (updated) {
        console.log('Profile after save:', updated);
        // Initialize all fields to ensure they're always in state
        const formattedProfile: ProfileResponse = {
          // Initialize all fields with empty strings
          firstName: '',
          lastName: '',
          gender: '',
          nationality: '',
          city: '',
          countryOfResidence: '',
          education: '',
          occupation: '',
          religiosityLevel: '',
          religion: '',
          maritalStatus: '',
          marriageType: '',
          polygamyAcceptance: '',
          compatibilityTest: '',
          about: '',
          guardianName: '',
          guardianContact: '',
          // Override with current form state (preserves user's input that might not be in server response)
          ...currentFormState,
          // Overwrite with server response (ensures id and server values are set)
          ...updated,
          // Format dateOfBirth for date input (set after spread to override)
          dateOfBirth: updated.dateOfBirth ? formatDateForInput(updated.dateOfBirth) : (currentFormState.dateOfBirth || ''),
          // CRITICAL: Ensure id is set so future saves use PATCH instead of POST
          id: updated.id || currentFormState.id,
        };
        console.log('Setting profile state with:', formattedProfile);
        setProfile(formattedProfile);
        // After a successful save, persist profileId in auth/localStorage
        if (formattedProfile.id) {
          setAuth((prevAuth) => {
            if (!prevAuth) return prevAuth;
            if (prevAuth.user.profileId === formattedProfile.id) {
              return prevAuth;
            }
            const updatedAuth: StoredAuth = {
              ...prevAuth,
              user: {
                ...prevAuth.user,
                profileId: formattedProfile.id,
              },
            };
            if (typeof window !== "undefined") {
              window.localStorage.setItem(
                "mawaddahUser",
                JSON.stringify(updatedAuth.user),
              );
              window.dispatchEvent(new Event("storage"));
            }
            return updatedAuth;
          });
        }
      } else {
        // If update failed but we have existing profile, keep it
        console.warn('Profile update returned null, keeping existing profile state');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
      
      // Handle common backend errors
      // If profile already exists, treat it as success (duplicate request was handled)
      if (errorMessage.includes("already exists") || errorMessage.includes("409")) {
        // This might be a duplicate request, check if profile exists now
        try {
          const existingProfile = await fetchWithToken<ProfileResponse>(
            `/profiles/${auth.user.id}`,
            auth.token,
          );
          if (existingProfile) {
            // Format dateOfBirth for date input and initialize all fields
            const formattedProfile: ProfileResponse = {
            // Initialize all fields
            firstName: '',
            lastName: '',
            gender: '',
            nationality: '',
            city: '',
            countryOfResidence: '',
            education: '',
            occupation: '',
            religiosityLevel: '',
            religion: '',
            maritalStatus: '',
            marriageType: '',
            polygamyAcceptance: '',
            compatibilityTest: '',
            about: '',
            guardianName: '',
            guardianContact: '',
            // Override with existing profile data
            ...existingProfile,
            // Format dateOfBirth for date input (set after spread to override)
            dateOfBirth: existingProfile.dateOfBirth ? formatDateForInput(existingProfile.dateOfBirth) : '',
            };
            setProfile(formattedProfile);
            setSuccess("تم حفظ البيانات بنجاح.");
          } else {
            setError("حدث خطأ. يرجى تحديث الصفحة والمحاولة مرة أخرى.");
          }
        } catch {
          setError("الملف الشخصي موجود بالفعل. يرجى تحديث الصفحة.");
        }
      } else if (errorMessage.includes("required") || errorMessage.includes("مطلوب")) {
        setError(errorMessage);
      } else if (errorMessage.includes("gender must be")) {
        setError('الجنس يجب أن يكون "male" أو "female"');
      } else if (errorMessage.includes("dateOfBirth")) {
        setError('تاريخ الميلاد يجب أن يكون بصيغة ISO صحيحة (YYYY-MM-DD)');
      } else {
        setError(`خطأ في الحفظ: ${errorMessage}`);
      }
    } finally {
      // Always reset flags in finally block
      isSubmittingRef.current = false;
      setSaving(false);
    }
  }

  const quickLinks = useMemo(
    () => [
      { href: "/", label: "الرئيسية" },
      { href: "/search", label: "ابحث عن شريك" },
      { href: "/matches", label: "طلبات التوافق" },
      { href: "/consultations", label: "جلسات الرؤية" },
      { href: "/favorites", label: "قائمة المفضلة" },
    ],
    [],
  );

  const scrollToRef = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const actionButtons = [
    {
      label: "تحديث بياناتي",
      description: "حدّث معلوماتك الشخصية الأساسية.",
      onClick: () => scrollToRef(formRef as React.RefObject<HTMLElement>),
    },
    {
      label: "رفع صورة شخصية",
      description: "أضف صورة واضحة لملفك لزيادة فرص التوافق.",
      onClick: () => {
        scrollToRef(formRef as React.RefObject<HTMLElement>);
        setTimeout(() => photoInputRef.current?.click(), 350);
      },
    },
    {
      label: "إعدادات الحساب",
      description: "إدارة كلمة المرور وتفضيلات الإشعارات.",
      onClick: () => scrollToRef(settingsRef as React.RefObject<HTMLElement>),
    },
  ];

  const resolvedPhotoUrl = useMemo(() => {
    if (!profile.photoUrl) return null;
    if (/^https?:\/\//i.test(profile.photoUrl)) {
      return profile.photoUrl;
    }
    const base = (process.env.NEXT_PUBLIC_API ?? "").replace(/\/$/, "");
    const path = profile.photoUrl.startsWith("/")
      ? profile.photoUrl
      : `/${profile.photoUrl}`;
    return `${base}${path}`;
  }, [profile.photoUrl]);

  if (!auth) return null;

  const displayName =
    profile.firstName || profile.lastName
      ? `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim()
      : auth.user.email ?? "عضو مَوَدّة";

  const isFemale = profile.gender === "female";
  const renderedFields = isFemale
    ? [...baseFields, ...femaleGuardianFields]
    : baseFields;

  async function handlePhotoSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !auth) {
      return;
    }

    if (!/^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.type)) {
      setPhotoStatus({
        type: "error",
        message: "يجب أن تكون الصورة بصيغة JPG أو PNG أو GIF أو WebP.",
      });
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoStatus({
        type: "error",
        message: "حجم الصورة يجب ألا يتجاوز 5 ميجابايت.",
      });
      event.target.value = "";
      return;
    }

    setPhotoStatus(null);
    setPhotoUploading(true);

    try {
      const updated = await uploadProfilePhoto<ProfileResponse>(
        auth.token,
        auth.user.id,
        file,
      );
      if (updated) {
        // Format dateOfBirth for date input when photo is updated
        // Preserve all existing profile fields and merge with updated photo data
        const formattedProfile: ProfileResponse = {
          // Initialize all fields
          firstName: '',
          lastName: '',
          gender: '',
          nationality: '',
          city: '',
          countryOfResidence: '',
          education: '',
          occupation: '',
          religiosityLevel: '',
          religion: '',
          maritalStatus: '',
          marriageType: '',
          polygamyAcceptance: '',
          compatibilityTest: '',
          about: '',
          guardianName: '',
          guardianContact: '',
          // Preserve current profile state (all form fields)
          ...profile,
          // Override with updated photo data from server
          ...updated,
          // Format dateOfBirth for date input (set after spread to override)
          dateOfBirth: updated.dateOfBirth ? formatDateForInput(updated.dateOfBirth) : (profile.dateOfBirth || ''),
        };
        setProfile(formattedProfile);
      }
      setPhotoStatus({
        type: "success",
        message: "تم تحديث صورتك الشخصية بنجاح.",
      });
    } catch (err) {
      setPhotoStatus({
        type: "error",
        message:
          err instanceof Error ? err.message : "تعذر رفع الصورة، حاول مجدداً.",
      });
    } finally {
      setPhotoUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* === Sticky Header === */}
      <header className="sticky top-0 z-50 border-b border-rose-100 bg-white/95 backdrop-blur">
        <div className="section-container flex flex-wrap items-center justify-between gap-4 py-4">
          {/* Left: Logo & Navigation */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              prefetch={false}
              className="flex items-center gap-3 text-xl font-bold text-secondary-700"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-secondary-500 text-white font-display">
                م
              </span>
              <span className="leading-tight">
                مَوَدَّة
                <span className="block text-xs font-normal text-slate-500">
                  منصة زواج آمنة
                </span>
              </span>
            </Link>

            {/* Navigation Links */}
            <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={false}
                  className="rounded-full border border-transparent px-3 py-1.5 transition hover:border-secondary-200 hover:text-secondary-600"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Logout Button */}
          <button
            type="button"
            onClick={() => {
              clearStoredAuth();
              if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("storage"));
              }
              router.push("/");
            }}
            className="rounded-full bg-gradient-to-r from-rose-500 to-secondary-500 px-6 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
          >
            تسجيل الخروج
          </button>
        </div>
      </header>

      {/* === Hero Section === */}
      <section className="relative overflow-hidden bg-gradient-to-b from-secondary-600 via-secondary-500 to-rose-400 pb-16 pt-12 text-white">
        <div className="section-container relative z-10 space-y-8">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm text-white/80">مرحباً بك في مَوَدَّة</p>
            <h1 className="text-3xl font-bold">
              أهلاً بك، {displayName || "عضونا العزيز"}
            </h1>
            {auth.user.memberId && (
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium">
                <span>🆔</span>
                <span>رقم العضوية: {auth.user.memberId}</span>
              </div>
            )}
            <p className="text-sm leading-7 text-white/75">
              يمكنك إدارة ملفك الشخصي، تعديل بياناتك، ورفع صورتك الشخصية
              بسهولة داخل المنصة.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {actionButtons.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className="flex flex-col gap-2 rounded-2xl bg-white/15 px-6 py-5 text-right shadow-lg transition hover:bg-white/25"
              >
                <span className="text-sm font-semibold text-white">
                  {action.label}
                </span>
                <span className="text-xs leading-6 text-white/80">
                  {action.description}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="absolute inset-0 bg-[url('/patterns/hero-shape.svg')] bg-cover bg-center opacity-10" />
      </section>

      {/* === Profile Form === */}
      <div className="section-container -mt-12 space-y-8">
        <div className="rounded-3xl border border-white/60 bg-white p-6 shadow-xl md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-6">
            <div>
              <h2 className="text-xl font-semibold text-secondary-700">
                بيانات حسابك الشخصية
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                قم بتحديث معلوماتك لزيادة دقة نتائج التوافق.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center text-sm text-slate-600">
              جاري تحميل البيانات...
            </div>
          ) : (
            <form 
              ref={formRef} 
              onSubmit={handleSubmit} 
              className="mt-8 space-y-8"
              noValidate
            >
              {/* Required Fields Notice */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <p className="font-medium mb-1">ملاحظة:</p>
                <p>الحقول المميزة بعلامة <span className="text-rose-600 font-bold">*</span> مطلوبة ولا يمكن تركها فارغة. يجب ملء جميع الحقول المطلوبة لإنشاء أو تحديث الملف الشخصي.</p>
              </div>

              <section className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="relative h-32 w-32 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                  {resolvedPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolvedPhotoUrl}
                      alt="الصورة الشخصية"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-200 text-sm text-slate-500">
                      لا توجد صورة
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={photoUploading}
                      className="rounded-full bg-secondary-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-secondary-500 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {photoUploading ? "جاري الرفع..." : "اختيار صورة جديدة"}
                    </button>
                    <span className="text-xs text-slate-500">
                      الصيغ المدعومة: ‎JPG، PNG، WebP حتى 5 ميجابايت.
                    </span>
                  </div>
                  {photoStatus ? (
                    <p
                      className={`text-xs ${
                        photoStatus.type === "success"
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {photoStatus.message}
                    </p>
                  ) : null}
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={handlePhotoSelected}
                  />
                </div>
              </section>

              <div className="grid gap-6 md:grid-cols-2">
                {renderedFields.map((field) => {
                  const fieldValue = profile[field.name] ? String(profile[field.name]) : "";
                  const isRequired = requiredFields.has(field.name);
                  
                  // Handle select fields
                  if (field.name === "gender") {
                    return (
                      <label
                        key={field.name}
                        className="flex flex-col gap-2 text-sm text-slate-600"
                      >
                        <span className="flex items-center gap-1">
                          {field.label}
                          {isRequired && <span className="text-rose-500">*</span>}
                        </span>
                        <select
                          value={fieldValue}
                          onChange={(event) =>
                            handleChange(field.name, event.target.value)
                          }
                          className={`rounded-xl border ${
                            isRequired && !fieldValue
                              ? 'border-rose-300 bg-rose-50'
                              : 'border-slate-200 bg-slate-50'
                          } px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100`}
                          required={isRequired}
                        >
                          <option value="">اختر الجنس</option>
                          <option value="male">ذكر</option>
                          <option value="female">أنثى</option>
                        </select>
                      </label>
                    );
                  }
                  
                  if (field.name === "religion") {
                    return (
                      <label
                        key={field.name}
                        className="flex flex-col gap-2 text-sm text-slate-600"
                      >
                        <span className="flex items-center gap-1">
                          {field.label}
                          {isRequired && <span className="text-rose-500">*</span>}
                        </span>
                        <select
                          value={fieldValue}
                          onChange={(event) =>
                            handleChange(field.name, event.target.value)
                          }
                          className={`rounded-xl border ${
                            isRequired && !fieldValue
                              ? 'border-rose-300 bg-rose-50'
                              : 'border-slate-200 bg-slate-50'
                          } px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100`}
                          required={isRequired}
                        >
                          <option value="">اختر الديانة</option>
                          <option value="الإسلام">الإسلام</option>
                          <option value="المسيحية">المسيحية</option>
                          <option value="أخرى">أخرى</option>
                        </select>
                      </label>
                    );
                  }
                  
                  if (field.name === "marriageType") {
                    return (
                      <label
                        key={field.name}
                        className="flex flex-col gap-2 text-sm text-slate-600"
                      >
                        {field.label}
                        <select
                          value={fieldValue}
                          onChange={(event) =>
                            handleChange(field.name, event.target.value)
                          }
                          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
                        >
                          <option value="">اختر نوع الزواج</option>
                          <option value="زواج تقليدي">زواج تقليدي</option>
                          <option value="زواج بشروط خاصة">زواج بشروط خاصة</option>
                        </select>
                      </label>
                    );
                  }
                  
                  if (field.name === "polygamyAcceptance") {
                    return (
                      <label
                        key={field.name}
                        className="flex flex-col gap-2 text-sm text-slate-600"
                      >
                        {field.label}
                        <select
                          value={fieldValue}
                          onChange={(event) =>
                            handleChange(field.name, event.target.value)
                          }
                          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
                        >
                          <option value="">اختر</option>
                          <option value="اقبل بالتعدد">اقبل بالتعدد</option>
                          <option value="لا اقبل بالتعدد">لا اقبل بالتعدد</option>
                        </select>
                      </label>
                    );
                  }
                  
                  if (field.name === "compatibilityTest") {
                    return (
                      <label
                        key={field.name}
                        className="flex flex-col gap-2 text-sm text-slate-600"
                      >
                        {field.label}
                        <select
                          value={fieldValue}
                          onChange={(event) =>
                            handleChange(field.name, event.target.value)
                          }
                          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
                        >
                          <option value="">اختر</option>
                          <option value="نعم">نعم</option>
                          <option value="لا">لا</option>
                        </select>
                      </label>
                    );
                  }
                  
                  if (field.name === "maritalStatus") {
                    return (
                      <label
                        key={field.name}
                        className="flex flex-col gap-2 text-sm text-slate-600"
                      >
                        <span className="flex items-center gap-1">
                          {field.label}
                          {isRequired && <span className="text-rose-500">*</span>}
                        </span>
                        <select
                          value={fieldValue}
                          onChange={(event) =>
                            handleChange(field.name, event.target.value)
                          }
                          className={`rounded-xl border ${
                            isRequired && !fieldValue
                              ? 'border-rose-300 bg-rose-50'
                              : 'border-slate-200 bg-slate-50'
                          } px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100`}
                          required={isRequired}
                        >
                          <option value="">اختر الحالة الاجتماعية</option>
                          <option value="أعزب">أعزب</option>
                          <option value="مطلق - بدون أولاد">مطلق - بدون أولاد</option>
                          <option value="مطلق - مع أولاد">مطلق - مع أولاد</option>
                          <option value="منفصل بدون طلاق">منفصل بدون طلاق</option>
                          <option value="أرمل - بدون أولاد">أرمل - بدون أولاد</option>
                          <option value="أرمل - مع أولاد">أرمل - مع أولاد</option>
                        </select>
                      </label>
                    );
                  }
                  
                  // Default input field
                  return (
                    <label
                      key={field.name}
                      className="flex flex-col gap-2 text-sm text-slate-600"
                    >
                      <span className="flex items-center gap-1">
                        {field.label}
                        {isRequired && <span className="text-rose-500">*</span>}
                      </span>
                      <input
                        type={field.type ?? "text"}
                        value={fieldValue}
                        onChange={(event) =>
                          handleChange(field.name, event.target.value)
                        }
                        className={`rounded-xl border ${
                          isRequired && !fieldValue
                            ? 'border-rose-300 bg-rose-50'
                            : 'border-slate-200 bg-slate-50'
                        } px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100`}
                        required={isRequired}
                      />
                    </label>
                  );
                })}
              </div>

              {/* About Section */}
              <label className="flex flex-col gap-2 text-sm text-slate-600">
                نبذة تعريفية
                <textarea
                  rows={4}
                  value={profile.about ?? ""}
                  onChange={(event) =>
                    handleChange("about", event.target.value)
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-100"
                />
              </label>

              {/* Alerts */}
              {error && (
                <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {error}
                </p>
              )}
              {success && (
                <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
                  {success}
                </p>
              )}

              {/* Submit */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-secondary-600 px-8 py-3 text-sm font-medium text-white transition-all hover:bg-secondary-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
                </button>
              </div>
            </form>
          )}
        </div>

        <div
          ref={settingsRef}
          className="rounded-3xl border border-white/60 bg-white p-6 shadow-xl md:p-8"
        >
          <h2 className="text-lg font-semibold text-secondary-700">إعدادات الحساب</h2>
          <p className="mt-2 text-sm text-slate-600">
            يمكنك من هنا إدارة كلمة المرور وتفضيلات الإشعارات وطرق التواصل.
            سنضيف المزيد من الخيارات قريباً.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
            <Link
              href="/settings/password"
              prefetch={false}
              className="rounded-full border border-slate-200 px-4 py-2 transition-colors hover:bg-slate-50"
            >
              تغيير كلمة المرور
            </Link>
            <Link
              href="/settings/notifications"
              prefetch={false}
              className="rounded-full border border-slate-200 px-4 py-2 transition-colors hover:bg-slate-50"
            >
              تفضيلات الإشعارات
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
