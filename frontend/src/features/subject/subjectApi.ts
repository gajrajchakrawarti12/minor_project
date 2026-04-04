import { del, get, post, put } from "@/shared/api/http";

export type Subject = {
  id: number;
  name: string;
  lecture: number;
  tutorial: number;
  practical: number;
};

export type SubjectPayload = {
  name: string;
  lecture: number;
  tutorial: number;
  practical: number;
};

export const listSubjects = async (): Promise<Subject[]> => {
  return get<Subject[]>("/subjects");
};

export const createSubject = async (payload: SubjectPayload): Promise<Subject> => {
  return post<Subject, SubjectPayload>("/subjects", payload);
};

export const updateSubject = async (id: number, payload: SubjectPayload): Promise<Subject> => {
  return put<Subject, SubjectPayload>(`/subjects/${id}`, payload);
};

export const deleteSubject = async (id: number): Promise<void> => {
  return del<void>(`/subjects/${id}`);
};
