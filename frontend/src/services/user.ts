import { apiClient } from "./api";

export interface UserPreferences {
  canvas?: {
    showMinimap?: boolean;
    showBackground?: boolean;
    showControls?: boolean;
    backgroundVariant?: "dots" | "lines" | "cross";
    panOnDrag?: boolean;
    zoomOnScroll?: boolean;
    canvasBoundaryX?: number;
    canvasBoundaryY?: number;
  };
  theme?: "light" | "dark" | "system";
  // Future: language, etc.
}

export class UserService {
  /**
   * Get current user's preferences
   */
  async getPreferences(): Promise<UserPreferences> {
    const response = await apiClient.get<{ preferences: UserPreferences }>(
      "/users/preferences"
    );
    return response.data?.preferences || {};
  }

  /**
   * Update current user's preferences (replace all)
   */
  async updatePreferences(
    preferences: UserPreferences
  ): Promise<UserPreferences> {
    const response = await apiClient.put<{ preferences: UserPreferences }>(
      "/users/preferences",
      {
        preferences,
      }
    );
    return response.data?.preferences || {};
  }

  /**
   * Partially update user's preferences (merge with existing)
   */
  async patchPreferences(
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    const response = await apiClient.patch<{ preferences: UserPreferences }>(
      "/users/preferences",
      {
        preferences,
      }
    );
    return response.data?.preferences || {};
  }
}

export const userService = new UserService();
