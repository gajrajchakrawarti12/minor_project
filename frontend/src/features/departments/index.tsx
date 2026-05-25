import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Building2, Search, Trash2, Pencil } from "lucide-react";

import {
    createDepartment,
    deleteDepartment,
    listDepartments,
    updateDepartment,
    type Department,
} from "./api/departmentApi";

import { resolveApiErrorMessage } from "@/shared/lib/apiErrors";
import { authContext } from "../auth/authContext";

type FormState = {
    name: string;
    abbreviation: string;
};

type ActionState = "idle" | "loading" | "saving" | "deleting";

const initialFormState: FormState = {
    name: "",
    abbreviation: "",
};

function DepartmentsPage() {


    useEffect(() => {
        if (!authContext) {
            window.location.href = "/";
            return;
        } else {
            authContext.isAuthenticated().then((isAuth) => {
                if (!isAuth) {
                    window.location.href = "/";
                    return;
                }
            });
        }
    }, []);
    
    const [departments, setDepartments] = useState<Department[]>([]);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);

    const [formState, setFormState] = useState<FormState>(initialFormState);

    const [search, setSearch] = useState("");

    const [isEditing, setIsEditing] = useState(false);

    const [actionState, setActionState] =
        useState<ActionState>("idle");

    const [error, setError] = useState<string | null>(null);

    const [successMessage, setSuccessMessage] =
        useState<string | null>(null);

    const isBusy = actionState !== "idle";

    const selectedDepartment = useMemo(
        () =>
            departments.find(
                (department) =>
                    department.id === selectedDepartmentId,
            ) ?? null,
        [departments, selectedDepartmentId],
    );

    const sortedDepartments = useMemo(() => {
        return [...departments].sort((a, b) =>
            a.name.localeCompare(b.name),
        );
    }, [departments]);

    const filteredDepartments = useMemo(() => {
        return sortedDepartments.filter((department) =>
            department.name
                .toLowerCase()
                .includes(search.toLowerCase()),
        );
    }, [search, sortedDepartments]);

    const loadDepartments = useCallback(async () => {
        setActionState("loading");
        setError(null);

        try {
            const response = await listDepartments();
            setDepartments(response);
        } catch (err) {
            setError(
                resolveApiErrorMessage(
                    err,
                    "Failed to load departments.",
                ),
            );
        } finally {
            setActionState("idle");
        }
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadDepartments();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadDepartments]);

    const resetForm = () => {
        setFormState(initialFormState);
        setIsEditing(false);
        setSelectedDepartmentId(null);
    };

    const clearMessages = () => {
        setError(null);
        setSuccessMessage(null);
    };

    const handleCreateMode = () => {
        resetForm();
        clearMessages();
    };

    const handleSelectDepartment = (
        department: Department,
    ) => {
        setSelectedDepartmentId(department.id);

        setFormState({
            name: department.name,
            abbreviation: department.abbreviation,
        });

        setIsEditing(true);

        clearMessages();
    };

    const validateForm = (): boolean => {
        const trimmedName = formState.name.trim();
        const trimmedAbbreviation =
            formState.abbreviation.trim();

        if (!trimmedName) {
            setError("Department name is required.");
            return false;
        }

        if (!trimmedAbbreviation) {
            setError(
                "Department abbreviation is required.",
            );
            return false;
        }

        if (trimmedAbbreviation.length > 10) {
            setError(
                "Abbreviation cannot exceed 10 characters.",
            );
            return false;
        }

        const duplicateDepartment = departments.find(
            (department) =>
                department.name.toLowerCase() ===
                    trimmedName.toLowerCase() &&
                department.id !== selectedDepartmentId,
        );

        if (duplicateDepartment) {
            setError("Department already exists.");
            return false;
        }

        return true;
    };

    const handleSubmit = async (
        event: React.FormEvent,
    ) => {
        event.preventDefault();

        clearMessages();

        if (!validateForm()) {
            return;
        }

        const payload = {
            name: formState.name.trim(),
            abbreviation:
                formState.abbreviation
                    .trim()
                    .toUpperCase(),
        };

        setActionState("saving");

        try {
            if (
                isEditing &&
                selectedDepartmentId !== null
            ) {
                await updateDepartment(
                    selectedDepartmentId,
                    payload,
                );

                setSuccessMessage(
                    "Department updated successfully.",
                );
            } else {
                await createDepartment(payload);

                setSuccessMessage(
                    "Department created successfully.",
                );
            }

            await loadDepartments();
        } catch (err) {
            setError(
                resolveApiErrorMessage(
                    err,
                    "Failed to save department.",
                ),
            );
        } finally {
            setActionState("idle");
        }
    };

    const handleDelete = async () => {
        if (selectedDepartmentId === null) {
            return;
        }

        const confirmed = window.confirm(
            "Delete this department?",
        );

        if (!confirmed) {
            return;
        }

        clearMessages();

        setActionState("deleting");

        try {
            await deleteDepartment(selectedDepartmentId);

            setSuccessMessage(
                "Department deleted successfully.",
            );

            resetForm();

            await loadDepartments();
        } catch (err) {
            setError(
                resolveApiErrorMessage(
                    err,
                    "Failed to delete department.",
                ),
            );
        } finally {
            setActionState("idle");
        }
    };

    return (
        <div className="min-h-screen p-6">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Departments
                        </h1>

                        <p className="mt-1 text-gray-500">
                            Manage academic departments
                        </p>
                    </div>

                    <button
                        onClick={handleCreateMode}
                        className="flex items-center gap-2  bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
                    >
                        <Plus size={18} />
                        New Department
                    </button>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-4  border border-red-200 bg-red-50 px-4 py-3 text-red-600">
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="mb-4  border border-green-200 bg-green-50 px-4 py-3 text-green-600">
                        {successMessage}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left Panel */}
                    <div className=" border shadow-sm">
                        <div className="border-b p-4">
                            <div className="mb-4 flex items-center gap-2">
                                <Building2
                                    size={20}
                                    className="text-blue-600"
                                />

                                <h2 className="text-lg font-semibold">
                                    Department List
                                </h2>
                            </div>

                            {/* Search */}
                            <div className="relative">
                                <Search
                                    size={18}
                                    className="absolute left-3 top-3 text-gray-400"
                                />

                                <input
                                    type="text"
                                    placeholder="Search department..."
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(
                                            e.target.value,
                                        )
                                    }
                                    className="w-full  border py-2 pl-10 pr-4 outline-none transition focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Department List */}
                        <div className="max-h-150 overflow-y-auto">
                            {actionState === "loading" ? (
                                <div className="p-6 text-center text-gray-500">
                                    Loading departments...
                                </div>
                            ) : filteredDepartments.length ===
                              0 ? (
                                <div className="p-6 text-center text-gray-500">
                                    No departments found.
                                </div>
                            ) : (
                                filteredDepartments.map(
                                    (department) => (
                                        <div
                                            key={
                                                department.id
                                            }
                                            onClick={() =>
                                                handleSelectDepartment(
                                                    department,
                                                )
                                            }
                                            className={`cursor-pointer border-b p-4 transition-colors duration-200 hover:bg-gray-50 ${
                                                selectedDepartmentId ===
                                                department.id
                                                    ? "border-l-4 border-l-blue-600 bg-blue-50"
                                                    : ""
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-medium text-gray-900">
                                                        {
                                                            department.name
                                                        }
                                                    </h3>

                                                    <p className="mt-1 text-sm text-gray-500">
                                                        {
                                                            department.abbreviation
                                                        }
                                                    </p>
                                                </div>

                                                <Pencil
                                                    size={
                                                        16
                                                    }
                                                    className="text-gray-400"
                                                />
                                            </div>
                                        </div>
                                    ),
                                )
                            )}
                        </div>
                    </div>

                    {/* Right Panel */}
                    <div className="lg:col-span-2">
                        <div className=" border shadow-sm">
                            <div className="border-b p-6">
                                <h2 className="text-2xl font-semibold">
                                    {isEditing
                                        ? "Edit Department"
                                        : "Create Department"}
                                </h2>

                                <p className="mt-1 text-gray-500">
                                    {isEditing
                                        ? "Update department details"
                                        : "Add a new department"}
                                </p>
                            </div>

                            <form
                                onSubmit={handleSubmit}
                                className="space-y-6 p-6"
                            >
                                {/* Name */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Department Name
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            formState.name
                                        }
                                        onChange={(e) =>
                                            setFormState(
                                                (
                                                    prev,
                                                ) => ({
                                                    ...prev,
                                                    name: e
                                                        .target
                                                        .value,
                                                }),
                                            )
                                        }
                                        disabled={isBusy}
                                        placeholder="Computer Science"
                                        className="w-full  border px-4 py-3 outline-none transition focus:border-blue-500 disabled:bg-gray-100"
                                    />
                                </div>

                                {/* Abbreviation */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Abbreviation
                                    </label>

                                    <input
                                        type="text"
                                        value={
                                            formState.abbreviation
                                        }
                                        onChange={(e) =>
                                            setFormState(
                                                (
                                                    prev,
                                                ) => ({
                                                    ...prev,
                                                    abbreviation:
                                                        e
                                                            .target
                                                            .value,
                                                }),
                                            )
                                        }
                                        disabled={isBusy}
                                        placeholder="CSE"
                                        className="w-full  border px-4 py-3 uppercase outline-none transition focus:border-blue-500 disabled:bg-gray-100"
                                    />
                                </div>

                                {/* Preview */}
                                {selectedDepartment && (
                                    <div className=" border bg-gray-50 p-4">
                                        <p className="text-sm text-gray-500">
                                            Selected
                                            Department
                                        </p>

                                        <h3 className="mt-1 text-lg font-semibold">
                                            {
                                                selectedDepartment.name
                                            }
                                        </h3>

                                        <p className="text-gray-600">
                                            {
                                                selectedDepartment.abbreviation
                                            }
                                        </p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={
                                            isBusy
                                        }
                                        className=" bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                                    >
                                        {actionState ===
                                        "saving"
                                            ? "Saving..."
                                            : isEditing
                                              ? "Update Department"
                                              : "Create Department"}
                                    </button>

                                    {isEditing && (
                                        <button
                                            type="button"
                                            onClick={
                                                handleDelete
                                            }
                                            disabled={
                                                isBusy
                                            }
                                            className="flex items-center gap-2  bg-red-600 px-6 py-3 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                                        >
                                            <Trash2
                                                size={
                                                    18
                                                }
                                            />

                                            {actionState ===
                                            "deleting"
                                                ? "Deleting..."
                                                : "Delete"}
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={
                                            resetForm
                                        }
                                        disabled={
                                            isBusy
                                        }
                                        className=" border px-6 py-3 font-medium transition hover:bg-gray-100 disabled:cursor-not-allowed"
                                    >
                                        Reset
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DepartmentsPage;