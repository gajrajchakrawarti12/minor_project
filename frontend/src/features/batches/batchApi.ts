import { del, get, post, put } from "@/shared/api/http";

export type Batch = {
  id: number;
  name: string;
  semester: number;
  department_id: number;
};

export type BatchPayload = {
  name: string;
  semester: number;
  department_id: number;
};

export const listBatches = async (): Promise<Batch[]> => {
  return get<Batch[]>("/batches");
};

export const createBatch = async (payload: BatchPayload): Promise<Batch> => {
  return post<Batch, BatchPayload>("/batches", payload);
};

export const updateBatch = async (id: number, payload: BatchPayload): Promise<Batch> => {
  return put<Batch, BatchPayload>(`/batches/${id}`, payload);
};

export const deleteBatch = async (id: number): Promise<void> => {
  return del<void>(`/batches/${id}`);
};
