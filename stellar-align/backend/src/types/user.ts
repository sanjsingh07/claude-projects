import { ZodiacSign, Gender } from "@prisma/client";

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  authProvider: "email" | "google" | "apple";
  displayName?: string;
  gender?: Gender;
  bio?: string;
  avatarUrl?: string;
  profileCompleted: boolean;

  // Birth data
  birthDateTime: Date;
  birthTimeUnknown: boolean;
  birthLocationName?: string;
  birthLatitude?: number;
  birthLongitude?: number;
  birthTimezone: string;
  birthUtcOffset?: number;

  // Settings
  notificationSettings: NotificationSettings;
  privacySettings: PrivacySettings;

  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

export interface NotificationSettings {
  dailyHoroscope: boolean;
  transitAlerts: boolean;
  friendActivity: boolean;
  marketing: boolean;
  pushTime: string; // "HH:mm"
}

export interface PrivacySettings {
  profileVisible: boolean;
  chartVisible: "public" | "friends" | "private";
  allowCompatibility: boolean;
}

export interface UserCreateInput {
  email: string;
  password?: string;
  authProvider?: "email" | "google" | "apple";
  providerId?: string;
  displayName?: string;
  gender?: Gender;
  birthDateTime: Date;
  birthTimeUnknown?: boolean;
  birthLocationName?: string;
  birthLatitude?: number;
  birthLongitude?: number;
  birthTimezone: string;
}

export interface UserUpdateInput {
  email?: string;
  displayName?: string;
  gender?: Gender;
  bio?: string;
  avatarUrl?: string;
  birthDateTime?: Date;
  birthTimeUnknown?: boolean;
  birthLocationName?: string;
  birthLatitude?: number;
  birthLongitude?: number;
  birthTimezone?: string;
  notificationSettings?: Partial<NotificationSettings>;
  privacySettings?: Partial<PrivacySettings>;
}

export interface UserProfile {
  id: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  birthDate: Date;
  sunSign: ZodiacSign;
  moonSign?: ZodiacSign;
  risingSign?: ZodiacSign;
  isFriend?: boolean;
  friendRequestPending?: boolean;
  compatibilityScore?: number;
}

export interface Friend {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  sunSign: ZodiacSign;
  compatibilityScore?: number;
  acceptedAt: Date;
}

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: "pending" | "accepted" | "blocked";
  createdAt: Date;
  acceptedAt?: Date;
}

export interface FriendshipRequest {
  id: string;
  fromUser: UserProfile;
  sentAt: Date;
}
