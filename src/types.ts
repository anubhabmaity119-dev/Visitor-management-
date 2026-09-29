export type UserRole = 'employee' | 'visitor' | 'student';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  role: UserRole;
  companyOrCollege: string;
  designationOrCourse?: string;
}

export interface VisitorRecord {
  _id: string;
  name: string;
  mobileNumber: string;
  companyOrCollege: string;
  personToMeet: string;
  purposeOfVisit: string;
  dateTime: string;
  visitorCategory: 'Visitor' | 'Student' | 'Employee';
  createdByUserId?: string;
}

export interface VisitorFormInput {
  name: string;
  mobileNumber: string;
  companyOrCollege: string;
  personToMeet: string;
  purposeOfVisit: string;
  visitorCategory?: 'Visitor' | 'Student' | 'Employee';
}
