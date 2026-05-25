'use client';

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Plus, Trash2 } from "lucide-react";

import {
  listDepartments,
  type Department,
} from "@/features/departments/api/departmentApi";

import {
  createSubject,
  deleteSubject,
  listSubjects,
  updateSubject,
  type Subject,
  type SubjectPayload,
} from "@/features/subjects/api/subjectApi";
import { authContext } from "../auth/authContext";

type SubjectFormState = {
  name: string;
  departmentIds: number[];
  lecture: string;
  tutorial: string;
  practical: string;
};

const initialFormState: SubjectFormState = {
  name: "",
  departmentIds: [],
  lecture: "",
  tutorial: "",
  practical: "",
};

const resolveErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Something went wrong while processing the subject request.";
};

function Subjects() {
  useEffect(() => {
    if (!authContext) {
      window.location.replace("/");
      return;
    };

    const checkAuth = async () => {
      if (!(await authContext.isAuthenticated())) {
        window.location.replace("/");
      }
    };
    checkAuth();
  });

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

  const [formState, setFormState] =
    useState<SubjectFormState>(initialFormState);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const selectedSubject =
    subjects.find((subject) => subject.id === selectedSubjectId) ?? null;

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);

      try {
        const [subjectResponse, departmentResponse] =
          await Promise.all([
            listSubjects(),
            listDepartments(),
          ]);

        setSubjects(subjectResponse);
        setDepartments(departmentResponse);
      } catch (err) {
        setError(resolveErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const resetForm = (clearMessages = true) => {
    setSelectedSubjectId(null);

    setFormState(initialFormState);

    if (clearMessages) {
      setError(null);
      setSuccessMessage(null);
    }
  };

  const handleSelectSubject = (subject: Subject) => {
    setSelectedSubjectId(subject.id);

    setFormState({
      name: subject.name,
      departmentIds: subject.department_ids,
      lecture: String(subject.lecture),
      tutorial: String(subject.tutorial),
      practical: String(subject.practical),
    });

    setError(null);
    setSuccessMessage(null);
  };

  const handleDepartmentToggle = (departmentId: number) => {
    setFormState((current) => {
      const exists = current.departmentIds.includes(departmentId);

      return {
        ...current,
        departmentIds: exists
          ? current.departmentIds.filter((id) => id !== departmentId)
          : [...current.departmentIds, departmentId],
      };
    });
  };

  const parseHours = (value: string): number | null => {
    if (!value.trim()) {
      return null;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 0) {
      return null;
    }

    return parsed;
  };

  const buildPayload = (): SubjectPayload | null => {
    const lecture = parseHours(formState.lecture);
    const tutorial = parseHours(formState.tutorial);
    const practical = parseHours(formState.practical);

    if (!formState.name.trim()) {
      setError("Subject name is required.");
      return null;
    }

    if (formState.departmentIds.length === 0) {
      setError("Select at least one department.");
      return null;
    }

    if (lecture === null) {
      setError("Lecture must be a valid number.");
      return null;
    }

    if (tutorial === null) {
      setError("Tutorial must be a valid number.");
      return null;
    }

    if (practical === null) {
      setError("Practical must be a valid number.");
      return null;
    }

    return {
      name: formState.name.trim(),
      department_ids: formState.departmentIds,
      lecture,
      tutorial,
      practical,
    };
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError(null);
    setSuccessMessage(null);

    const payload = buildPayload();

    if (!payload) {
      return;
    }

    setIsSaving(true);

    try {
      if (selectedSubjectId !== null) {
        const updatedSubject = await updateSubject(
          selectedSubjectId,
          payload
        );

        setSubjects((current) =>
          current.map((subject) =>
            subject.id === updatedSubject.id
              ? updatedSubject
              : subject
          )
        );

        setSuccessMessage("Subject updated successfully.");
      } else {
        const createdSubject = await createSubject(payload);

        setSubjects((current) => [
          createdSubject,
          ...current,
        ]);

        setSuccessMessage("Subject created successfully.");
      }

      resetForm(false);
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (selectedSubjectId === null) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this subject?"
    );

    if (!confirmed) {
      return;
    }

    setError(null);
    setSuccessMessage(null);

    setIsDeleting(true);

    try {
      await deleteSubject(selectedSubjectId);

      setSubjects((current) =>
        current.filter(
          (subject) => subject.id !== selectedSubjectId
        )
      );

      setSuccessMessage("Subject deleted successfully.");

      resetForm(false);
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Subjects
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage subject information and workload
            </p>
          </div>

          <button
            onClick={() => resetForm()}
            className="flex items-center gap-2  bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />

            <span>New Subject</span>
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-3  border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <p>{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-3  border border-green-200 bg-green-50 p-4 text-green-700">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <p>{successMessage}</p>
          </div>
        )}

        {/* Main Layout */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Subject List */}
          <div className=" border bg-white/20 shadow-sm">
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold">
                Subject List
              </h2>
            </div>

            <div className="max-h-162.5 overflow-y-auto p-3">
              {isLoading ? (
                <div className="py-10 text-center text-sm text-gray-500">
                  Loading subjects...
                </div>
              ) : subjects.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500">
                  No subjects available
                </div>
              ) : (
                <div className="space-y-2">
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() =>
                        handleSelectSubject(subject)
                      }
                      className={`w-full  border p-4 text-left transition ${selectedSubjectId === subject.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                        }`}
                    >
                      <div className="font-semibold">
                        {subject.name}
                      </div>

                      <div className="mt-1 text-xs text-gray-500">
                        Dept:{" "}
                        {subject.department_ids
                          .map(
                            (id) =>
                              departments.find(
                                (department) =>
                                  department.id === id
                              )?.abbreviation
                          )
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </div>

                      <div className="mt-1 text-xs text-gray-500">
                        L: {subject.lecture} | T:{" "}
                        {subject.tutorial} | P:{" "}
                        {subject.practical}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <div className=" border bg-white/20 shadow-sm">

              <div className="border-b p-6">
                <h2 className="text-2xl font-semibold">
                  {selectedSubject
                    ? `Edit ${selectedSubject.name}`
                    : "Create Subject"}
                </h2>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-6 p-6"
              >

                {/* Subject Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Subject Name
                  </label>

                  <input
                    type="text"
                    value={formState.name}
                    onChange={(e) =>
                      setFormState((current) => ({
                        ...current,
                        name: e.target.value,
                      }))
                    }
                    placeholder="e.g. Data Structures"
                    className="w-full  border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                  />
                </div>

                {/* Departments */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    Departments
                  </label>

                  <div className="grid gap-3  border border-gray-200 p-4 sm:grid-cols-2">
                    {departments.map((department) => (
                      <label
                        key={department.id}
                        className="flex items-center gap-3  border border-gray-200 p-3 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={formState.departmentIds.includes(
                            department.id
                          )}
                          onChange={() =>
                            handleDepartmentToggle(
                              department.id
                            )
                          }
                        />

                        <div>
                          <div className="font-medium">
                            {department.name}
                          </div>

                          <div className="text-xs text-gray-500">
                            {department.abbreviation}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Hours */}
                <div className="grid gap-4 sm:grid-cols-3">

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Lecture
                    </label>

                    <input
                      type="number"
                      min={0}
                      value={formState.lecture}
                      onChange={(e) =>
                        setFormState((current) => ({
                          ...current,
                          lecture: e.target.value,
                        }))
                      }
                      className="w-full  border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Tutorial
                    </label>

                    <input
                      type="number"
                      min={0}
                      value={formState.tutorial}
                      onChange={(e) =>
                        setFormState((current) => ({
                          ...current,
                          tutorial: e.target.value,
                        }))
                      }
                      className="w-full  border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Practical
                    </label>

                    <input
                      type="number"
                      min={0}
                      value={formState.practical}
                      onChange={(e) =>
                        setFormState((current) => ({
                          ...current,
                          practical: e.target.value,
                        }))
                      }
                      className="w-full  border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4">

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1  bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving
                      ? "Saving..."
                      : selectedSubject
                        ? "Update Subject"
                        : "Create Subject"}
                  </button>

                  {selectedSubject && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex items-center justify-center gap-2  bg-red-600 px-4 py-3 font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />

                      {isDeleting
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  )}
                </div>

              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Subjects;