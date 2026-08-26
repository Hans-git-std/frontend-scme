import { apiClient } from './api';
import { useAuthStore } from './authStore';
import { ApiResponse, StudentProfileResponse } from '../types';

// In-flight initialization guard to avoid race conditions
let isInitializingProfile = false;

/**
 * Ensures that the authenticated student has a corresponding StudentProfile record in the backend database.
 * If the student already has a profile, it simply returns the profile without modifying anything.
 * If no profile exists (e.g. 404), it creates a baseline placeholder only once.
 */
export async function ensureStudentProfile(): Promise<StudentProfileResponse | null> {
  const { userEmail, role, isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated || role !== 'ROLE_STUDENT' || !userEmail) {
    return null;
  }

  if (isInitializingProfile) {
    return null;
  }

  try {
    const res = await apiClient.get<ApiResponse<StudentProfileResponse>>('/students/profile');
    if (res.data?.data) {
      return res.data.data;
    }
  } catch (err: any) {
    const status = err.response?.status;
    // Only attempt creation if explicitly 404 Not Found
    if (status === 404) {
      isInitializingProfile = true;
      try {
        const usernamePart = userEmail.split('@')[0];
        const formattedName = usernamePart
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())
          .trim() || 'Student Candidate';

        // Derive consistent uppercase roll number based on email hash
        let hash = 0;
        for (let i = 0; i < userEmail.length; i++) {
          hash = (hash << 5) - hash + userEmail.charCodeAt(i);
          hash |= 0;
        }
        const numericSuffix = Math.abs(hash) % 900000 + 100000;
        const autoRollNumber = `STU-${numericSuffix}`;

        const createRes = await apiClient.put<ApiResponse<StudentProfileResponse>>('/students/profile', {
          fullName: formattedName.length >= 2 ? formattedName : 'Student Candidate',
          rollNumber: autoRollNumber,
          gender: 'Prefer not to say',
          bio: 'University student exploring technical roles and placement opportunities.',
        });
        return createRes.data?.data || null;
      } catch (creationError) {
        console.warn('[StudentProfile] Auto-provision note:', creationError);
        return null;
      } finally {
        isInitializingProfile = false;
      }
    }
  }

  return null;
}
