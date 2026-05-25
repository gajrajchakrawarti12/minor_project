'use client';

import { useEffect, useMemo, useState, Fragment } from "react";
import {
  GraduationCap,
  Search,
  Users,
  DoorOpen,
} from "lucide-react";

import {
  listTimetables,
  type Timetable,
} from "@/features/timetable/api/timetableApi";

import {
  listBatches,
  type Batch,
} from "@/features/batches/api/batchApi";

import {
  listSubjects,
  type Subject,
} from "@/features/subjects/api/subjectApi";

import {
  listTeachers,
  type Teacher,
} from "@/features/teachers/api/teacherApi";

import {
  listRooms,
  type Room,
} from "@/features/rooms/api/roomApi";

const dayRows = [
  {
    day: "Monday",
    slots: [1, 2, 3, 4, 5, 6],
  },
  {
    day: "Tuesday",
    slots: [7, 8, 9, 10, 11, 12],
  },
  {
    day: "Wednesday",
    slots: [13, 14, 15, 16, 17, 18],
  },
  {
    day: "Thursday",
    slots: [19, 20, 21, 22, 23, 24],
  },
  {
    day: "Friday",
    slots: [25, 26, 27, 28, 29, 30],
  },
];

const timeHeaders = [
  "10:30 - 11:30",
  "11:30 - 12:30",
  "12:30 - 1:30",
  "2:30 - 3:30",
  "3:30 - 4:30",
  "4:30 - 5:30",
];

function Home() {
  const [timetables, setTimetables] = useState<
    Timetable[]
  >([]);

  const [batches, setBatches] = useState<
    Batch[]
  >([]);

  const [subjects, setSubjects] = useState<
    Subject[]
  >([]);

  const [teachers, setTeachers] = useState<
    Teacher[]
  >([]);

  const [rooms, setRooms] = useState<Room[]>([]);

  const [search, setSearch] = useState("");

  const [selectedBatchId, setSelectedBatchId] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [
          timetableData,
          batchData,
          subjectData,
          teacherData,
          roomData,
        ] = await Promise.all([
          listTimetables(),
          listBatches(),
          listSubjects(),
          listTeachers(),
          listRooms(),
        ]);

        if (!mounted) return;

        setTimetables(timetableData);
        setBatches(batchData);
        setSubjects(subjectData);
        setTeachers(teacherData);
        setRooms(roomData);
      } catch (error) {
        console.error(
          "Failed to load dashboard:",
          error,
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const batchMap = useMemo(() => {
    return new Map(
      batches.map((batch) => [
        batch.id,
        batch,
      ]),
    );
  }, [batches]);

  const subjectMap = useMemo(() => {
    return new Map(
      subjects.map((subject) => [
        subject.id,
        subject,
      ]),
    );
  }, [subjects]);

  const teacherMap = useMemo(() => {
    return new Map(
      teachers.map((teacher) => [
        teacher.id,
        teacher,
      ]),
    );
  }, [teachers]);

  const roomMap = useMemo(() => {
    return new Map(
      rooms.map((room) => [
        room.id,
        room,
      ]),
    );
  }, [rooms]);

  const groupedBatches = useMemo(() => {
    const grouped: Record<
      number,
      Timetable[]
    > = {};

    timetables.forEach((entry) => {
      if (!grouped[entry.batch_id]) {
        grouped[entry.batch_id] = [];
      }

      grouped[entry.batch_id].push(entry);
    });

    return grouped;
  }, [timetables]);

  const filteredBatchIds = useMemo(() => {
    return Object.keys(groupedBatches)
      .map(Number)
      .filter((batchId) => {
        const batch =
          batchMap.get(batchId);

        if (!search.trim()) return true;

        return (
          batch?.name
            ?.toLowerCase()
            .includes(
              search.toLowerCase(),
            ) ||
          batchId
            .toString()
            .includes(search)
        );
      });
  }, [groupedBatches, search, batchMap]);

  const activeBatchId =
    selectedBatchId ??
    filteredBatchIds[0] ??
    null;

  const activeSchedules =
    activeBatchId !== null
      ? groupedBatches[activeBatchId] ?? []
      : [];

  const renderCell = (
    slotId: number,
  ) => {
    const slot = activeSchedules.find(
      (item) =>
        item.time_slot_id === slotId,
    );

    if (!slot) {
      return (
        <td className="border">
          <div className="flex h-28 items-center justify-center text-xs">
            Empty
          </div>
        </td>
      );
    }

    const subject =
      subjectMap.get(slot.subject_id);

    const teacher =
      teacherMap.get(slot.teacher_id);

    const room = roomMap.get(slot.room_id);

    return (
      <td className="align-top border">
        <div className="flex flex-col justify-between p-3 transition hover:/80">
          <div>
            <div className={`mb-2 inline-flex px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${room?.isLab ? "bg-emerald-300 text-emerald-700" : "bg-blue-300 text-blue-700"}`}>
              {room?.isLab
                ? "Lab"
                : "Theory"}
            </div>

            <h3 className="line-clamp-2 text-sm font-semibold">
              {subject?.name ??
                "Unknown Subject"}
            </h3>
          </div>

          <div className="mt-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 ">
              <Users className="h-3.5 w-3.5 text-blue-400" />
              <span>
                {teacher?.abbreviation}{" "}
                {teacher?.name}
              </span>
            </div>

            <div className="flex items-center gap-2 ">
              <DoorOpen className="h-3.5 w-3.5 text-emerald-400" />
              <span>
                {room?.name}
              </span>
            </div>
          </div>
        </div>
      </td>
    );
  };

  return (
    <div className="min-h-screen">
      {/* MAIN */}
      <div className="mx-auto max-w-450 px-6 py-8">
        {/* SEARCH */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              Batch Timetables
            </h2>

            <p className="mt-1 text-sm">
              Select a batch to view
              its weekly class schedule.
            </p>
          </div>

          <div className="relative w-full lg:w-87.5">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" />

            <input
              type="text"
              placeholder="Search batch..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value,
                )
              }
              className="h-12 w-full border pl-11 pr-4 text-sm outline-none transition focus:border-blue-500"
            />
          </div>
        </div>

        {/* BATCH CARDS */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {filteredBatchIds.map(
            (batchId) => {
              const batch =
                batchMap.get(batchId);

              return (
                <button
                  key={batchId}
                  onClick={() =>
                    setSelectedBatchId(
                      batchId,
                    )
                  }
                  className={`border p-5 text-left transition-all ${activeBatchId ===
                      batchId
                      ? "border-blue-500 bg-blue-500/10 shadow-[0_0_40px_rgba(59,130,246,0.15)]"
                      : "border-zinc-800 "
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="bg-blue-500/25  p-3">
                      <GraduationCap className="h-5 w-5 text-blue-400" />
                    </div>

                    <span className="  px-3 py-1 text-xs ">
                      Batch ID{" "}
                      {batchId}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-bold">
                    {batch?.name ??
                      `Batch ${batchId}`}
                  </h3>

                  <p className="mt-1 text-sm">
                    Semester{" "}
                    {batch?.semester}
                  </p>

                  <div className="mt-5 flex items-center justify-between text-xs">
                    <span>
                      Weekly Schedule
                    </span>

                    <span className="text-blue-400">
                      View →
                    </span>
                  </div>
                </button>
              );
            },
          )}
        </div>

        {/* TABLE */}
        <div className="overflow-hidden  border border-zinc-800">
          {loading ? (
            <div className="flex h-96 items-center justify-center text-zinc-500">
              Loading timetable...
            </div>
          ) : activeBatchId === null ? (
            <div className="flex h-96 items-center justify-center text-zinc-500">
              No timetable found.
            </div>
          ) : (
            <>
              <div className="border border-zinc-800 px-6 py-5">
                <h2 className="text-3xl font-black">
                  {
                    batchMap.get(
                      activeBatchId,
                    )?.name
                  }
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Weekly class schedule
                  overview
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-350 border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-zinc-800 p-5 text-left text-sm font-semibold w-[11%]">
                        Day
                      </th>

                      {timeHeaders.map((time) => (
                        <Fragment key={time}>
                          {time === "2:30 - 3:30" && (
                            <th
                              className="border border-zinc-800 bg-yellow-500/10 p-5 text-center text-sm font-semibold w-[11%]"
                            >
                              1:30 - 2:30
                            </th>
                          )}

                          <th className="border border-zinc-800 p-5 text-sm font-semibold w-[11%]">
                            {time}
                          </th>
                        </Fragment>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {dayRows.map(
                      (day) => (
                        <tr
                          key={day.day}
                        >
                          <td className="border border-zinc-800  p-5 align-top">
                            <div className="sticky left-0">
                              <h3 className="text-lg font-bold">
                                {
                                  day.day
                                }
                              </h3>

                              <p className="mt-1 text-xs text-zinc-500">
                                Working Day
                              </p>
                            </div>
                          </td>

                          {day.slots.map(
                            (
                              slotId,
                              index,
                            ) => {
                              if (
                                index ===
                                3
                              ) {
                                return (
                                  <>
                                    <td className="p-3 text-center">
                                      <div className="flex h-28 items-center justify-center">
                                        <div>
                                          <p className="text-lg font-bold text-yellow-300">
                                            Lunch Break
                                          </p>
                                        </div>
                                      </div>
                                    </td>

                                    {renderCell(
                                      slotId,
                                    )}
                                  </>
                                );
                              }

                              return renderCell(
                                slotId,
                              );
                            },
                          )}
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;