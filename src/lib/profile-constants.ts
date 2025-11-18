/**
 * Unified Profile and Search Constants
 * 
 * This file contains all selectable values for profiles and search filters.
 * Both profile creation/editing and search filters MUST use these exact same values
 * to ensure 100% consistency and matching.
 */

// ============================================================================
// GENDERS
// ============================================================================
export const GENDERS = ['male', 'female'] as const;
export type Gender = (typeof GENDERS)[number];

// ============================================================================
// RELIGIONS
// ============================================================================
export const RELIGIONS = ['الإسلام', 'المسيحية', 'أخرى'] as const;
export type Religion = (typeof RELIGIONS)[number];

// ============================================================================
// EDUCATION LEVELS
// ============================================================================
export const EDUCATION_LEVELS = [
  'غير متعلم',
  'ابتدائي',
  'متوسط',
  'ثانوي',
  'دبلوم',
  'بكالوريوس',
  'ماجستير',
  'دكتوراه',
] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

// ============================================================================
// OCCUPATIONS
// ============================================================================
export const OCCUPATIONS = [
  'طبيب',
  'ممرضة',
  'مهندس',
  'معلم',
  'مهندس برمجيات',
  'محاسب',
  'محامي',
  'مهندس مدني',
  'مهندس معماري',
  'مهندس كهرباء',
  'محاضر جامعي',
  'مدير مشاريع',
  'رائد أعمال',
  'ربة منزل',
  'طالب',
  'موظف حكومي',
  'موظف قطاع خاص',
  'أعمال حرة',
  'أخرى',
] as const;
export type Occupation = (typeof OCCUPATIONS)[number];

// ============================================================================
// MARITAL STATUSES - Gender Specific
// ============================================================================
// Female-specific marital statuses (shown to male users searching for females)
export const FEMALE_MARITAL_STATUSES = [
  'عزباء',
  'مطلقة',
  'أرملة',
  'مطلق - بدون أولاد',
  'مطلق - مع أولاد',
  'منفصل بدون طلاق',
  'أرمل - بدون أولاد',
  'أرمل - مع أولاد',
] as const;

// Male-specific marital statuses (shown to female users searching for males)
export const MALE_MARITAL_STATUSES = [
  'أعزب',
  'مطلق',
  'أرمل',
  'مطلق - بدون أولاد',
  'مطلق - مع أولاد',
  'منفصل بدون طلاق',
  'أرمل - بدون أولاد',
  'أرمل - مع أولاد',
] as const;

// All marital statuses (for profile creation - user selects their own status)
export const ALL_MARITAL_STATUSES = [
  'عزباء',
  'أعزب',
  'مطلقة',
  'مطلق',
  'أرملة',
  'أرمل',
  'مطلق - بدون أولاد',
  'مطلق - مع أولاد',
  'منفصل بدون طلاق',
  'أرمل - بدون أولاد',
  'أرمل - مع أولاد',
] as const;

export type MaritalStatus = (typeof ALL_MARITAL_STATUSES)[number];

// ============================================================================
// RELIGIOSITY LEVELS
// ============================================================================
export const RELIGIOSITY_LEVELS = [
  'منخفض',
  'متوسط',
  'ملتزم',
  'ملتزم جدا',
] as const;
export type ReligiosityLevel = (typeof RELIGIOSITY_LEVELS)[number];

// ============================================================================
// MARRIAGE TYPES
// ============================================================================
export const MARRIAGE_TYPES = [
  'زواج تقليدي',
  'زواج بشروط خاصة',
] as const;
export type MarriageType = (typeof MARRIAGE_TYPES)[number];

// ============================================================================
// POLYGAMY ACCEPTANCE
// ============================================================================
export const POLYGAMY_OPTIONS = [
  'اقبل بالتعدد',
  'لا اقبل بالتعدد',
  'حسب الظروف',
] as const;
export type PolygamyOption = (typeof POLYGAMY_OPTIONS)[number];

// ============================================================================
// COMPATIBILITY TEST
// ============================================================================
export const COMPATIBILITY_OPTIONS = ['نعم', 'لا'] as const;
export type CompatibilityOption = (typeof COMPATIBILITY_OPTIONS)[number];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get gender-appropriate marital statuses for search filters
 * @param userGender - The logged-in user's gender ('male' | 'female')
 * @returns Array of marital statuses appropriate for the search target gender
 */
export function getMaritalStatusesForSearch(userGender: Gender | string | undefined): readonly string[] {
  if (userGender === 'male') {
    // Male user searches for females → show female statuses
    return FEMALE_MARITAL_STATUSES;
  } else if (userGender === 'female') {
    // Female user searches for males → show male statuses
    return MALE_MARITAL_STATUSES;
  }
  // If gender not loaded yet, return empty array
  return [];
}

/**
 * Get target gender for search based on logged-in user's gender
 * @param userGender - The logged-in user's gender
 * @returns The target gender to search for
 */
export function getSearchTargetGender(userGender: Gender | string | undefined): Gender | null {
  if (userGender === 'male') {
    return 'female';
  } else if (userGender === 'female') {
    return 'male';
  }
  return null;
}


