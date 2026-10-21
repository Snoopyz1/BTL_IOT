// User types for the Smart Home IoT system

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  avatar: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  socialLinks: SocialLinks;
}

export interface SocialLinks {
  github?: string;
  figma?: string;
  linkedin?: string;
  facebook?: string;
  postman?: string;
  pdfDocument?: string;
  pdfFileName?: string;
}

export interface UserUpdatePayload {
  fullName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  socialLinks?: SocialLinks;
}
