import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
} from "lucide-react";

import {
  listDepartments,
  type Department,
} from "@/features/departments/api/departmentApi";

import {
  listSubjects,
  type Subject,
} from "@/features/subjects/api/subjectApi";

import {
  createBatch,
  deleteBatch,
  listBatches,
  updateBatch,
  type Batch,
} from "@/features/batches/api/batchApi";

import { resolveApiErrorMessage } from "@/shared/lib/apiErrors";
import { authContext } from "../auth/authContext";

type BatchFormState = {
  name: string;
  semester: string;
  subjectIds: number[];
};

const initialBatchForm: BatchFormState = {
  name: "",
  semester: "",
  subjectIds: [],
};

function Batches() {

  useEffect(() => {
    if(!authContext) {
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

  const [searchParams, setSearchParams] =
    useSearchParams();

  const departmentParam =
    searchParams.get("departmentId");

  const [departments, setDepartments] = useState<
    Department[]
  >([]);

  const [subjects, setSubjects] = useState<Subject[]>(
    []
  );

  const [batches, setBatches] = useState<Batch[]>(
    []
  );

  const [selectedDepartmentId, setSelectedDepartmentId] =
    useState<number | null>(null);

  const [selectedBatchId, setSelectedBatchId] =
    useState<number | null>(null);

  const [formState, setFormState] =
    useState<BatchFormState>(initialBatchForm);

  const [batchSearchQuery, setBatchSearchQuery] =
    useState("");

  const [isLoading, setIsLoading] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);

  const [error, setError] = useState<string | null>(
    null
  );

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const selectedDepartment =
    departments.find(
      (department) =>
        department.id === selectedDepartmentId
    ) ?? null;

  const selectedBatch =
    batches.find(
      (batch) => batch.id === selectedBatchId
    ) ?? null;

  const batchesInDepartment = useMemo(() => {
    return batches.filter(
      (batch) =>
        batch.department_id === selectedDepartmentId
    );
  }, [batches, selectedDepartmentId]);

  const filteredBatches = useMemo(() => {
    const query = batchSearchQuery
      .trim()
      .toLowerCase();

    if (!query) {
      return batchesInDepartment;
    }

    return batchesInDepartment.filter((batch) =>
      batch.name.toLowerCase().includes(query)
    );
  }, [batchSearchQuery, batchesInDepartment]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);

      try {
        const [
          departmentResponse,
          subjectResponse,
          batchResponse,
        ] = await Promise.all([
          listDepartments(),
          listSubjects(),
          listBatches(),
        ]);

        setDepartments(departmentResponse);
        setSubjects(subjectResponse);
        setBatches(batchResponse);

        const parsedParam = Number(
          departmentParam
        );

        const initialDepartmentId =
          Number.isInteger(parsedParam) &&
          parsedParam > 0 &&
          departmentResponse.some(
            (department) =>
              department.id === parsedParam
          )
            ? parsedParam
            : departmentResponse[0]?.id ?? null;

        setSelectedDepartmentId(
          initialDepartmentId
        );
      } catch (err) {
        setError(
          resolveApiErrorMessage(
            err,
            "Failed to load batches."
          )
        );
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [departmentParam]);

  const resetForm = (
    clearMessages = true
  ) => {
    setSelectedBatchId(null);

    setFormState(initialBatchForm);

    if (clearMessages) {
      setError(null);
      setSuccessMessage(null);
    }
  };

  const selectDepartment = (
    department: Department
  ) => {
    setSelectedDepartmentId(department.id);

    setSearchParams({
      departmentId: String(department.id),
    });

    resetForm();
  };

  const selectBatch = (batch: Batch) => {
    setSelectedBatchId(batch.id);

    setFormState({
      name: batch.name,
      semester: String(batch.semester),
      subjectIds: batch.subject_ids ?? [],
    });

    setError(null);
    setSuccessMessage(null);
  };

  const toggleSubject = (subjectId: number) => {
    setFormState((current) => {
      const exists =
        current.subjectIds.includes(subjectId);

      return {
        ...current,
        subjectIds: exists
          ? current.subjectIds.filter(
              (id) => id !== subjectId
            )
          : [...current.subjectIds, subjectId],
      };
    });
  };

  const validateForm = () => {
    if (!formState.name.trim()) {
      setError("Batch name is required.");
      return false;
    }

    const semester = Number(
      formState.semester
    );

    if (
      !Number.isInteger(semester) ||
      semester < 1
    ) {
      setError(
        "Semester must be a positive integer."
      );
      return false;
    }

    if (!selectedDepartmentId) {
      setError("Select a department.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError(null);
    setSuccessMessage(null);

    if (
      !validateForm() ||
      !selectedDepartmentId
    ) {
      return;
    }

    const payload = {
      name: formState.name.trim(),
      semester: Number(formState.semester),
      department_id: selectedDepartmentId,
      subject_ids: formState.subjectIds,
    };

    setIsSaving(true);

    try {
      if (selectedBatchId !== null) {
        const updatedBatch =
          await updateBatch(
            selectedBatchId,
            payload
          );

        setBatches((current) =>
          current.map((batch) =>
            batch.id === updatedBatch.id
              ? updatedBatch
              : batch
          )
        );

        setSuccessMessage(
          "Batch updated successfully."
        );
      } else {
        const createdBatch =
          await createBatch(payload);

        setBatches((current) => [
          createdBatch,
          ...current,
        ]);

        setSuccessMessage(
          "Batch created successfully."
        );
      }

      resetForm(false);
    } catch (err) {
      setError(
        resolveApiErrorMessage(
          err,
          "Failed to save batch."
        )
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (selectedBatchId === null) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this batch?"
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    setError(null);

    try {
      await deleteBatch(selectedBatchId);

      setBatches((current) =>
        current.filter(
          (batch) =>
            batch.id !== selectedBatchId
        )
      );

      setSuccessMessage(
        "Batch deleted successfully."
      );

      resetForm(false);
    } catch (err) {
      setError(
        resolveApiErrorMessage(
          err,
          "Failed to delete batch."
        )
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] p-6">
      <div className="mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Batches
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Create and manage batches
            </p>
          </div>

          <button
            onClick={() => resetForm()}
            className="flex items-center gap-2  bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />

            <span>New Batch</span>
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
        <div className="grid gap-6 lg:grid-cols-12">

          {/* Departments */}
          <div className="lg:col-span-3">
            <div className=" border shadow-sm">

              <div className="border-b p-4">
                <h2 className="text-lg font-semibold">
                  Departments
                </h2>
              </div>

              <div className="p-2">
                {isLoading ? (
                  <div className="p-4 text-sm text-gray-500">
                    Loading...
                  </div>
                ) : (
                  departments.map((department) => (
                    <button
                      key={department.id}
                      onClick={() =>
                        selectDepartment(
                          department
                        )
                      }
                      className={`w-full  px-4 py-3 text-left transition border my-2   ${
                        selectedDepartmentId ===
                        department.id
                          ? "bg-blue-100 font-semibold text-blue-700"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {department.name}
                    </button>
                  ))
                )}
              </div>

            </div>
          </div>

          {/* Batch List */}
          <div className="lg:col-span-4">
            <div className=" border bg-white/10 shadow-sm">

              <div className="border-b p-4">
                <h2 className="text-lg font-semibold">
                  {selectedDepartment
                    ? `${selectedDepartment.name} Batches`
                    : "Batches"}
                </h2>
              </div>

              <div className="border-b p-4">
                <input
                  type="text"
                  placeholder="Search batches..."
                  value={batchSearchQuery}
                  onChange={(e) =>
                    setBatchSearchQuery(
                      e.target.value
                    )
                  }
                  className="w-full  border border-gray-600 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="max-h-140 overflow-y-auto p-3">
                {isLoading ? (
                  <div className="py-10 text-center text-sm text-gray-500">
                    Loading batches...
                  </div>
                ) : filteredBatches.length ===
                  0 ? (
                  <div className="py-10 text-center text-sm text-gray-500">
                    No batches found.
                  </div>
                ) : (
                  <div className="space-y-2">

                    {filteredBatches.map((batch) => (
                      <button
                        key={batch.id}
                        onClick={() =>
                          selectBatch(batch)
                        }
                        className={`w-full  border p-4 text-left transition ${
                          selectedBatchId ===
                          batch.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-500 hover:border-blue-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">

                          <div>
                            <div className="font-semibold">
                              {batch.name} 
                            </div>

                            <div className="mt-1 text-xs text-gray-500">
                              Semester:{" "}
                              {batch.semester}
                            </div>
                          </div>

                        </div>
                      </button>
                    ))}

                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-5">
            <div className=" border bg-white/10 shadow-sm">

              <div className="border-b p-6">
                <h2 className="text-2xl font-semibold">
                  {selectedBatch
                    ? `Edit ${selectedBatch.name} sem ${selectedBatch.semester}`
                    : "Create Batch"}
                </h2>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-6 p-6"
              >

                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Batch Name
                  </label>

                  <input
                    type="text"
                    value={formState.name}
                    onChange={(e) =>
                      setFormState(
                        (current) => ({
                          ...current,
                          name: e.target.value,
                        })
                      )
                    }
                    placeholder="e.g. CSE-A"
                    className="w-full  border border-gray-600 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                {/* Semester */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Semester
                  </label>

                  <input
                    type="number"
                    min={1}
                    value={formState.semester}
                    onChange={(e) =>
                      setFormState(
                        (current) => ({
                          ...current,
                          semester:
                            e.target.value,
                        })
                      )
                    }
                    placeholder="e.g. 5"
                    className="w-full  border border-gray-600 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                {/* Subjects */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    Subjects {subjects.length}
                  </label>

                  <div className="max-h-56 bg-white/80 space-y-2 overflow-y-auto  border p-4">

                    {subjects.length ===
                    0 ? (
                      <div className="text-sm text-gray-500">
                        No subjects available.
                      </div>
                    ) : (
                      subjects.map(
                        (subject) => (
                          <label
                            key={subject.id}
                            className="flex items-center gap-3  border border-gray-500 p-3 hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={formState.subjectIds.includes(
                                subject.id
                              )}
                              onChange={() =>
                                toggleSubject(
                                  subject.id
                                )
                              }
                            />

                            <span className="text-sm">
                              {subject.name}
                            </span>
                          </label>
                        )
                      )
                    )}

                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4">

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1  bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving
                      ? "Saving..."
                      : selectedBatch
                      ? "Update Batch"
                      : "Create Batch"}
                  </button>

                  {selectedBatch && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex items-center justify-center gap-2  bg-red-600 px-4 py-3 font-medium text-white hover:bg-red-700 disabled:opacity-50"
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

export default Batches;