import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";

import {
    listDepartments,
    type Department,
} from "@/features/departments/api/departmentApi";

import {
    listSubjects,
    type Subject,
} from "@/features/subjects/api/subjectApi";

import {
    createTeacher,
    deleteTeacher,
    listTeachers,
    updateTeacher,
    type Teacher,
} from "@/features/teachers/api/teacherApi";

import { resolveApiErrorMessage } from "@/shared/lib/apiErrors";
import { authContext } from "../auth/authContext";

type TeacherFormState = {
    name: string;
    abbreviation: string;
    specializationIds: number[];
};

const initialTeacherForm: TeacherFormState = {
    name: "",
    abbreviation: "",
    specializationIds: [],
};

function TeachersPage() {

    useEffect(() => {
        if (!authContext) {
            window.location.replace("/");
            return;
        } else {
            authContext.isAuthenticated().then((isAuth) => {
                if (!isAuth) {
                    window.location.replace("/");
                }            
            });
        }
    }, []);
    const [searchParams, setSearchParams] = useSearchParams();

    const [departments, setDepartments] = useState<Department[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);

    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
    const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);

    const [formState, setFormState] =
        useState<TeacherFormState>(initialTeacherForm);

    const [teacherSearchQuery, setTeacherSearchQuery] = useState("");

    const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
    const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [deletingTeacherId, setDeletingTeacherId] = useState<number | null>(null);

    const [isEditing, setIsEditing] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const selectedDepartment = useMemo(
        () =>
            departments.find((department) => department.id === selectedDepartmentId) ??
            null,
        [departments, selectedDepartmentId]
    );

    const teachersInDepartment = useMemo(() => {
        return teachers.filter(
            (teacher) => teacher.departmentId === selectedDepartmentId
        );
    }, [teachers, selectedDepartmentId]);

    const filteredTeachers = useMemo(() => {
        const query = teacherSearchQuery.trim().toLowerCase();

        if (!query) {
            return teachersInDepartment;
        }

        return teachersInDepartment.filter(
            (teacher) =>
                teacher.name.toLowerCase().includes(query) ||
                teacher.abbreviation.toLowerCase().includes(query)
        );
    }, [teacherSearchQuery, teachersInDepartment]);

    const loadTeachers = useCallback(async () => {
        setIsLoadingTeachers(true);

        try {
            const response = await listTeachers();
            setTeachers(response);
        } catch (err) {
            setError(resolveApiErrorMessage(err, "Failed to load teachers."));
        } finally {
            setIsLoadingTeachers(false);
        }
    }, []);

    const loadInitial = useCallback(async () => {
        setIsLoadingDepartments(true);

        try {
            const [departmentResponse, subjectResponse] = await Promise.all([
                listDepartments(),
                listSubjects(),
            ]);

            setDepartments(departmentResponse);
            setSubjects(subjectResponse);

            const paramId = Number(searchParams.get("departmentId"));

            if (
                paramId &&
                departmentResponse.some((department) => department.id === paramId)
            ) {
                setSelectedDepartmentId(paramId);
            } else {
                setSelectedDepartmentId(departmentResponse[0]?.id ?? null);
            }
        } catch (err) {
            setError(resolveApiErrorMessage(err, "Failed to load data."));
        } finally {
            setIsLoadingDepartments(false);
        }
    }, [searchParams]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadInitial();
    }, [loadInitial]);

    useEffect(() => {
        if (selectedDepartmentId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            void loadTeachers();
        }
    }, [loadTeachers, selectedDepartmentId]);

    const resetForm = () => {
        setFormState(initialTeacherForm);
        setSelectedTeacherId(null);
        setIsEditing(false);
    };

    const selectDepartment = (department: Department) => {
        setSelectedDepartmentId(department.id);

        setSearchParams({
            departmentId: String(department.id),
        });

        resetForm();
    };

    const selectTeacher = (teacher: Teacher) => {
        setSelectedTeacherId(teacher.id);

        setFormState({
            name: teacher.name,
            abbreviation: teacher.abbreviation,
            specializationIds: teacher.specializationIds,
        });

        setIsEditing(true);
    };

    const handleSpecializationChange = (subjectId: number) => {
        setFormState((current) => {
            const exists = current.specializationIds.includes(subjectId);

            return {
                ...current,
                specializationIds: exists
                    ? current.specializationIds.filter((id) => id !== subjectId)
                    : [...current.specializationIds, subjectId],
            };
        });
    };

    const validateForm = () => {
        if (!formState.name.trim()) {
            setError("Teacher name is required.");
            return false;
        }

        if (!formState.abbreviation.trim()) {
            setError("Teacher abbreviation is required.");
            return false;
        }

        if (formState.specializationIds.length === 0) {
            setError("Select at least one specialization.");
            return false;
        }

        return true;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        setError(null);
        setSuccessMessage(null);

        if (!validateForm() || !selectedDepartmentId) {
            return;
        }

        const payload = {
            name: formState.name.trim(),
            abbreviation: formState.abbreviation.trim(),
            specializationIds: formState.specializationIds,
            departmentId: selectedDepartmentId,
        };

        setIsSaving(true);

        try {
            if (isEditing && selectedTeacherId) {
                const updatedTeacher = await updateTeacher(
                    selectedTeacherId,
                    payload
                );

                setTeachers((current) =>
                    current.map((teacher) =>
                        teacher.id === updatedTeacher.id ? updatedTeacher : teacher
                    )
                );

                setSuccessMessage("Teacher updated.");
            } else {
                const createdTeacher = await createTeacher(payload);

                setTeachers((current) => [createdTeacher, ...current]);

                setSuccessMessage("Teacher created.");

                selectTeacher(createdTeacher);
            }
        } catch (err) {
            setError(resolveApiErrorMessage(err, "Failed to save teacher."));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (teacherId: number) => {
        const confirmed = window.confirm("Delete this teacher?");

        if (!confirmed) return;

        setDeletingTeacherId(teacherId);

        try {
            await deleteTeacher(teacherId);

            setTeachers((current) =>
                current.filter((teacher) => teacher.id !== teacherId)
            );

            if (selectedTeacherId === teacherId) {
                resetForm();
            }

            setSuccessMessage("Teacher deleted.");
        } catch (err) {
            setError(resolveApiErrorMessage(err, "Failed to delete teacher."));
        } finally {
            setDeletingTeacherId(null);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-12 gap-6">

                {/* Departments */}
                <div className="col-span-3">
                    <div className="border overflow-hidden">
                        <div className="p-4 border-b font-extrabold text-lg">
                            Departments
                        </div>

                        {isLoadingDepartments ? (
                            <p className="p-4">Loading...</p>
                        ) : (
                            departments.map((department) => (
                                <button
                                    key={department.id}
                                    onClick={() => selectDepartment(department)}
                                    className={`w-[96%] text-left px-4 py-3 my-2 mx-[2%] border hover:bg-gray-100 transition ${selectedDepartmentId === department.id
                                        ? "bg-gray-200 font-semibold"
                                        : ""
                                        }`}
                                >
                                    {department.name}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Teachers */}
                <div className="col-span-4">
                    <div className="border  overflow-hidden">

                        <div className="p-4 border-b flex items-center justify-between">
                            <h2 className="font-semibold">
                                {selectedDepartment
                                    ? `${selectedDepartment.name} Teachers`
                                    : "Teachers"}
                            </h2>

                            <button
                                onClick={resetForm}
                                className="flex items-center gap-1 bg-blue-500 text-white px-3 py-2  hover:bg-blue-600"
                            >
                                <Plus size={16} />
                                Add
                            </button>
                        </div>

                        <div className="p-4 border-b">
                            <input
                                type="text"
                                placeholder="Search teachers..."
                                value={teacherSearchQuery}
                                onChange={(e) =>
                                    setTeacherSearchQuery(e.target.value)
                                }
                                className="w-full border  px-3 py-2"
                            />
                        </div>

                        <div>
                            {isLoadingTeachers ? (
                                <p className="p-4">Loading...</p>
                            ) : filteredTeachers.length === 0 ? (
                                <p className="p-4 text-gray-500">
                                    No teachers found.
                                </p>
                            ) : (
                                filteredTeachers.map((teacher) => (
                                    <div
                                        key={teacher.id}
                                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${selectedTeacherId === teacher.id
                                            ? "bg-gray-100"
                                            : ""
                                            }`}
                                        onClick={() => selectTeacher(teacher)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">
                                                    {teacher.name}
                                                </p>

                                                <p className="text-sm text-gray-500">
                                                    {teacher.abbreviation}
                                                </p>
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    void handleDelete(teacher.id);
                                                }}
                                                disabled={deletingTeacherId === teacher.id}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="col-span-5">
                    <form
                        onSubmit={handleSubmit}
                        className="border  p-6 space-y-5"
                    >
                        <h2 className="text-lg font-semibold">
                            {isEditing ? "Edit Teacher" : "Create Teacher"}
                        </h2>

                        <div>
                            <label className="block mb-1 font-medium">
                                Name
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
                                className="w-full border  px-3 py-2"
                            />
                        </div>

                        <div>
                            <label className="block mb-1 font-medium">
                                Abbreviation
                            </label>

                            <input
                                type="text"
                                value={formState.abbreviation}
                                onChange={(e) =>
                                    setFormState((current) => ({
                                        ...current,
                                        abbreviation: e.target.value,
                                    }))
                                }
                                className="w-full border  px-3 py-2"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 font-medium">
                                Specializations
                            </label>

                            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto border  p-3">
                                {subjects.map((subject) => (
                                    <label
                                        key={subject.id}
                                        className="flex items-center gap-2"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formState.specializationIds.includes(
                                                subject.id
                                            )}
                                            onChange={() =>
                                                handleSpecializationChange(subject.id)
                                            }
                                        />

                                        <span>{subject.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-blue-500 text-white px-4 py-2  hover:bg-blue-600"
                        >
                            {isSaving
                                ? "Saving..."
                                : isEditing
                                    ? "Update Teacher"
                                    : "Create Teacher"}
                        </button>
                    </form>
                </div>
            </div>

            {error && (
                <div className="text-red-500 font-medium">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="text-green-600 font-medium">
                    {successMessage}
                </div>
            )}
        </div>
    );
}

export default TeachersPage;