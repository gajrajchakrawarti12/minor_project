'use client';

import { useEffect, useMemo, useState } from "react";
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

import type { ApiError } from "@/shared/api/http";

import {
  createRoom,
  deleteRoom,
  listRooms,
  updateRoom,
  type Room,
  type RoomPayload,
} from "./api/roomApi";
import { authContext } from "../auth/authContext";

type RoomFormState = {
  name: string;
  isLab: string;
  departmentId: string;
};

const initialFormState: RoomFormState = {
  name: "",
  isLab: "false",
  departmentId: "",
};

const resolveErrorMessage = (
  error: unknown
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

  return "Something went wrong while processing the room request.";
};

const formatDepartmentName = (
  department?: Department
): string => {
  if (!department) {
    return "Common room";
  }

  return department.abbreviation.trim().length > 0
    ? `${department.name} (${department.abbreviation})`
    : department.name;
};

function Rooms() {
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
  const [rooms, setRooms] = useState<Room[]>([]);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [selectedRoomId, setSelectedRoomId] =
    useState<number | null>(null);

  const [formState, setFormState] =
    useState<RoomFormState>(
      initialFormState
    );

  const [isLoadingRooms, setIsLoadingRooms] =
    useState(false);

  const [
    isLoadingDepartments,
    setIsLoadingDepartments,
  ] = useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [isDeleting, setIsDeleting] =
    useState(false);

  const [error, setError] = useState<
    string | null
  >(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const selectedRoom = useMemo(
    () =>
      rooms.find(
        (room) => room.id === selectedRoomId
      ) ?? null,
    [rooms, selectedRoomId]
  );

  const departmentById = useMemo(
    () =>
      new Map<number, Department>(
        departments.map((department) => [
          department.id,
          department,
        ])
      ),
    [departments]
  );

  const sortedRooms = useMemo(
    () =>
      [...rooms].sort((left, right) =>
        left.name.localeCompare(right.name)
      ),
    [rooms]
  );

  useEffect(() => {
    const load = async () => {
      setIsLoadingRooms(true);
      setIsLoadingDepartments(true);
      setError(null);

      try {
        const [
          roomResponse,
          departmentResponse,
        ] = await Promise.all([
          listRooms(),
          listDepartments(),
        ]);

        setRooms(roomResponse);
        setDepartments(departmentResponse);
      } catch (err) {
        setError(resolveErrorMessage(err));
      } finally {
        setIsLoadingRooms(false);
        setIsLoadingDepartments(false);
      }
    };

    void load();
  }, []);

  const resetForm = (
    clearMessages = true
  ) => {
    setSelectedRoomId(null);

    setFormState(initialFormState);

    if (clearMessages) {
      setError(null);
      setSuccessMessage(null);
    }
  };

  const handleSelectRoom = (
    room: Room
  ) => {
    setSelectedRoomId(room.id);

    setFormState({
      name: room.name,
      isLab: room.isLab
        ? "true"
        : "false",
      departmentId:
        room.departmentId === null
          ? ""
          : String(room.departmentId),
    });

    setError(null);
    setSuccessMessage(null);
  };

  const buildPayload =
    (): RoomPayload | null => {
      if (!formState.name.trim()) {
        setError("Room name is required.");
        return null;
      }

      const departmentId =
        formState.departmentId.trim().length >
          0
          ? Number(formState.departmentId)
          : null;

      if (
        departmentId !== null &&
        (!Number.isInteger(departmentId) ||
          departmentId <= 0)
      ) {
        setError(
          "Department must be selected from the list or left empty."
        );

        return null;
      }

      return {
        name: formState.name.trim(),
        isLab:
          formState.isLab === "true",
        departmentId,
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
      if (selectedRoomId !== null) {
        const updated =
          await updateRoom(
            selectedRoomId,
            payload
          );

        setRooms((current) =>
          current.map((room) =>
            room.id === updated.id
              ? updated
              : room
          )
        );

        setSuccessMessage(
          "Room updated successfully."
        );
      } else {
        const created =
          await createRoom(payload);

        setRooms((current) => [
          created,
          ...current,
        ]);

        setSelectedRoomId(created.id);

        setSuccessMessage(
          "Room created successfully."
        );
      }

      resetForm(false);
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (selectedRoomId === null) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this room?"
    );

    if (!confirmed) {
      return;
    }

    setError(null);
    setSuccessMessage(null);

    setIsDeleting(true);

    try {
      await deleteRoom(selectedRoomId);

      setRooms((current) =>
        current.filter(
          (room) =>
            room.id !== selectedRoomId
        )
      );

      setSuccessMessage(
        "Room deleted successfully."
      );

      resetForm(false);
    } catch (err) {
      setError(resolveErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] p-6">
      <div className="mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Rooms
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Create and manage lecture
              rooms, labs, and common
              rooms
            </p>
          </div>

          <button
            onClick={() =>
              resetForm()
            }
            className="inline-flex items-center gap-2  bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />

            <span>New Room</span>
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 flex items-start gap-3  border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <p>{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 flex items-start gap-3  border border-green-200 bg-green-50 p-4 text-green-700">
            <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <p>{successMessage}</p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">

          {/* Room List */}
          <div className="lg:col-span-1">
            <div className=" border bg-white/10 shadow-sm">

              <div className="border-b p-4">
                <h2 className="text-lg font-semibold">
                  Room List
                </h2>
              </div>

              <div className="max-h-150 space-y-2 overflow-y-auto p-4">

                {isLoadingRooms ? (
                  <div className="py-8 text-center text-sm text-gray-500">
                    Loading rooms...
                  </div>
                ) : sortedRooms.length ===
                  0 ? (
                  <div className="py-8 text-center text-sm text-gray-500">
                    No rooms available
                  </div>
                ) : (
                  sortedRooms.map((room) => {
                    const department =
                      room.departmentId !==
                        null
                        ? departmentById.get(
                          room.departmentId
                        )
                        : undefined;

                    return (
                      <button
                        key={room.id}
                        onClick={() =>
                          handleSelectRoom(
                            room
                          )
                        }
                        className={`w-full  border p-4 text-left transition-all duration-200 ${selectedRoomId ===
                            room.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-500 hover:border-blue-300 hover:bg-gray-50"
                          }`}
                      >
                        <div className="font-semibold text-gray-900">
                          {room.name}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          {room.isLab
                            ? "Lab"
                            : "Standard room"}{" "}
                          |{" "}
                          {formatDepartmentName(
                            department
                          )}
                        </div>
                      </button>
                    );
                  })
                )}

              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <div className=" border bg-white/10 shadow-sm">

              <div className="border-b p-6">
                <h2 className="text-2xl font-semibold">
                  {selectedRoom
                    ? `Edit ${selectedRoom.name}`
                    : "Create Room"}
                </h2>
              </div>

              <div className="p-6">
                <form
                  onSubmit={
                    handleSubmit
                  }
                  className="space-y-6"
                >

                  {/* Room Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Room Name
                    </label>

                    <input
                      name="name"
                      value={
                        formState.name
                      }
                      onChange={(
                        event
                      ) =>
                        setFormState(
                          (
                            current
                          ) => ({
                            ...current,
                            name: event
                              .target
                              .value,
                          })
                        )
                      }
                      placeholder="Room 101"
                      className="w-full  border border-gray-600 bg-white/10 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>

                  {/* Room Type */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Room Type
                    </label>

                    <select
                      name="isLab"
                      value={
                        formState.isLab
                      }
                      onChange={(
                        event
                      ) =>
                        setFormState(
                          (
                            current
                          ) => ({
                            ...current,
                            isLab:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      className="w-full  border border-gray-600 bg-white/10 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="false">
                        Standard room
                      </option>

                      <option value="true">
                        Lab
                      </option>
                    </select>
                  </div>

                  {/* Department */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Department
                    </label>

                    <select
                      name="departmentId"
                      value={
                        formState.departmentId
                      }
                      onChange={(
                        event
                      ) =>
                        setFormState(
                          (
                            current
                          ) => ({
                            ...current,
                            departmentId:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                      disabled={
                        isLoadingDepartments
                      }
                      className="w-full  border border-gray-600 bg-white/10 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="">
                        Common room
                      </option>

                      {departments.map(
                        (
                          department
                        ) => (
                          <option
                            key={
                              department.id
                            }
                            value={
                              department.id
                            }
                          >
                            {department.abbreviation.trim()
                              .length > 0
                              ? `${department.name} (${department.abbreviation})`
                              : department.name}
                          </option>
                        )
                      )}
                    </select>

                    <p className="text-xs text-gray-500">
                      Leave empty for a
                      common room.
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-wrap gap-3 pt-2">

                    <button
                      type="submit"
                      disabled={
                        isSaving
                      }
                      className="inline-flex items-center justify-center  bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSaving
                        ? "Saving..."
                        : selectedRoom
                          ? "Update Room"
                          : "Create Room"}
                    </button>

                    {selectedRoomId !==
                      null && (
                        <button
                          type="button"
                          onClick={
                            handleDelete
                          }
                          disabled={
                            isDeleting
                          }
                          className="inline-flex items-center justify-center gap-2  bg-red-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />

                          {isDeleting
                            ? "Deleting..."
                            : "Delete Room"}
                        </button>
                      )}

                    <button
                      type="button"
                      onClick={() =>
                        resetForm()
                      }
                      className="inline-flex items-center justify-center  bg-gray-200 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-300"
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
    </div>
  );
}

export default Rooms;