'use client';

import { useEffect, useMemo, useState } from "react";

import {
    AlertCircle,
    CheckCircle,
    Filter,
    Search,
    Users,
    CalendarDays,
    GraduationCap,
    WandSparkles,
} from "lucide-react";

import type { ApiError } from "@/shared/api/http";

import {
    listBatches,
    type Batch,
} from "@/features/batches/api/batchApi";

import {
    listRooms,
    type Room,
} from "@/features/rooms/api/roomApi";

import {
    listSubjects,
    type Subject,
} from "@/features/subjects/api/subjectApi";

import {
    listTeachers,
    type Teacher,
} from "@/features/teachers/api/teacherApi";

import {
    autoGenerateTimetables,
    listTimeSlots,
    listTimetables,
    type TimeSlot,
    type Timetable,
} from "./api/timetableApi";

const weekdayOrder = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
];

const weekdaySortOrder = new Map(
    weekdayOrder.map((day, index) => [
        day,
        index,
    ]),
);

const resolveErrorMessage = (
    error: unknown,
): string => {
    const apiError = error as ApiError;

    if (typeof apiError?.data === "string") {
        return apiError.data;
    }

    if (
        apiError?.data &&
        typeof apiError.data === "object" &&
        "message" in (apiError.data as object)
    ) {
        const serverMessage = (
            apiError.data as {
                message?: unknown;
            }
        ).message;

        if (
            typeof serverMessage === "string" &&
            serverMessage.trim().length > 0
        ) {
            return serverMessage;
        }
    }

    if (
        apiError?.message &&
        apiError.message.trim().length > 0
    ) {
        return apiError.message;
    }

    if (
        error instanceof Error &&
        error.message.trim().length > 0
    ) {
        return error.message;
    }

    return "Something went wrong.";
};

const resolveAutoGenerationError = (
    error: unknown,
): string => {
    const apiError = error as ApiError;

    const baseMessage =
        resolveErrorMessage(error);

    const isTimeout =
        apiError?.status === 408;

    if (
        isTimeout ||
        /timed out/i.test(baseMessage)
    ) {
        return "Generation timeout. Try fewer batches.";
    }

    return baseMessage;
};

const formatDay = (
    value: string,
): string => {
    if (!value) {
        return value;
    }

    return `${value.charAt(0)}${value
        .slice(1)
        .toLowerCase()}`;
};

const formatTime = (
    value: string,
): string => {
    const [hours, minutes] =
        value.split(":");

    if (!hours || !minutes) {
        return value;
    }

    return `${hours}:${minutes}`;
};

const sortTimetables = (
    entries: Timetable[],
    batchById: Map<number, Batch>,
    timeSlotById: Map<number, TimeSlot>,
) => {
    return [...entries].sort(
        (left, right) => {
            const leftSlot =
                timeSlotById.get(
                    left.time_slot_id,
                );

            const rightSlot =
                timeSlotById.get(
                    right.time_slot_id,
                );

            const leftDay =
                weekdaySortOrder.get(
                    leftSlot?.day ?? "",
                ) ?? Number.MAX_SAFE_INTEGER;

            const rightDay =
                weekdaySortOrder.get(
                    rightSlot?.day ?? "",
                ) ?? Number.MAX_SAFE_INTEGER;

            if (leftDay !== rightDay) {
                return leftDay - rightDay;
            }

            const leftStart =
                leftSlot?.start_time ?? "";

            const rightStart =
                rightSlot?.start_time ?? "";

            if (leftStart !== rightStart) {
                return leftStart.localeCompare(
                    rightStart,
                );
            }

            const leftBatch =
                batchById.get(left.batch_id)
                    ?.name ?? "";

            const rightBatch =
                batchById.get(right.batch_id)
                    ?.name ?? "";

            return leftBatch.localeCompare(
                rightBatch,
            );
        },
    );
};

function TimeTable() {
    const [timetables, setTimetables] =
        useState<Timetable[]>([]);

    const [batches, setBatches] =
        useState<Batch[]>([]);

    const [subjects, setSubjects] =
        useState<Subject[]>([]);

    const [teachers, setTeachers] =
        useState<Teacher[]>([]);

    const [rooms, setRooms] =
        useState<Room[]>([]);

    const [timeSlots, setTimeSlots] =
        useState<TimeSlot[]>([]);

    const [selectedBatchIds, setSelectedBatchIds] =
        useState<Set<number>>(new Set());

    const [selectedTimetableId, setSelectedTimetableId] =
        useState<number | null>(null);

    const [batchFilter, setBatchFilter] =
        useState("all");

    const [dayFilter, setDayFilter] =
        useState("all");

    const [subjectFilter, setSubjectFilter] =
        useState("all");

    const [roomTypeFilter, setRoomTypeFilter] =
        useState<
            "all" | "lab" | "classroom"
        >("all");

    const [searchFilter, setSearchFilter] =
        useState("");

    const [, setIsLoading] =
        useState(false);

    const [isGenerating, setIsGenerating] =
        useState(false);

    const [error, setError] = useState<
        string | null
    >(null);

    const [successMessage, setSuccessMessage] =
        useState<string | null>(null);

    const batchById = useMemo(
        () =>
            new Map(
                batches.map((batch) => [
                    batch.id,
                    batch,
                ]),
            ),
        [batches],
    );

    const subjectById = useMemo(
        () =>
            new Map(
                subjects.map((subject) => [
                    subject.id,
                    subject,
                ]),
            ),
        [subjects],
    );

    const teacherById = useMemo(
        () =>
            new Map(
                teachers.map((teacher) => [
                    teacher.id,
                    teacher,
                ]),
            ),
        [teachers],
    );

    const roomById = useMemo(
        () =>
            new Map(
                rooms.map((room) => [
                    room.id,
                    room,
                ]),
            ),
        [rooms],
    );

    const timeSlotById = useMemo(
        () =>
            new Map(
                timeSlots.map((slot) => [
                    slot.id,
                    slot,
                ]),
            ),
        [timeSlots],
    );

    const sortedBatches = useMemo(
        () =>
            [...batches].sort((a, b) =>
                a.name.localeCompare(b.name),
            ),
        [batches],
    );

    const sortedSubjects = useMemo(
        () =>
            [...subjects].sort((a, b) =>
                a.name.localeCompare(b.name),
            ),
        [subjects],
    );

    const sortedTimetables = useMemo(
        () =>
            sortTimetables(
                timetables,
                batchById,
                timeSlotById,
            ),
        [
            timetables,
            batchById,
            timeSlotById,
        ],
    );

    const filteredTimetables = useMemo(() => {
        return sortedTimetables.filter(
            (entry) => {
                if (
                    batchFilter !== "all" &&
                    entry.batch_id !==
                    Number(batchFilter)
                ) {
                    return false;
                }

                if (
                    subjectFilter !== "all" &&
                    entry.subject_id !==
                    Number(subjectFilter)
                ) {
                    return false;
                }

                if (dayFilter !== "all") {
                    const slot =
                        timeSlotById.get(
                            entry.time_slot_id,
                        );

                    if (
                        slot?.day !== dayFilter
                    ) {
                        return false;
                    }
                }

                if (
                    roomTypeFilter !== "all"
                ) {
                    const room = roomById.get(
                        entry.room_id,
                    );

                    const isLab =
                        room?.isLab === true;

                    if (
                        roomTypeFilter ===
                        "lab" &&
                        !isLab
                    ) {
                        return false;
                    }

                    if (
                        roomTypeFilter ===
                        "classroom" &&
                        isLab
                    ) {
                        return false;
                    }
                }

                if (
                    searchFilter.trim()
                ) {
                    const subject =
                        subjectById.get(
                            entry.subject_id,
                        )?.name ?? "";

                    const teacher =
                        teacherById.get(
                            entry.teacher_id,
                        )?.name ?? "";

                    const room =
                        roomById.get(
                            entry.room_id,
                        )?.name ?? "";

                    const batch =
                        batchById.get(
                            entry.batch_id,
                        )?.name ?? "";

                    const text =
                        `${subject} ${teacher} ${room} ${batch}`.toLowerCase();

                    if (
                        !text.includes(
                            searchFilter.toLowerCase(),
                        )
                    ) {
                        return false;
                    }
                }

                return true;
            },
        );
    }, [
        sortedTimetables,
        batchFilter,
        dayFilter,
        subjectFilter,
        roomTypeFilter,
        searchFilter,
        batchById,
        subjectById,
        teacherById,
        roomById,
        timeSlotById,
    ]);

    const visibleDays = useMemo(() => {
        const days = new Set<string>();

        filteredTimetables.forEach(
            (entry) => {
                const slot =
                    timeSlotById.get(
                        entry.time_slot_id,
                    );

                if (slot?.day) {
                    days.add(slot.day);
                }
            },
        );

        return weekdayOrder.filter((day) =>
            days.has(day),
        );
    }, [
        filteredTimetables,
        timeSlotById,
    ]);

    const visibleSlots = useMemo(() => {
        const slots = new Set<string>();

        filteredTimetables.forEach(
            (entry) => {
                const slot =
                    timeSlotById.get(
                        entry.time_slot_id,
                    );

                if (!slot) {
                    return;
                }

                slots.add(
                    `${slot.start_time}-${slot.end_time}`,
                );
            },
        );

        return Array.from(slots).sort();
    }, [
        filteredTimetables,
        timeSlotById,
    ]);

    const groupedByBatch = useMemo(() => {
        const grouped = new Map<
            number,
            Timetable[]
        >();

        filteredTimetables.forEach(
            (entry) => {
                const existing =
                    grouped.get(
                        entry.batch_id,
                    ) ?? [];

                existing.push(entry);

                grouped.set(
                    entry.batch_id,
                    existing,
                );
            },
        );

        return grouped;
    }, [filteredTimetables]);

    const createCellMap = (
        entries: Timetable[],
    ) => {
        const map = new Map<
            string,
            Timetable[]
        >();

        entries.forEach((entry) => {
            const slot =
                timeSlotById.get(
                    entry.time_slot_id,
                );

            if (!slot) {
                return;
            }

            const key = `${slot.day}::${slot.start_time}-${slot.end_time}`;

            const existing =
                map.get(key) ?? [];

            existing.push(entry);

            map.set(key, existing);
        });

        return map;
    };

    const stats = useMemo(() => {
        return {
            totalEntries:
                filteredTimetables.length,

            totalBatches: new Set(
                filteredTimetables.map(
                    (entry) =>
                        entry.batch_id,
                ),
            ).size,

            totalTeachers: new Set(
                filteredTimetables.map(
                    (entry) =>
                        entry.teacher_id,
                ),
            ).size,
        };
    }, [filteredTimetables]);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [
                timetableData,
                batchData,
                subjectData,
                teacherData,
                roomData,
                slotData,
            ] = await Promise.all([
                listTimetables(),
                listBatches(),
                listSubjects(),
                listTeachers(),
                listRooms(),
                listTimeSlots(),
            ]);

            setTimetables(timetableData);
            setBatches(batchData);
            setSubjects(subjectData);
            setTeachers(teacherData);
            setRooms(roomData);
            setTimeSlots(slotData);
        } catch (err) {
            setError(
                resolveErrorMessage(err),
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadData();
    }, []);

    const handleBatchSelect = (
        batchId: number,
        checked: boolean,
    ) => {
        setSelectedBatchIds((prev) => {
            const next = new Set(prev);

            if (checked) {
                next.add(batchId);
            } else {
                next.delete(batchId);
            }

            return next;
        });
    };

    const handleAutoGenerate =
        async () => {
            setError(null);
            setSuccessMessage(null);

            if (
                selectedBatchIds.size === 0
            ) {
                setError(
                    "Select at least one batch.",
                );
                return;
            }

            setIsGenerating(true);

            try {
                const generated =
                    await autoGenerateTimetables(
                        {
                            batches_id:
                                Array.from(
                                    selectedBatchIds,
                                ),
                        },
                    );

                await loadData();

                setSelectedBatchIds(
                    new Set(),
                );

                setSuccessMessage(
                    `${generated.length} entries generated successfully.`,
                );
            } catch (err) {
                setError(
                    resolveAutoGenerationError(
                        err,
                    ),
                );
            } finally {
                setIsGenerating(false);
            }
        };

    return (
        <div className="min-h-screen p-6">
            <div className="mx-auto max-w-450">

                {/* HEADER */}
                <div className="mb-6 bg-white/30 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Timetable Dashboard
                            </h1>

                            <p className="mt-2 text-gray-500">
                                Batch wise timetable management
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={
                                handleAutoGenerate
                            }
                            disabled={
                                isGenerating ||
                                selectedBatchIds.size ===
                                0
                            }
                            className="flex items-center gap-2 bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                        >
                            <WandSparkles className="h-4 w-4" />

                            {isGenerating
                                ? "Generating..."
                                : `Auto Generate (${selectedBatchIds.size})`}
                        </button>
                    </div>
                </div>

                {/* STATS */}
                <div className="mb-6 grid gap-4 md:grid-cols-3">
                    <div className=" bg-white/50 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Entries
                                </p>

                                <h2 className="mt-2 text-3xl font-bold">
                                    {stats.totalEntries}
                                </h2>
                            </div>

                            <CalendarDays className="h-10 w-10 text-blue-500" />
                        </div>
                    </div>

                    <div className=" bg-white/50 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Batches
                                </p>

                                <h2 className="mt-2 text-3xl font-bold">
                                    {stats.totalBatches}
                                </h2>
                            </div>

                            <GraduationCap className="h-10 w-10 text-green-500" />
                        </div>
                    </div>

                    <div className=" bg-white/50 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">
                                    Teachers
                                </p>

                                <h2 className="mt-2 text-3xl font-bold">
                                    {stats.totalTeachers}
                                </h2>
                            </div>

                            <Users className="h-10 w-10 text-purple-500" />
                        </div>
                    </div>
                </div>

                {/* ALERT */}
                {error && (
                    <div className="mb-6 flex items-center gap-2 border border-red-200 bg-red-50 p-4 text-red-700">
                        <AlertCircle className="h-5 w-5" />
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="mb-6 flex items-center gap-2 border border-green-200 bg-green-50 p-4 text-green-700">
                        <CheckCircle className="h-5 w-5" />
                        {successMessage}
                    </div>
                )}

                {/* BATCH SELECT */}
                <div className="mb-6 bg-white/50 p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="text-xl font-bold">
                            Select Batches
                        </h2>

                        <button
                            type="button"
                            onClick={() =>
                                setSelectedBatchIds(
                                    new Set(
                                        sortedBatches.map(
                                            (b) => b.id,
                                        ),
                                    ),
                                )
                            }
                            className=" border px-4 py-2 hover:bg-gray-100"
                        >
                            Select All
                        </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
                        {sortedBatches.map(
                            (batch) => (
                                <label
                                    key={batch.id}
                                    className="flex cursor-pointer items-center gap-3 border p-4 hover:border-blue-400 hover:bg-blue-50"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedBatchIds.has(
                                            batch.id,
                                        )}
                                        onChange={(e) =>
                                            handleBatchSelect(
                                                batch.id,
                                                e.target.checked,
                                            )
                                        }
                                    />

                                    <div>
                                        <p className="font-semibold">
                                            {batch.name}
                                        </p>

                                        <p className="text-sm text-gray-500">
                                            Semester{" "}
                                            {
                                                batch.semester
                                            }
                                        </p>
                                    </div>
                                </label>
                            ),
                        )}
                    </div>
                </div>

                {/* FILTERS */}
                <div className="mb-6 border p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-2">
                        <Filter className="h-5 w-5" />

                        <h2 className="text-xl font-bold">
                            Filters
                        </h2>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />

                            <input
                                type="text"
                                value={searchFilter}
                                onChange={(e) =>
                                    setSearchFilter(
                                        e.target.value,
                                    )
                                }
                                placeholder="Search..."
                                className="w-full border border-gray-500 py-2 pl-10 pr-4 outline-none focus:border-blue-500"
                            />
                        </div>

                        <select
                            value={batchFilter}
                            onChange={(e) =>
                                setBatchFilter(
                                    e.target.value,
                                )
                            }
                            className="border border-gray-500 px-4 py-2"
                        >
                            <option value="all">
                                All Batches
                            </option>

                            {sortedBatches.map(
                                (batch) => (
                                    <option
                                        key={batch.id}
                                        value={batch.id}
                                    >
                                        {batch.name}
                                    </option>
                                ),
                            )}
                        </select>

                        <select
                            value={subjectFilter}
                            onChange={(e) =>
                                setSubjectFilter(
                                    e.target.value,
                                )
                            }
                            className="border border-gray-500 px-4 py-2"
                        >
                            <option value="all">
                                All Subjects
                            </option>

                            {sortedSubjects.map(
                                (subject) => (
                                    <option
                                        key={subject.id}
                                        value={subject.id}
                                    >
                                        {subject.name}
                                    </option>
                                ),
                            )}
                        </select>

                        <select
                            value={dayFilter}
                            onChange={(e) =>
                                setDayFilter(
                                    e.target.value,
                                )
                            }
                            className=" border border-gray-500 px-4 py-2"
                        >
                            <option value="all">
                                All Days
                            </option>

                            {weekdayOrder.map(
                                (day) => (
                                    <option
                                        key={day}
                                        value={day}
                                    >
                                        {formatDay(day)}
                                    </option>
                                ),
                            )}
                        </select>

                        <select
                            value={roomTypeFilter}
                            onChange={(e) =>
                                setRoomTypeFilter(
                                    e.target
                                        .value as
                                    | "all"
                                    | "lab"
                                    | "classroom",
                                )
                            }
                            className=" border border-gray-500 px-4 py-2"
                        >
                            <option value="all">
                                All Rooms
                            </option>

                            <option value="classroom">
                                Classroom
                            </option>

                            <option value="lab">
                                Lab
                            </option>
                        </select>
                    </div>
                </div>

                {/* TIMETABLE */}
                <div className="space-y-10">
                    {Array.from(
                        groupedByBatch.entries(),
                    ).map(
                        ([batchId, entries]) => {
                            const batch =
                                batchById.get(
                                    batchId,
                                );

                            const cellMap =
                                createCellMap(
                                    entries,
                                );

                            return (
                                <div
                                    key={batchId}
                                    className="overflow-hidden bg-white shadow-sm"
                                >
                                    {/* HEADER */}
                                    <div className="bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
                                        <h2 className="text-2xl font-bold">
                                            {
                                                batch?.name
                                            }
                                        </h2>

                                        <p className="mt-1 text-sm text-blue-100">
                                            Semester{" "}
                                            {
                                                batch?.semester
                                            }
                                        </p>
                                    </div>

                                    {/* TABLE */}
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full border-collapse">
                                            <thead>
                                                <tr className="bg-gray-100">
                                                    <th className="border p-4 text-left">
                                                        Day
                                                    </th>

                                                    {visibleSlots.map(
                                                        (
                                                            slot,
                                                        ) => (
                                                            <th
                                                                key={
                                                                    slot
                                                                }
                                                                className="min-w-65 border p-4 text-left"
                                                            >
                                                                {slot
                                                                    .split(
                                                                        "-",
                                                                    )
                                                                    .map(
                                                                        (
                                                                            time,
                                                                        ) =>
                                                                            formatTime(
                                                                                time,
                                                                            ),
                                                                    )
                                                                    .join(
                                                                        " - ",
                                                                    )}
                                                            </th>
                                                        ),
                                                    )}
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {visibleDays.map(
                                                    (
                                                        day,
                                                    ) => (
                                                        <tr
                                                            key={
                                                                day
                                                            }
                                                            className="hover:bg-gray-50"
                                                        >
                                                            <td className="border bg-gray-50 p-4 font-bold">
                                                                {formatDay(
                                                                    day,
                                                                )}
                                                            </td>

                                                            {visibleSlots.map(
                                                                (
                                                                    slotLabel,
                                                                ) => {
                                                                    const entries =
                                                                        cellMap.get(
                                                                            `${day}::${slotLabel}`,
                                                                        ) ??
                                                                        [];

                                                                    return (
                                                                        <td
                                                                            key={`${day}-${slotLabel}`}
                                                                            className="border p-3 align-top"
                                                                        >
                                                                            {entries.length ===
                                                                                0 ? (
                                                                                <div className="border border-dashed border-gray-500 p-5 text-center text-sm text-gray-400">
                                                                                    Empty
                                                                                </div>
                                                                            ) : (
                                                                                <div className="space-y-3">
                                                                                    {entries.map(
                                                                                        (
                                                                                            entry,
                                                                                        ) => {
                                                                                            const subject =
                                                                                                subjectById.get(
                                                                                                    entry.subject_id,
                                                                                                );

                                                                                            const teacher =
                                                                                                teacherById.get(
                                                                                                    entry.teacher_id,
                                                                                                );

                                                                                            const room =
                                                                                                roomById.get(
                                                                                                    entry.room_id,
                                                                                                );

                                                                                            return (
                                                                                                <button
                                                                                                    key={
                                                                                                        entry.id
                                                                                                    }
                                                                                                    type="button"
                                                                                                    onClick={() =>
                                                                                                        setSelectedTimetableId(
                                                                                                            entry.id,
                                                                                                        )
                                                                                                    }
                                                                                                    className={`w-full border p-4 text-left transition-all ${selectedTimetableId ===
                                                                                                            entry.id
                                                                                                            ? "border-blue-500 bg-blue-50 shadow"
                                                                                                            : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                                                                                                        }`}
                                                                                                >
                                                                                                    <div className="space-y-2">
                                                                                                        <div>
                                                                                                            <p className="text-xs uppercase tracking-wide text-gray-400">
                                                                                                                Subject
                                                                                                            </p>

                                                                                                            <p className="font-semibold text-gray-900">
                                                                                                                {
                                                                                                                    subject?.name
                                                                                                                }
                                                                                                            </p>
                                                                                                        </div>

                                                                                                        <div>
                                                                                                            <p className="text-xs uppercase tracking-wide text-gray-400">
                                                                                                                Teacher
                                                                                                            </p>

                                                                                                            <p className="text-sm text-gray-700">
                                                                                                                {
                                                                                                                    teacher?.abbreviation
                                                                                                                }{" "}
                                                                                                                -{" "}
                                                                                                                {
                                                                                                                    teacher?.name
                                                                                                                }
                                                                                                            </p>
                                                                                                        </div>

                                                                                                        <div>
                                                                                                            <p className="text-xs uppercase tracking-wide text-gray-400">
                                                                                                                Room
                                                                                                            </p>

                                                                                                            <p className="text-sm text-gray-700">
                                                                                                                {
                                                                                                                    room?.name
                                                                                                                }

                                                                                                                {room?.isLab && (
                                                                                                                    <span className="ml-2 bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                                                                                                                        LAB
                                                                                                                    </span>
                                                                                                                )}
                                                                                                            </p>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </button>
                                                                                            );
                                                                                        },
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                    );
                                                                },
                                                            )}
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        },
                    )}
                </div>
            </div>
        </div>
    );
}

export default TimeTable;